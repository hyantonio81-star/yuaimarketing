/**
 * YouTube 계정 연동 및 업로드
 * OAuth 2.0: 인증 URL, code → refresh_token 저장(Supabase 사용자별), 업로드 시 access_token
 * env: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REDIRECT_URI
 * env: YOUTUBE_TOKEN_ENCRYPTION_KEY — 레거시 단일 파일 암호화(선택). Supabase 우선.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash, createHmac } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getLocalDataDir } from "../lib/localDataDir.js";
import { getSupabaseAdmin } from "../lib/supabaseServer.js";

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.force-ssl"];
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos";
const OAUTH_STATE_PREFIX = "v1";

/** OAuth state에 userId 없을 때(레거시) DB·파일 공용 행 */
export const YOUTUBE_LEGACY_USER_SENTINEL = "00000000-0000-0000-0000-000000000001";

const YOUTUBE_OAUTH_TABLE = "youtube_oauth_store";

function getOAuthStateSecret(): string {
  return (process.env.YOUTUBE_OAUTH_STATE_SECRET ?? process.env.CONNECTION_PIN_SECRET ?? "").trim();
}

/**
 * OAuth state 서명: v1:userId:accountKey:nonce:sig (userId = Supabase auth user uuid)
 * 레거시 4자리: v1:accountKey:nonce:sig → userId는 sentinel으로 처리
 */
export function signYoutubeOAuthState(accountKey: string = "default", userId: string): string {
  const secret = getOAuthStateSecret();
  const k = (accountKey ?? "").trim() || "default";
  const uid = (userId ?? "").trim() || YOUTUBE_LEGACY_USER_SENTINEL;
  if (!secret) return k;

  const nonce = randomBytes(16).toString("hex");
  const payload = `${uid}.${k}.${nonce}`;
  const sig = createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  return `${OAUTH_STATE_PREFIX}:${uid}:${k}:${nonce}:${sig}`;
}

export function verifyYoutubeOAuthState(state: string): { userId: string; key: string; nonce?: string } | null {
  const secret = getOAuthStateSecret();
  const raw = (state ?? "").trim();
  if (!raw) return { userId: YOUTUBE_LEGACY_USER_SENTINEL, key: "default" };

  if (!secret) {
    return { userId: YOUTUBE_LEGACY_USER_SENTINEL, key: raw || "default" };
  }

  if (!raw.startsWith(`${OAUTH_STATE_PREFIX}:`)) return null;
  const parts = raw.split(":");
  if (parts.length === 5) {
    const [, userId, key, nonce, sig] = parts;
    if (!userId || !key || !nonce || !sig) return null;
    const payload = `${userId}.${key}.${nonce}`;
    const expected = createHmac("sha256", secret).update(payload, "utf8").digest("hex");
    if (expected !== sig) return null;
    return { userId, key, nonce };
  }
  if (parts.length === 4) {
    const [, key, nonce, sig] = parts;
    if (!key || !nonce || !sig) return null;
    const payload = `${key}.${nonce}`;
    const expected = createHmac("sha256", secret).update(payload, "utf8").digest("hex");
    if (expected !== sig) return null;
    return { userId: YOUTUBE_LEGACY_USER_SENTINEL, key, nonce };
  }
  return null;
}

interface StoredTokens {
  refresh_token: string;
  access_token?: string;
  expiry_ms?: number;
}

interface PersistedTokens {
  refresh_token: string;
}

type UserYoutubeStore = {
  tokens: Map<string, StoredTokens>;
  labels: Map<string, string>;
  hydrated: boolean;
};

const stores = new Map<string, UserYoutubeStore>();
const hydrateLocks = new Map<string, Promise<void>>();

function normalizeUserId(userId: string | undefined): string {
  const u = (userId ?? "").trim();
  return u || YOUTUBE_LEGACY_USER_SENTINEL;
}

function getOrCreateEmptyStore(): UserYoutubeStore {
  return {
    tokens: new Map(),
    labels: new Map(),
    hydrated: false,
  };
}

async function loadFromSupabase(userId: string, into: UserYoutubeStore): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  const { data, error } = await supabase
    .from(YOUTUBE_OAUTH_TABLE)
    .select("tokens, labels")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return;
  const tok = data.tokens as Record<string, { refresh_token?: string }> | null;
  const lab = data.labels as Record<string, string> | null;
  if (tok && typeof tok === "object") {
    for (const [k, v] of Object.entries(tok)) {
      if (v?.refresh_token) into.tokens.set(k, { refresh_token: v.refresh_token });
    }
  }
  if (lab && typeof lab === "object") {
    for (const [k, v] of Object.entries(lab)) {
      if (typeof v === "string") into.labels.set(k, v);
    }
  }
}

async function saveToSupabase(userId: string, store: UserYoutubeStore): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  const tokens: Record<string, PersistedTokens> = {};
  for (const [k, v] of store.tokens) {
    tokens[k] = { refresh_token: v.refresh_token };
  }
  const labels: Record<string, string> = {};
  for (const [k, v] of store.labels) {
    labels[k] = v;
  }
  const now = new Date().toISOString();
  await supabase.from(YOUTUBE_OAUTH_TABLE).upsert(
    { user_id: userId, tokens, labels, updated_at: now },
    { onConflict: "user_id" }
  );
}

const TOKENS_FILENAME = "youtube-tokens.enc";

function getTokensPath(): string {
  return join(getLocalDataDir(), TOKENS_FILENAME);
}

function getEncryptionKey(): Buffer | null {
  const raw = (process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY ?? "").trim();
  if (raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  if (raw.length >= 16) {
    return createHash("sha256").update(raw, "utf8").digest();
  }
  return null;
}

function encrypt(plaintext: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, enc, authTag]).toString("hex");
}

function decrypt(hexPayload: string, key: Buffer): string | null {
  try {
    const buf = Buffer.from(hexPayload, "hex");
    if (buf.length < 12 + 16) return null;
    const iv = buf.subarray(0, 12);
    const authTag = buf.subarray(buf.length - 16);
    const enc = buf.subarray(12, buf.length - 16);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(enc) + decipher.final("utf8");
  } catch {
    return null;
  }
}

/** 레거시: 암호화 파일은 sentinel 행과 병합 (단일 테넌트 마이그레이션) */
async function loadLegacyEncryptedFile(into: UserYoutubeStore): Promise<void> {
  const key = getEncryptionKey();
  if (!key) return;
  const path = getTokensPath();
  if (!existsSync(path)) return;
  try {
    const hex = await readFile(path, "utf-8");
    const plain = decrypt(hex.trim(), key);
    if (!plain) return;
    const data = JSON.parse(plain) as { tokens?: Record<string, PersistedTokens>; labels?: Record<string, string> };
    if (data.tokens && typeof data.tokens === "object") {
      for (const [k, v] of Object.entries(data.tokens)) {
        if (v?.refresh_token && !into.tokens.has(k)) into.tokens.set(k, { refresh_token: v.refresh_token });
      }
    }
    if (data.labels && typeof data.labels === "object") {
      for (const [k, v] of Object.entries(data.labels)) {
        if (typeof v === "string" && !into.labels.has(k)) into.labels.set(k, v);
      }
    }
  } catch {
    /* ignore */
  }
}

async function saveLegacyEncryptedFile(store: UserYoutubeStore): Promise<void> {
  const key = getEncryptionKey();
  if (!key) return;
  const tokens: Record<string, PersistedTokens> = {};
  for (const [k, v] of store.tokens) {
    tokens[k] = { refresh_token: v.refresh_token };
  }
  const labels: Record<string, string> = {};
  for (const [k, v] of store.labels) {
    labels[k] = v;
  }
  const plain = JSON.stringify({ tokens, labels });
  const hex = encrypt(plain, key);
  const path = getTokensPath();
  const dir = join(path, "..");
  if (!existsSync(dir)) {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(dir, { recursive: true });
  }
  await writeFile(path, hex, "utf-8");
}

async function hydrateStore(userId: string, store: UserYoutubeStore): Promise<void> {
  await loadFromSupabase(userId, store);
  if (userId === YOUTUBE_LEGACY_USER_SENTINEL) {
    await loadLegacyEncryptedFile(store);
  }
  store.hydrated = true;
}

export async function getYoutubeStore(userId: string): Promise<UserYoutubeStore> {
  const id = normalizeUserId(userId);
  let store = stores.get(id);
  if (!store) {
    store = getOrCreateEmptyStore();
    stores.set(id, store);
  }
  if (store.hydrated) return store;

  const existingLock = hydrateLocks.get(id);
  if (existingLock) {
    await existingLock;
    return stores.get(id)!;
  }

  const lock = (async () => {
    const s = stores.get(id)!;
    if (!s.hydrated) await hydrateStore(id, s);
  })();
  hydrateLocks.set(id, lock);
  try {
    await lock;
  } finally {
    hydrateLocks.delete(id);
  }
  return stores.get(id)!;
}

/** 라우트 preHandler에서 호출: 해당 사용자 스토어 선로딩 */
export async function ensureYoutubeStoreLoaded(userId: string): Promise<void> {
  await getYoutubeStore(userId);
}

export const MAX_YT_ACCOUNTS = 5;

function getClientId(): string | null {
  return (process.env.YOUTUBE_CLIENT_ID ?? "").trim() || null;
}
function getClientSecret(): string | null {
  return (process.env.YOUTUBE_CLIENT_SECRET ?? "").trim() || null;
}
function getRedirectUri(): string {
  const redirectUri = (process.env.YOUTUBE_REDIRECT_URI ?? "").trim();
  if (!redirectUri) {
    throw new Error("YOUTUBE_REDIRECT_URI is required.");
  }
  return redirectUri;
}

/** OAuth 인증 URL */
export function getAuthUrl(accountKey: string | undefined, userId: string): { url: string; state: string } | null {
  const clientId = getClientId();
  if (!clientId) return null;
  const k = (accountKey ?? "default").trim() || "default";
  const uid = normalizeUserId(userId);
  const signedState = signYoutubeOAuthState(k, uid);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: signedState,
  });
  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, state: signedState };
}

export async function exchangeCodeAndStore(
  code: string,
  accountKey: string = "default",
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const clientId = getClientId();
  const clientSecret = getClientSecret();
  if (!clientId || !clientSecret) return { ok: false, error: "YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET not set" };
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getRedirectUri(),
    grant_type: "authorization_code",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.error_description || data.error || "Token exchange failed" };
  const refresh = data.refresh_token;
  if (!refresh) return { ok: false, error: "No refresh_token in response" };
  const k = (accountKey ?? "default").trim() || "default";
  const id = normalizeUserId(userId);
  const store = await getYoutubeStore(id);
  store.tokens.set(k, {
    refresh_token: refresh,
    access_token: data.access_token,
    expiry_ms: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
  });
  await saveToSupabase(id, store);
  await saveLegacyEncryptedFile(store).catch(() => {});
  return { ok: true };
}

async function getAccessTokenForUser(key: string, userId: string): Promise<string | null> {
  const store = await getYoutubeStore(normalizeUserId(userId));
  const stored = store.tokens.get((key ?? "default").trim() || "default");
  if (!stored) return null;
  if (stored.access_token && stored.expiry_ms && stored.expiry_ms > Date.now() + 60000) {
    return stored.access_token;
  }
  const body = new URLSearchParams({
    client_id: getClientId()!,
    client_secret: getClientSecret()!,
    refresh_token: stored.refresh_token,
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return null;
  stored.access_token = data.access_token;
  stored.expiry_ms = data.expires_in ? Date.now() + data.expires_in * 1000 : undefined;
  await saveToSupabase(normalizeUserId(userId), store);
  return stored.access_token ?? null;
}

export async function getConnectionStatus(
  key: string = "default",
  userId: string
): Promise<{ connected: boolean }> {
  const store = await getYoutubeStore(normalizeUserId(userId));
  const k = (key ?? "default").trim() || "default";
  return { connected: store.tokens.has(k) };
}

export async function disconnect(key: string = "default", userId: string): Promise<void> {
  const id = normalizeUserId(userId);
  const store = await getYoutubeStore(id);
  const k = (key ?? "default").trim() || "default";
  store.tokens.delete(k);
  store.labels.delete(k);
  await saveToSupabase(id, store);
  await saveLegacyEncryptedFile(store).catch(() => {});
}

export async function listAccounts(userId: string): Promise<{ key: string; label: string; connected: boolean }[]> {
  const store = await getYoutubeStore(normalizeUserId(userId));
  return Array.from(store.tokens.keys()).map((key) => ({
    key,
    label: store.labels.get(key) ?? key,
    connected: true,
  }));
}

export async function suggestNextKey(userId: string): Promise<string | null> {
  const store = await getYoutubeStore(normalizeUserId(userId));
  if (store.tokens.size >= MAX_YT_ACCOUNTS) return null;
  if (!store.tokens.has("default")) return "default";
  for (let i = 1; i <= MAX_YT_ACCOUNTS; i++) {
    const k = `yt_${i}`;
    if (!store.tokens.has(k)) return k;
  }
  return null;
}

export async function setAccountLabel(key: string, label: string, userId: string): Promise<void> {
  const k = (key ?? "").trim();
  if (!k) return;
  const id = normalizeUserId(userId);
  const store = await getYoutubeStore(id);
  if (label.trim()) store.labels.set(k, label.trim());
  else store.labels.delete(k);
  await saveToSupabase(id, store);
  await saveLegacyEncryptedFile(store).catch(() => {});
}

export async function getAccountLabel(key: string, userId: string): Promise<string | undefined> {
  const store = await getYoutubeStore(normalizeUserId(userId));
  return store.labels.get((key ?? "").trim());
}

export async function uploadVideo(
  videoPath: string,
  meta: { title: string; description?: string },
  key: string = "default",
  userId: string
): Promise<{ videoId: string; url: string } | { error: string }> {
  const accessToken = await getAccessTokenForUser(key, userId);
  if (!accessToken) return { error: "YouTube account not connected or token expired" };

  const fs = await import("fs").then((m) => m.promises).catch(() => null);
  if (!fs) return { error: "fs not available" };
  let fileBuffer: Buffer;
  try {
    fileBuffer = await fs.readFile(videoPath);
  } catch {
    return { error: "Video file not found or not generated (pipeline stub)" };
  }
  if (fileBuffer.length < 1000) return { error: "Video file too small (pipeline stub)" };

  const boundary = "-------shorts-upload-boundary";
  const snippet = {
    title: meta.title.slice(0, 100),
    description: (meta.description ?? "").slice(0, 5000),
    categoryId: "22",
    tags: ["shorts", "short"],
  };
  const bodyBuffer: Buffer = buildMultipartBody(boundary, snippet, fileBuffer);
  const bodyInit: BodyInit = new Uint8Array(bodyBuffer);

  const res = await fetch(`${UPLOAD_URL}?part=snippet,status&uploadType=multipart`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": String(bodyBuffer.length),
    },
    body: bodyInit,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { error: data.error?.message || data.error?.errors?.[0]?.message || "Upload failed" };
  const id = data.id;
  if (!id) return { error: "No video id in response" };
  return { videoId: id, url: `https://www.youtube.com/shorts/${id}` };
}

function buildMultipartBody(boundary: string, snippet: object, fileBuffer: Buffer): Buffer {
  const metaPart = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify({
      snippet: { ...snippet, categoryId: "22" },
      status: { privacyStatus: "private", selfDeclaredMadeForKids: false },
    }),
  ].join("\r\n");
  const mediaPart = [
    `--${boundary}`,
    "Content-Type: video/mp4",
    "",
  ].join("\r\n");
  const end = `\r\n--${boundary}--\r\n`;
  return Buffer.concat([
    Buffer.from(metaPart + "\r\n", "utf8"),
    Buffer.from(mediaPart + "\r\n", "utf8"),
    fileBuffer,
    Buffer.from(end, "utf8"),
  ]);
}

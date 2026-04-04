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
const VIDEOS_LIST_URL = "https://www.googleapis.com/youtube/v3/videos";

export type YoutubeUploadPreset = "shorts" | "long";

function defaultPrivacy(): "private" | "unlisted" | "public" {
  const p = (process.env.YOUTUBE_UPLOAD_PRIVACY ?? "private").trim().toLowerCase();
  if (p === "public" || p === "unlisted") return p;
  return "private";
}

async function pollYoutubeProcessingStatus(
  videoId: string,
  accessToken: string
): Promise<{ status: "succeeded" | "processing" | "failed"; detail?: string }> {
  const maxAttempts = 10;
  const delayMs = 2500;
  for (let i = 0; i < maxAttempts; i++) {
    const u = new URL(VIDEOS_LIST_URL);
    u.searchParams.set("part", "status,processingDetails");
    u.searchParams.set("id", videoId);
    const r = await fetch(u.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
    const j = (await r.json().catch(() => ({}))) as {
      items?: Array<{
        status?: { uploadStatus?: string; failureReason?: string; privacyStatus?: string };
        processingDetails?: { processingStatus?: string };
      }>;
    };
    const item = j.items?.[0];
    const uploadStatus = item?.status?.uploadStatus;
    const proc = item?.processingDetails?.processingStatus;
    if (uploadStatus === "processed") {
      return { status: "succeeded" };
    }
    if (uploadStatus === "failed" || proc === "failed") {
      return {
        status: "failed",
        detail: item?.status?.failureReason || "YouTube processing failed",
      };
    }
    await new Promise((res) => setTimeout(res, delayMs));
  }
  return { status: "processing", detail: "Still processing (poll timeout)" };
}
const OAUTH_STATE_PREFIX = "v1";

/** OAuth state에 userId 없을 때(레거시) DB·파일 공용 행 */
export const YOUTUBE_LEGACY_USER_SENTINEL = "00000000-0000-0000-0000-000000000001";

const YOUTUBE_OAUTH_TABLE = "youtube_oauth_store";

function getOAuthStateSecret(): string {
  return (process.env.YOUTUBE_OAUTH_STATE_SECRET ?? process.env.CONNECTION_PIN_SECRET ?? "").trim();
}

function isYoutubeOAuthProduction(): boolean {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

/**
 * Vercel/프로덕션에서 state 서명 비밀이 없으면 OAuth state에 로그인 user id를 넣을 수 없고,
 * 토큰이 레거시 sentinel 행에만 저장되어 목록 API는 항상 비어 보입니다.
 */
export function getYoutubeOAuthConfigError(): string | null {
  if (!isYoutubeOAuthProduction()) return null;
  if (!getOAuthStateSecret()) {
    return "Set YOUTUBE_OAUTH_STATE_SECRET or CONNECTION_PIN_SECRET on the server. Required in production so tokens are saved to your logged-in user (not the legacy placeholder id).";
  }
  return null;
}

export type YoutubeAuthUrlResult =
  | { ok: true; url: string; state: string }
  | { ok: false; error: string };

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
    if (isYoutubeOAuthProduction()) return null;
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

/** @returns null = success, string = error message */
async function saveToSupabase(userId: string, store: UserYoutubeStore): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return "Supabase admin not configured (check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server)";
  }
  const tokens: Record<string, PersistedTokens> = {};
  for (const [k, v] of store.tokens) {
    tokens[k] = { refresh_token: v.refresh_token };
  }
  const labels: Record<string, string> = {};
  for (const [k, v] of store.labels) {
    labels[k] = v;
  }
  const now = new Date().toISOString();
  const { error } = await supabase.from(YOUTUBE_OAUTH_TABLE).upsert(
    { user_id: userId, tokens, labels, updated_at: now },
    { onConflict: "user_id" }
  );
  if (error) {
    console.error("[youtube_oauth_store upsert]", error.message);
    const msg = error.message ?? "";
    if (/row-level security|rls/i.test(msg)) {
      return (
        `${msg} — 백엔드가 Supabase service_role 키 없이(anon 등) 접속한 경우에 자주 발생합니다. ` +
        "Vercel·로컬 backend/.env 의 SUPABASE_SERVICE_ROLE_KEY 에 Dashboard → Settings → API 의 service_role secret(JWT, 보통 eyJ로 시작)을 넣고 재시작·재배포하세요. anon 키를 service_role 칸에 넣지 마세요."
      );
    }
    return msg;
  }
  return null;
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
export function getAuthUrl(accountKey: string | undefined, userId: string): YoutubeAuthUrlResult {
  const clientId = getClientId();
  if (!clientId) return { ok: false, error: "YOUTUBE_CLIENT_ID not set" };

  const cfgErr = getYoutubeOAuthConfigError();
  if (cfgErr) return { ok: false, error: cfgErr };

  const uidRaw = (userId ?? "").trim();
  if (!uidRaw || uidRaw === YOUTUBE_LEGACY_USER_SENTINEL) {
    return { ok: false, error: "Sign in first, then connect YouTube (session user id missing)." };
  }

  const k = (accountKey ?? "default").trim() || "default";
  const signedState = signYoutubeOAuthState(k, uidRaw);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: signedState,
  });
  return { ok: true, url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, state: signedState };
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
  const persistErr = await saveToSupabase(id, store);
  if (persistErr) {
    store.tokens.delete(k);
    return { ok: false, error: `Could not save tokens to database: ${persistErr}` };
  }
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
  const persistErr = await saveToSupabase(normalizeUserId(userId), store);
  if (persistErr) console.warn("[youtube] refreshed access token not persisted:", persistErr);
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
  const prevTok = store.tokens.get(k);
  const prevLab = store.labels.get(k);
  store.tokens.delete(k);
  store.labels.delete(k);
  const persistErr = await saveToSupabase(id, store);
  if (persistErr) {
    if (prevTok) store.tokens.set(k, prevTok);
    if (prevLab !== undefined) store.labels.set(k, prevLab);
    throw new Error(persistErr);
  }
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
  const hadLabel = store.labels.has(k);
  const prevLabel = store.labels.get(k);
  if (label.trim()) store.labels.set(k, label.trim());
  else store.labels.delete(k);
  const persistErr = await saveToSupabase(id, store);
  if (persistErr) {
    if (hadLabel && prevLabel !== undefined) store.labels.set(k, prevLabel);
    else store.labels.delete(k);
    throw new Error(persistErr);
  }
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
  userId: string,
  options?: { uploadPreset?: YoutubeUploadPreset; privacy?: "private" | "unlisted" | "public" }
): Promise<
  | {
      videoId: string;
      url: string;
      youtubeProcessingStatus?: "processing" | "succeeded" | "failed";
      youtubeProcessingDetail?: string;
      uploadPreset?: YoutubeUploadPreset;
    }
  | { error: string }
> {
  const accessToken = await getAccessTokenForUser(key, userId);
  if (!accessToken) return { error: "YouTube account not connected or token expired" };

  const fs = await import("fs").then((m) => m.promises).catch(() => null);
  if (!fs) return { error: "fs not available" };
  let fileBuffer: Buffer;
  try {
    const p = videoPath.trim();
    if (p.startsWith("http://") || p.startsWith("https://")) {
      const res = await fetch(p);
      if (!res.ok) return { error: `Video URL fetch failed: ${res.status}` };
      fileBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      fileBuffer = await fs.readFile(p);
    }
  } catch {
    return { error: "Video file not found or not generated (pipeline stub)" };
  }
  if (fileBuffer.length < 1000) return { error: "Video file too small (pipeline stub)" };

  const preset: YoutubeUploadPreset = options?.uploadPreset === "long" ? "long" : "shorts";
  const privacy = options?.privacy ?? defaultPrivacy();
  const boundary = "-------shorts-upload-boundary";
  const snippet =
    preset === "long"
      ? {
          title: meta.title.slice(0, 100),
          description: (meta.description ?? "").slice(0, 5000),
          categoryId: "24",
          tags: ["long form", "video"],
        }
      : {
          title: meta.title.slice(0, 100),
          description: (meta.description ?? "").slice(0, 5000),
          categoryId: "22",
          tags: ["shorts", "short"],
        };
  const bodyBuffer: Buffer = buildMultipartBody(boundary, snippet, fileBuffer, privacy);
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

  const pollEnabled = (process.env.YOUTUBE_POLL_PROCESSING ?? "1").trim() !== "0";
  let youtubeProcessingStatus: "processing" | "succeeded" | "failed" | undefined;
  let youtubeProcessingDetail: string | undefined;
  if (pollEnabled) {
    const pr = await pollYoutubeProcessingStatus(id, accessToken);
    youtubeProcessingStatus = pr.status;
    youtubeProcessingDetail = pr.detail;
  }

  const url =
    preset === "long" ? `https://www.youtube.com/watch?v=${id}` : `https://www.youtube.com/shorts/${id}`;
  return {
    videoId: id,
    url,
    youtubeProcessingStatus,
    youtubeProcessingDetail,
    uploadPreset: preset,
  };
}

function buildMultipartBody(
  boundary: string,
  snippet: { title: string; description: string; categoryId: string; tags: string[] },
  fileBuffer: Buffer,
  privacy: "private" | "unlisted" | "public"
): Buffer {
  const metaPart = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify({
      snippet: { ...snippet },
      status: { privacyStatus: privacy, selfDeclaredMadeForKids: false },
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

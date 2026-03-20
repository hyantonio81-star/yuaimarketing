/**
 * YouTube 계정 연동 및 업로드
 * OAuth 2.0: 인증 URL 발급, code → refresh_token 저장, 업로드 시 access_token 사용
 * env: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REDIRECT_URI (optional)
 * env: YOUTUBE_TOKEN_ENCRYPTION_KEY (64자 hex, 선택) 설정 시 data/youtube-tokens.enc 에 암호화 저장·재시작 후 복원
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.force-ssl"];
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos";

interface StoredTokens {
  refresh_token: string;
  access_token?: string;
  expiry_ms?: number;
}

/** 영속화용: refresh_token만 저장 (access_token·expiry는 휘발성) */
interface PersistedTokens {
  refresh_token: string;
}

const tokenStore = new Map<string, StoredTokens>();
const labelStore = new Map<string, string>();

const TOKENS_FILENAME = "youtube-tokens.enc";

function getTokensPath(): string {
  return join(process.cwd(), "data", TOKENS_FILENAME);
}

/** YOUTUBE_TOKEN_ENCRYPTION_KEY: 64자 hex → 32 bytes. 미설정 시 null (영속화 비사용) */
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

async function loadFromFile(): Promise<void> {
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
        if (v?.refresh_token) tokenStore.set(k, { refresh_token: v.refresh_token });
      }
    }
    if (data.labels && typeof data.labels === "object") {
      for (const [k, v] of Object.entries(data.labels)) {
        if (typeof v === "string") labelStore.set(k, v);
      }
    }
  } catch {
    // ignore
  }
}

async function saveToFile(): Promise<void> {
  const key = getEncryptionKey();
  if (!key) return;
  const tokens: Record<string, PersistedTokens> = {};
  for (const [k, v] of tokenStore) {
    tokens[k] = { refresh_token: v.refresh_token };
  }
  const labels: Record<string, string> = {};
  for (const [k, v] of labelStore) {
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

/** 서버 기동 시 암호화된 파일에서 복원. YOUTUBE_TOKEN_ENCRYPTION_KEY 설정 시에만 동작 */
let loaded = false;
async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  await loadFromFile();
  loaded = true;
}

/** Shorts 라우트에서 첫 요청 시 한 번 호출하면 토큰/라벨 복원됨 */
export async function ensureYoutubeStoreLoaded(): Promise<void> {
  await ensureLoaded();
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

/** OAuth 인증 URL. state에 key를 넣어 callback에서 사용 (key = 계정 식별자, 예: default, yt_2) */
export function getAuthUrl(key?: string): { url: string; state: string } | null {
  const clientId = getClientId();
  if (!clientId) return null;
  const s = (key ?? "default").trim() || "default";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: s,
  });
  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, state: s };
}

/** code로 토큰 교환 후 저장 (key = "default" 또는 userId) */
export async function exchangeCodeAndStore(code: string, key: string = "default"): Promise<{ ok: boolean; error?: string }> {
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
  const k = (key ?? "default").trim() || "default";
  tokenStore.set(k, {
    refresh_token: refresh,
    access_token: data.access_token,
    expiry_ms: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
  });
  await saveToFile();
  return { ok: true };
}

async function getAccessToken(key: string = "default"): Promise<string | null> {
  const stored = tokenStore.get(key);
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
  return stored.access_token ?? null;
}

/** 연동 상태 */
export function getConnectionStatus(key: string = "default"): { connected: boolean } {
  return { connected: tokenStore.has(key) };
}

/** 연동 해제 */
export function disconnect(key: string = "default"): void {
  const k = (key ?? "default").trim() || "default";
  tokenStore.delete(k);
  labelStore.delete(k);
  saveToFile().catch(() => {});
}

/** 연동된 계정 목록 (key, label, connected) */
export function listAccounts(): { key: string; label: string; connected: boolean }[] {
  return Array.from(tokenStore.keys()).map((key) => ({
    key,
    label: labelStore.get(key) ?? key,
    connected: true,
  }));
}

/** 다음 추가 시 사용할 권장 key (최대 개수 미만일 때만) */
export function suggestNextKey(): string | null {
  if (tokenStore.size >= MAX_YT_ACCOUNTS) return null;
  if (!tokenStore.has("default")) return "default";
  for (let i = 1; i <= MAX_YT_ACCOUNTS; i++) {
    const k = `yt_${i}`;
    if (!tokenStore.has(k)) return k;
  }
  return null;
}

export function setAccountLabel(key: string, label: string): void {
  const k = (key ?? "").trim();
  if (!k) return;
  if (label.trim()) labelStore.set(k, label.trim());
  else labelStore.delete(k);
  saveToFile().catch(() => {});
}

export function getAccountLabel(key: string): string | undefined {
  return labelStore.get((key ?? "").trim());
}

/**
 * YouTube에 Shorts 업로드 (실제 파일이 있을 때만 성공)
 * videoPath: 로컬 mp4 경로. 스텁이거나 파일 없으면 실패 반환.
 */
export async function uploadVideo(
  videoPath: string,
  meta: { title: string; description?: string },
  key: string = "default"
): Promise<{ videoId: string; url: string } | { error: string }> {
  const accessToken = await getAccessToken(key);
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

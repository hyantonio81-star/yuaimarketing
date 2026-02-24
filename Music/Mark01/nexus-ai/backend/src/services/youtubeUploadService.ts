/**
 * YouTube 계정 연동 및 업로드
 * OAuth 2.0: 인증 URL 발급, code → refresh_token 저장, 업로드 시 access_token 사용
 * env: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REDIRECT_URI (optional)
 */

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.force-ssl"];
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos";

interface StoredTokens {
  refresh_token: string;
  access_token?: string;
  expiry_ms?: number;
}

const tokenStore = new Map<string, StoredTokens>();

function getClientId(): string | null {
  return (process.env.YOUTUBE_CLIENT_ID ?? "").trim() || null;
}
function getClientSecret(): string | null {
  return (process.env.YOUTUBE_CLIENT_SECRET ?? "").trim() || null;
}
function getRedirectUri(): string {
  return (process.env.YOUTUBE_REDIRECT_URI ?? "").trim() || "http://localhost:4000/api/shorts/youtube/callback";
}

/** OAuth 인증 URL (프론트에서 이 URL로 리다이렉트) */
export function getAuthUrl(state?: string): { url: string; state: string } | null {
  const clientId = getClientId();
  if (!clientId) return null;
  const s = state ?? `st-${Date.now()}`;
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
  tokenStore.set(key, {
    refresh_token: refresh,
    access_token: data.access_token,
    expiry_ms: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
  });
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
  tokenStore.delete(key);
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
  const body: Buffer = buildMultipartBody(boundary, snippet, fileBuffer);

  const res = await fetch(`${UPLOAD_URL}?part=snippet,status&uploadType=multipart`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": String(body.length),
    },
    body,
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

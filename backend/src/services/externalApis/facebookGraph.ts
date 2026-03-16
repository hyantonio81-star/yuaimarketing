/**
 * Facebook (Meta) Graph API
 * 공개 페이지 메타데이터·검색: App Access Token 필요 (Page Public Metadata Access 등 App Review 필요할 수 있음)
 * 환경변수: FB_ACCESS_TOKEN 또는 FB_APP_ID+FB_APP_SECRET (앱 토큰 생성)
 * https://developers.facebook.com/docs/graph-api
 */

const BASE = "https://graph.facebook.com";
const API_VERSION = "v21.0";

function getAccessToken(): string | null {
  const token = (process.env.FB_ACCESS_TOKEN ?? "").trim();
  if (token) return token;
  const appId = (process.env.FB_APP_ID ?? "").trim();
  const secret = (process.env.FB_APP_SECRET ?? "").trim();
  if (appId && secret) return `${appId}|${secret}`;
  return null;
}

export interface FacebookPageInfo {
  id: string;
  name?: string;
  link?: string;
  about?: string;
  category?: string;
  fan_count?: number;
  followers_count?: number;
  picture?: { data?: { url?: string } };
  location?: { city?: string; country?: string };
}

/**
 * 페이지 ID로 공개 정보 조회. 토큰 필요.
 */
export async function getPageById(pageId: string, fields = "id,name,link,about,category,fan_count,followers_count,picture,location"): Promise<FacebookPageInfo | null> {
  const token = getAccessToken();
  if (!token || !pageId) return null;
  const url = `${BASE}/${API_VERSION}/${encodeURIComponent(pageId)}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.error) return null;
    return json as FacebookPageInfo;
  } catch {
    return null;
  }
}

/**
 * 페이지 검색 (공개 페이지만). PPMA 권한 필요할 수 있음.
 */
export async function searchPages(q: string, options: { limit?: number; fields?: string } = {}): Promise<FacebookPageInfo[]> {
  const token = getAccessToken();
  if (!token || !q.trim()) return [];
  const limit = Math.min(25, Math.max(1, options.limit ?? 10));
  const fields = options.fields ?? "id,name,link,about,category,fan_count,followers_count,picture";
  const url = `${BASE}/${API_VERSION}/pages/search?q=${encodeURIComponent(q.slice(0, 100))}&fields=${encodeURIComponent(fields)}&limit=${limit}&access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const json = await res.json();
    if (json?.error) return [];
    const data = json?.data;
    return Array.isArray(data) ? (data as FacebookPageInfo[]) : [];
  } catch {
    return [];
  }
}

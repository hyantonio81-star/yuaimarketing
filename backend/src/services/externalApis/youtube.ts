/**
 * YouTube Data API v3
 * API 키: Google Cloud Console에서 YouTube Data API v3 사용 설정 후
 * 환경변수 GOOGLE_API_KEY 또는 YOUTUBE_API_KEY 설정
 * 일일 무료 쿼터 10,000 유닛 (검색 100유닛, 댓글 1유닛 등)
 */

const BASE = "https://www.googleapis.com/youtube/v3";

function getApiKey(): string | null {
  const key = (process.env.GOOGLE_API_KEY ?? process.env.YOUTUBE_API_KEY ?? "").trim();
  return key || null;
}

export interface YouTubeSearchItem {
  videoId: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails?: { default?: { url?: string }; medium?: { url?: string } };
}

export interface YouTubeCommentItem {
  id: string;
  textDisplay: string;
  textOriginal: string;
  authorDisplayName: string;
  likeCount: number;
  publishedAt: string;
}

/** 검색 (동영상). q=키워드, maxResults=5~50. API 키 필요 */
export async function searchVideos(
  q: string,
  options: { maxResults?: number; order?: "relevance" | "date" | "viewCount"; pageToken?: string } = {}
): Promise<{ items: YouTubeSearchItem[]; nextPageToken?: string }> {
  const key = getApiKey();
  if (!key) return { items: [] };
  const maxResults = Math.min(50, Math.max(1, options.maxResults ?? 10));
  const url = new URL(`${BASE}/search`);
  url.searchParams.set("key", key);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("q", q.slice(0, 200));
  url.searchParams.set("maxResults", String(maxResults));
  if (options.order) url.searchParams.set("order", options.order);
  if (options.pageToken) url.searchParams.set("pageToken", options.pageToken);
  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return { items: [] };
    const json = await res.json();
    const items = (json?.items ?? []).map((it: { id?: { videoId?: string }; snippet?: Record<string, unknown> }) => {
      const sn = it?.snippet ?? {};
      return {
        videoId: it?.id?.videoId ?? "",
        title: String(sn.title ?? ""),
        description: String(sn.description ?? ""),
        channelId: String(sn.channelId ?? ""),
        channelTitle: String(sn.channelTitle ?? ""),
        publishedAt: String(sn.publishedAt ?? ""),
        thumbnails: sn.thumbnails,
      };
    });
    return { items, nextPageToken: json?.nextPageToken ?? undefined };
  } catch {
    return { items: [] };
  }
}

/** 동영상 댓글 스레드 목록. videoId 필수, maxResults=1~100. API 키 필요 */
export async function getCommentThreads(
  videoId: string,
  options: { maxResults?: number; order?: "relevance" | "time"; pageToken?: string } = {}
): Promise<{ items: YouTubeCommentItem[]; nextPageToken?: string }> {
  const key = getApiKey();
  if (!key || !videoId) return { items: [] };
  const maxResults = Math.min(100, Math.max(1, options.maxResults ?? 20));
  const url = new URL(`${BASE}/commentThreads`);
  url.searchParams.set("key", key);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("videoId", videoId);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("textFormat", "plainText");
  if (options.order) url.searchParams.set("order", options.order);
  if (options.pageToken) url.searchParams.set("pageToken", options.pageToken);
  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return { items: [] };
    const json = await res.json();
    const items = (json?.items ?? []).map((it: { id?: string; snippet?: { topLevelComment?: { snippet?: Record<string, unknown> } } }) => {
      const top = it?.snippet?.topLevelComment?.snippet ?? {};
      return {
        id: it?.id ?? "",
        textDisplay: String(top.textDisplay ?? ""),
        textOriginal: String(top.textOriginal ?? ""),
        authorDisplayName: String(top.authorDisplayName ?? ""),
        likeCount: Number(top.likeCount ?? 0),
        publishedAt: String(top.publishedAt ?? ""),
      };
    });
    return { items, nextPageToken: json?.nextPageToken ?? undefined };
  } catch {
    return { items: [] };
  }
}

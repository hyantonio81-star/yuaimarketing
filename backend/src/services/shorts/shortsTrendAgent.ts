/**
 * Shorts 트렌드/리서치 에이전트: 키워드로 YouTube 인기 Shorts 주제 수집
 */
import { searchVideos } from "../externalApis/youtube.js";
import type { TrendTopic } from "./shortsTypes.js";

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export interface CollectTrendOptions {
  maxPerKeyword?: number;
}

/** 키워드별 YouTube 검색으로 트렌드 주제 후보 수집 */
export async function collectTrendTopics(
  keywords: string[],
  options?: CollectTrendOptions
): Promise<TrendTopic[]> {
  const maxPer = options?.maxPerKeyword ?? 5;
  const topics: TrendTopic[] = [];
  const seen = new Set<string>();

  for (const kw of keywords.slice(0, 10)) {
    if (!kw?.trim()) continue;
    try {
      const { items } = await searchVideos(kw.trim(), { maxResults: maxPer, order: "relevance" });
      for (const it of items ?? []) {
        const id = it.videoId || `manual-${simpleHash(it.title + kw)}`;
        if (seen.has(id)) continue;
        seen.add(id);
        topics.push({
          id,
          keyword: kw.trim(),
          title: it.title ?? "",
          summary: (it.description ?? "").slice(0, 200),
          source: "youtube",
          publishedAt: it.publishedAt ?? undefined,
          score: simpleHash(it.title + it.channelId) % 100,
        });
      }
    } catch {
      const manualId = `manual-${simpleHash(kw + Date.now())}`;
      if (!seen.has(manualId)) {
        seen.add(manualId);
        topics.push({
          id: manualId,
          keyword: kw.trim(),
          title: `${kw} 관련 트렌드`,
          summary: "수동/스텁 주제 (YouTube API 미설정 시)",
          source: "manual",
          score: 50,
        });
      }
    }
  }

  if (topics.length === 0) {
    topics.push({
      id: "stub-1",
      keyword: "Shorts",
      title: "YouTube Shorts 트렌드 예시",
      summary: "에이전트가 트렌드를 수집한 뒤 스크립트·이미지·영상을 생성합니다.",
      source: "manual",
      score: 60,
    });
  }

  return topics.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

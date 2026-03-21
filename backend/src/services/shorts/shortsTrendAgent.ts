/**
 * Shorts 트렌드/리서치 에이전트: 키워드로 YouTube 인기 Shorts 주제 수집
 */
import { searchVideos } from "../externalApis/youtube.js";
import { getGoogleSearch } from "../externalApis/serpApi.js";
import { getWinningTopics } from "./shortsStatsService.js";
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
  category?: string;
}

/** 키워드별 YouTube 검색 및 Google 검색 보강으로 트렌드 주제 후보 수집 */
export async function collectTrendTopics(
  keywords: string[],
  options?: CollectTrendOptions
): Promise<TrendTopic[]> {
  const maxPer = options?.maxPerKeyword ?? 5;
  const category = options?.category ?? "general";
  const topics: TrendTopic[] = [];
  const seen = new Set<string>();

  // 0. 최근 성과 기반 피드백 (Winning Keywords 추가)
  let baseKeywords = [...keywords];
  try {
    const winners = await getWinningTopics(3);
    if (winners.length > 0) {
      console.log(`[Feedback Loop] Boosting successful keywords: ${winners.join(", ")}`);
      baseKeywords = [...winners, ...baseKeywords];
    }
  } catch {
    // ignore stats error
  }

  for (const kw of baseKeywords.slice(0, 10)) {
    if (!kw?.trim()) continue;
    try {
      // 1. YouTube 검색
      const { items } = await searchVideos(kw.trim(), { maxResults: maxPer, order: "relevance" });
      
      // 2. Google 검색을 통한 정보 보강 (팩트체크 및 상세 맥락 확보)
      const googleRes = await getGoogleSearch(kw.trim(), { num: 3 });
      const extraContext = googleRes.items.map(i => i.snippet).filter(s => !!s).join("\n");

      for (const it of items ?? []) {
        const id = it.videoId || `manual-${simpleHash(it.title + kw)}`;
        if (seen.has(id)) continue;
        seen.add(id);
        
        // 검색 결과를 요약에 섞어 정보 보강
        const summary = (it.description ?? "").slice(0, 150) + (extraContext ? `\n\n[Context] ${extraContext.slice(0, 200)}` : "");

        topics.push({
          id,
          keyword: kw.trim(),
          title: it.title ?? "",
          summary,
          source: "youtube",
          category,
          publishedAt: it.publishedAt ?? undefined,
          score: (simpleHash(it.title + it.channelId) % 100) + (extraContext ? 10 : 0), // 정보 보강된 경우 가산점
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
          category,
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
      category: "general",
      score: 60,
    });
  }

  return topics.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

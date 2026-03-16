/**
 * 무료 뉴스 RSS 연동 (Reuters, BBC Business 등). API 키 불필요.
 */

import Parser from "rss-parser";

export interface RssNewsItem {
  title: string;
  summary: string;
  source: string;
  url?: string;
  date?: string;
  b2b_b2c: "b2b" | "b2c" | "both";
}

const RSS_FEEDS: { url: string; source: string; b2b_b2c: "b2b" | "b2c" | "both" }[] = [
  { url: "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best", source: "Reuters", b2b_b2c: "b2b" },
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml", source: "BBC Business", b2b_b2c: "b2b" },
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC World", b2b_b2c: "both" },
];

const parser = new Parser({ timeout: 8000 });

export async function fetchRssNewsItems(limitPerFeed = 5): Promise<RssNewsItem[]> {
  const all: RssNewsItem[] = [];
  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const items = (parsed.items ?? []).slice(0, limitPerFeed);
      for (const item of items) {
        all.push({
          title: (item.title ?? "").trim() || "Untitled",
          summary: (item.contentSnippet ?? item.content ?? item.title ?? "").trim().slice(0, 400),
          source: feed.source,
          url: item.link ?? undefined,
          date: item.pubDate ? new Date(item.pubDate).toISOString().slice(0, 10) : undefined,
          b2b_b2c: feed.b2b_b2c,
        });
      }
    } catch {
      // skip failed feed
    }
  }
  return all.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

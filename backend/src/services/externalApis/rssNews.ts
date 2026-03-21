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
  category?: string;
  language?: string;
}

const RSS_FEEDS: { url: string; source: string; b2b_b2c: "b2b" | "b2c" | "both"; category: string; language: string }[] = [
  // Global Economy & Business
  { url: "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best", source: "Reuters", b2b_b2c: "b2b", category: "economy", language: "en" },
  { url: "https://feeds.bbci.co.uk/news/business/rss.xml", source: "BBC Business", b2b_b2c: "b2b", category: "economy", language: "en" },
  
  // AI & Tech
  { url: "https://techcrunch.com/category/artificial-intelligence/feed/", source: "TechCrunch AI", b2b_b2c: "both", category: "ai", language: "en" },
  { url: "https://www.wired.com/feed/category/ai/latest/rss", source: "Wired AI", b2b_b2c: "both", category: "ai", language: "en" },

  // Health & Medicine
  { url: "https://www.medicalnewstoday.com/feed/rss", source: "Medical News Today", b2b_b2c: "b2c", category: "health", language: "en" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml", source: "NYT Health", b2b_b2c: "b2c", category: "health", language: "en" },

  // Lifestyle, Pets, Family
  { url: "https://www.thesprucepets.com/rss", source: "The Spruce Pets", b2b_b2c: "b2c", category: "lifestyle", language: "en" },
  { url: "https://www.scarymommy.com/feed", source: "Scary Mommy (Family)", b2b_b2c: "b2c", category: "lifestyle", language: "en" },

  // K-Pop & Korean Culture (English sources for global reach)
  { url: "https://www.soompi.com/feed", source: "Soompi", b2b_b2c: "b2c", category: "k-culture", language: "en" },
  { url: "https://www.allkpop.com/rss", source: "Allkpop", b2b_b2c: "b2c", category: "k-culture", language: "en" },

  // Mexico & Latin America (Spanish)
  { url: "https://www.eluniversal.com.mx/rss.xml", source: "El Universal (MX)", b2b_b2c: "both", category: "latam", language: "es" },
  { url: "https://www.diariolibre.com/rss/portada.xml", source: "Diario Libre (DO)", b2b_b2c: "both", category: "latam", language: "es" },
  { url: "https://elpais.com/rss/america/portada.xml", source: "El País América", b2b_b2c: "both", category: "latam", language: "es" },
];

const parser = new Parser({ timeout: 8000 });

export async function fetchRssNewsItems(limitPerFeed = 5, categoryFilter?: string): Promise<RssNewsItem[]> {
  const all: RssNewsItem[] = [];
  const feedsToFetch = categoryFilter ? RSS_FEEDS.filter(f => f.category === categoryFilter) : RSS_FEEDS;

  for (const feed of feedsToFetch) {
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
          category: feed.category,
          language: feed.language,
        });
      }
    } catch {
      // skip failed feed
    }
  }
  return all.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

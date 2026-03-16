/**
 * Threads 게시 (Step 3). 30분에 1건만 게시. 서비스 계정 연동 저장.
 * 게시 시 post log에 기록해 ROI/대시보드 연동용.
 */

import type { MarketplaceId } from "./types.js";

const POST_INTERVAL_MS = 30 * 60 * 1000; // 30분

interface ThreadsConnection {
  accountId: string;
  accessToken: string;
  displayName?: string;
  connectedAt: string;
}

export interface PostLogEntry {
  postId: string;
  accountId: string;
  platform: "threads";
  affiliateUrl?: string;
  productId?: string;
  marketplace?: MarketplaceId;
  publishedAt: string;
  postUrl?: string;
}

const connectionStore = new Map<string, ThreadsConnection>();
const postLog: PostLogEntry[] = [];
let lastPublishedAt = 0;
const MAX_POST_LOG = 500;

export function getThreadsConnection(accountId: string = "default"): ThreadsConnection | null {
  return connectionStore.get(accountId) ?? null;
}

export function setThreadsConnection(
  accountId: string,
  data: { accessToken: string; displayName?: string }
): ThreadsConnection {
  const conn: ThreadsConnection = {
    accountId,
    accessToken: data.accessToken,
    displayName: data.displayName,
    connectedAt: new Date().toISOString(),
  };
  connectionStore.set(accountId, conn);
  return conn;
}

export function disconnectThreads(accountId: string = "default"): void {
  connectionStore.delete(accountId);
}

export function getPostLog(limit: number = 50): PostLogEntry[] {
  return [...postLog].reverse().slice(0, limit);
}

export function canPublishNow(): { allowed: boolean; nextAllowedAt?: number } {
  const now = Date.now();
  if (now - lastPublishedAt >= POST_INTERVAL_MS) {
    return { allowed: true };
  }
  return { allowed: false, nextAllowedAt: lastPublishedAt + POST_INTERVAL_MS };
}

export interface PublishResult {
  ok: boolean;
  postId?: string;
  url?: string;
  error?: string;
  nextAllowedAt?: number;
}

/**
 * 스레드에 게시. 실제 연동 시 Meta Threads API 호출.
 * 30분당 1건 제한 적용. 게시 시 post log에 기록.
 */
export async function publishToThreads(
  accountId: string,
  body: {
    text: string;
    imageUrl?: string;
    landingPageUrl?: string;
    productId?: string;
    marketplace?: MarketplaceId;
  }
): Promise<PublishResult> {
  const check = canPublishNow();
  if (!check.allowed) {
    return { ok: false, error: "rate_limit_30min", nextAllowedAt: check.nextAllowedAt };
  }

  const conn = getThreadsConnection(accountId);
  if (!conn) {
    return { ok: false, error: "threads_not_connected" };
  }

  // Stub: 실제로는 Meta Threads API (또는 Instagram Graph API) 호출
  lastPublishedAt = Date.now();
  const postId = `threads_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const postUrl = `https://www.threads.net/@account/post/${postId}`;

  postLog.push({
    postId,
    accountId,
    platform: "threads",
    affiliateUrl: body.landingPageUrl,
    productId: body.productId,
    marketplace: body.marketplace,
    publishedAt: new Date().toISOString(),
    postUrl,
  });
  if (postLog.length > MAX_POST_LOG) postLog.shift();

  return {
    ok: true,
    postId,
    url: postUrl,
  };
}

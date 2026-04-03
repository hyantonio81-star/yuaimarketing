/**
 * In-memory rate limiter for AI and auth-sensitive endpoints.
 * Production: consider Redis or @fastify/rate-limit with store.
 */
import { createHash } from "node:crypto";

const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 min
const MAX_PER_WINDOW = 30;   // per key (AI)
const MAX_API_PER_WINDOW = 120; // per key (B2B/B2C 등 일반 API)
const MAX_LOGIN_PER_WINDOW = 5; // per key (Tienda Admin 로그인 시도)
const MAX_ENTRIES = 50_000; // safety cap for serverless/in-memory deployments

function cleanupExpired(now: number): void {
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}

function pruneIfNeeded(now: number): void {
  if (store.size <= MAX_ENTRIES) return;
  cleanupExpired(now);
  if (store.size <= MAX_ENTRIES) return;

  const entries = Array.from(store.entries()).sort((a, b) => a[1].resetAt - b[1].resetAt);
  const toDelete = store.size - MAX_ENTRIES;
  for (let i = 0; i < toDelete; i++) store.delete(entries[i][0]);
}

function getKey(req: { ip?: string; headers?: Record<string, string | string[] | undefined> }): string {
  const ip = req.ip ?? "anonymous";
  const authHeader = req.headers?.authorization;
  const authStr = Array.isArray(authHeader) ? authHeader[0] : authHeader;

  if (typeof authStr === "string") {
    const trimmed = authStr.trim();
    if (trimmed.length > 0) {
      const tokenLike = trimmed.toLowerCase().startsWith("bearer ") ? trimmed.slice(7).trim() : trimmed;
      const tokenHash = createHash("sha256").update(tokenLike, "utf8").digest("hex");
      // 토큰 원문은 저장하지 않고 해시만 키에 반영합니다.
      return `${ip}:auth:${tokenHash}`;
    }
  }

  return `${ip}:noauth`;
}

function checkLimit(req: { ip?: string; headers?: Record<string, string | string[] | undefined> }, keyPrefix: string, maxPerWindow: number): boolean {
  const key = `${keyPrefix}:${getKey(req)}`;

  const now = Date.now();
  cleanupExpired(now);
  pruneIfNeeded(now);

  let entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + WINDOW_MS };
    store.set(key, entry);
    return true;
  }
  entry.count += 1;
  if (entry.count > maxPerWindow) return false;
  return true;
}

export function checkRateLimit(req: { ip?: string; headers?: Record<string, string | string[] | undefined> }): boolean {
  return checkLimit(req, "ai", MAX_PER_WINDOW);
}

/** B2B/B2C 등 일반 API: IP당 1분 120회 초과 시 429 권장 */
export function checkRateLimitApi(req: { ip?: string; headers?: Record<string, string | string[] | undefined> }): boolean {
  return checkLimit(req, "api", MAX_API_PER_WINDOW);
}

/** Tienda Admin 로그인: IP당 1분 5회 초과 시 429 권장 */
export function checkRateLimitLogin(req: { ip?: string; headers?: Record<string, string | string[] | undefined> }): boolean {
  return checkLimit(req, "landing-login", MAX_LOGIN_PER_WINDOW);
}

export function getRateLimitRemaining(req: { ip?: string; headers?: Record<string, string | string[] | undefined> }): number {
  const key = `ai:${getKey(req)}`;
  const entry = store.get(key);
  if (!entry) return MAX_PER_WINDOW;
  if (Date.now() > entry.resetAt) return MAX_PER_WINDOW;
  return Math.max(0, MAX_PER_WINDOW - entry.count);
}

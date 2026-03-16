/**
 * In-memory rate limiter for AI and auth-sensitive endpoints.
 * Production: consider Redis or @fastify/rate-limit with store.
 */
const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 min
const MAX_PER_WINDOW = 30;   // per key (AI)
const MAX_API_PER_WINDOW = 120; // per key (B2B/B2C 등 일반 API)

function getKey(req: { ip?: string; headers?: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers?.["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.ip ?? "anonymous";
  return ip;
}

function checkLimit(req: { ip?: string; headers?: Record<string, string | string[] | undefined> }, keyPrefix: string, maxPerWindow: number): boolean {
  const key = `${keyPrefix}:${getKey(req)}`;
  const now = Date.now();
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

export function getRateLimitRemaining(req: { ip?: string; headers?: Record<string, string | string[] | undefined> }): number {
  const key = `ai:${getKey(req)}`;
  const entry = store.get(key);
  if (!entry) return MAX_PER_WINDOW;
  if (Date.now() > entry.resetAt) return MAX_PER_WINDOW;
  return Math.max(0, MAX_PER_WINDOW - entry.count);
}

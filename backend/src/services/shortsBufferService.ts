import { countShortsBufferEligibleJobs, runPipelineOnce } from "./shortsAgentService.js";
import { alertBufferCritical } from "./shortsAlertService.js";

function parseEnvInt(key: string, fallback: number): number {
  const v = parseInt(process.env[key] ?? "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

function parseBufferKeywords(): string[] {
  const raw = (process.env.SHORTS_BUFFER_KEYWORDS ?? "YouTube Shorts,trending").trim();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    /* comma-separated */
  }
  return raw.split(/[,，]/).map((k) => k.trim()).filter(Boolean);
}

export async function getShortsBufferStatus(): Promise<{
  count: number;
  max: number;
  min: number;
  target: number;
  needsRefill: boolean;
  atCap: boolean;
}> {
  const count = await countShortsBufferEligibleJobs();
  const max = parseEnvInt("SHORTS_BUFFER_MAX", 50);
  const min = parseEnvInt("SHORTS_BUFFER_MIN", 20);
  const targetRaw = parseEnvInt("SHORTS_BUFFER_TARGET", 40);
  const target = Math.min(targetRaw, max);
  return {
    count,
    max,
    min,
    target,
    needsRefill: count <= min,
    atCap: count >= max,
  };
}

export async function refillShortsBuffer(): Promise<{
  created: number;
  skippedReason?: string;
  countBefore: number;
  countAfter?: number;
}> {
  const ownerUserId = (process.env.SHORTS_BUFFER_OWNER_USER_ID ?? "").trim();
  const status = await getShortsBufferStatus();
  if (!ownerUserId) {
    if (status.needsRefill) {
      await alertBufferCritical(
        "SHORTS_BUFFER_OWNER_USER_ID 미설정 — MIN 이하인데 자동 리필을 실행할 수 없습니다. Vercel env를 설정하세요."
      );
    }
    return { created: 0, skippedReason: "missing_SHORTS_BUFFER_OWNER_USER_ID", countBefore: status.count };
  }
  if (status.atCap) {
    return { created: 0, skippedReason: "buffer_full", countBefore: status.count };
  }
  if (status.count > status.min) {
    return { created: 0, skippedReason: "buffer_above_min", countBefore: status.count };
  }

  let keywords = parseBufferKeywords();
  if (!keywords.length) keywords = ["YouTube Shorts"];

  const need = Math.min(status.target - status.count, status.max - status.count);
  if (need <= 0) {
    return { created: 0, skippedReason: "nothing_to_create", countBefore: status.count };
  }

  const youtubeKey = (process.env.SHORTS_BUFFER_YOUTUBE_KEY ?? "default").trim() || "default";
  let created = 0;
  for (let i = 0; i < need; i++) {
    const c = await countShortsBufferEligibleJobs();
    if (c >= status.max) break;
    await runPipelineOnce(keywords, {
      ownerUserId,
      uploadMode: "review_first",
      youtubeKey,
      skipGenerationLimits: true,
    });
    created += 1;
  }
  const countAfter = await countShortsBufferEligibleJobs();
  return { created, countBefore: status.count, countAfter };
}

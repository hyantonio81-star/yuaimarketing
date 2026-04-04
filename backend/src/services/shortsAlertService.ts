/**
 * 운영 알림: Slack Incoming Webhook 또는 범용 JSON POST.
 * SHORTS_ALERT_WEBHOOK_URL — POST JSON { "text": "..." } (Slack 호환)
 */
const BUFFER_ALERT_COOLDOWN_MS = Math.max(
  60_000,
  parseInt(process.env.SHORTS_ALERT_BUFFER_COOLDOWN_MS ?? "86400000", 10) || 86400000
);

let lastBufferEmptyAlert = 0;
let lastBufferCriticalAlert = 0;

async function postWebhook(payload: Record<string, unknown>): Promise<void> {
  const url = (process.env.SHORTS_ALERT_WEBHOOK_URL ?? "").trim();
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn("[shorts-alert] webhook HTTP", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.warn("[shorts-alert] webhook failed:", e instanceof Error ? e.message : e);
  }
}

export async function sendShortsAlert(title: string, detail: string): Promise<void> {
  const text = `*[Shorts]* ${title}\n${detail}`.slice(0, 8000);
  await postWebhook({ text });
}

export async function alertDistributionPermanentFailure(
  jobId: string,
  platform: string,
  error: string,
  queueItemId?: string
): Promise<void> {
  await sendShortsAlert(
    "배포 영구 실패",
    `jobId=${jobId} platform=${platform}${queueItemId ? ` queueId=${queueItemId}` : ""}\n${error.slice(0, 1500)}`
  );
}

/** 버퍼가 비었을 때(리필 크론 관점) — 쿨다운 적용 */
export async function alertBufferDepleted(context: string): Promise<void> {
  const now = Date.now();
  if (now - lastBufferEmptyAlert < BUFFER_ALERT_COOLDOWN_MS) return;
  lastBufferEmptyAlert = now;
  await sendShortsAlert("배포용 버퍼 비어 있음", context);
}

/** 버퍼 ≤ MIN 이고 자동 생성이 막혔을 때(설정 누락 등) — 별도 쿨다운 */
export async function alertBufferCritical(context: string): Promise<void> {
  const now = Date.now();
  if (now - lastBufferCriticalAlert < BUFFER_ALERT_COOLDOWN_MS) return;
  lastBufferCriticalAlert = now;
  await sendShortsAlert("버퍼 위험(리필 필요/설정 확인)", context);
}

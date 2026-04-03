// Shorts distribution queue worker (Cron/VM-friendly)
// Usage:
//   SHORTS_WORKER_SECRET=... SHORTS_WORKER_ENDPOINT=http://localhost:4000/api/shorts/distribution/queue/process node scripts/shorts-distribution-worker.mjs

const endpoint =
  process.env.SHORTS_WORKER_ENDPOINT?.trim() || "http://localhost:4000/api/shorts/distribution/queue/process";
const secret = process.env.SHORTS_WORKER_SECRET?.trim();
const limit = Math.min(50, Math.max(1, parseInt(process.env.SHORTS_WORKER_LIMIT ?? "5", 10) || 5));

if (!secret) {
  console.error("Missing env: SHORTS_WORKER_SECRET");
  process.exit(1);
}

const res = await fetch(endpoint, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-shorts-worker-secret": secret,
  },
  body: JSON.stringify({ limit }),
});

const data = await res.json().catch(() => ({}));
console.log(JSON.stringify({ ok: res.ok, status: res.status, data }, null, 2));
if (!res.ok) process.exit(1);


/**
 * Standalone health check — no backend dependency.
 * Use to verify API is deployed on Vercel: GET /api/health → 200.
 *
 * NOTE: This repo is ESM (`package.json` contains `"type":"module"`),
 * so we must use ESM exports (no `module.exports`).
 */
export default function handler(_req, res) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).end(
    JSON.stringify({ status: "ok", service: "yuaimarketing-api", source: "health.js" })
  );
}

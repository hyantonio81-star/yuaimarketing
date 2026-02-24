/**
 * Standalone health check — no backend dependency.
 * Use to verify API is deployed on Vercel: GET /api/health → 200.
 */
module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).end(JSON.stringify({ status: "ok", service: "yuaimarketing-api", source: "health.js" }));
};

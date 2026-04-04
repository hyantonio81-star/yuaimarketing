/**
 * GET /api/health — Vercel 전용. Supabase admin 클라이언트 생성 가능 여부만 표시(비밀값 미노출).
 * @see backend/src/lib/supabaseServer.ts
 */
import path from "node:path";
import { pathToFileURL } from "node:url";

export default async function handler(_req, res) {
  let supabase = "not_configured";
  try {
    const serverPath = path.join(process.cwd(), "backend/dist/lib/supabaseServer.js");
    const { getSupabaseAdmin } = await import(pathToFileURL(serverPath).href);
    supabase = getSupabaseAdmin() ? "configured" : "not_configured";
  } catch (err) {
    console.error("[api/health.js]", err);
    supabase = "check_failed";
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).end(
    JSON.stringify({
      status: "ok",
      service: "yuanto-ai-backend",
      supabase,
      source: "api/health.js",
    })
  );
}

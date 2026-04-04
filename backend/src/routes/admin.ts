import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAdmin } from "../lib/auth.js";
import { getSupabaseAdmin } from "../lib/supabaseServer.js";
import { checkFfmpegInstalled } from "../services/shorts/shortsHealthService.js";

/** 프로덕션(Vercel 또는 NODE_ENV=production)에서는 기본 비활성화. 첫 admin 생성 후 반드시 ADMIN_BOOTSTRAP_ENABLED=false 권장 */
const isProduction = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
const BOOTSTRAP_ENABLED = isProduction
  ? process.env.ADMIN_BOOTSTRAP_ENABLED === "true"
  : process.env.ADMIN_BOOTSTRAP_ENABLED !== "false";

export async function adminRoutes(app: FastifyInstance) {
  /** List users (admin only). Requires Authorization: Bearer <access_token> */
  app.get("/users", async (req: FastifyRequest, reply: FastifyReply) => {
    const adminUser = await requireAdmin(req, reply);
    if (!adminUser) return;

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return reply.code(503).send({ error: "Supabase not configured" });
    }
    try {
      const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 100 });
      if (error) {
        req.log.warn(error);
        return reply.code(500).send({ error: "Failed to list users", message: error.message });
      }
      const list = (users ?? []).map((u) => ({
        id: u.id,
        email: u.email,
        role: (u.app_metadata?.role as string) ?? "user",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      }));
      return { users: list };
    } catch (err) {
      req.log.error(err);
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  });

  /**
   * Readiness check for operations.
   * - Verifies Supabase configuration + critical table access
   * - Verifies server FFmpeg presence
   * - Useful for runbooks and smoke checks
   */
  app.get("/readiness", async (req: FastifyRequest, reply: FastifyReply) => {
    const adminUser = await requireAdmin(req, reply);
    if (!adminUser) return;

    const now = new Date().toISOString();
    const supabase = getSupabaseAdmin();

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    const anonKey = process.env.SUPABASE_ANON_KEY ?? "";
    const isServiceRoleValid =
      serviceRoleKey.trim().length > 0 &&
      !serviceRoleKey.startsWith("sb_secret_") &&
      serviceRoleKey.includes(".");

    const supabaseConfigured = !!process.env.SUPABASE_URL?.trim() && !!(isServiceRoleValid || anonKey.trim().length > 0);

    const checks: Array<{ table: string; column: string }> = [
      // Shorts stats & jobs
      { table: "shorts_stats", column: "job_id" },
      { table: "shorts_jobs", column: "id" },
      { table: "shorts_pipeline_jobs", column: "job_id" },
      { table: "shorts_daily_generation", column: "day" },
      { table: "shorts_distribution_queue", column: "id" },

      // Extended app state used across modules
      { table: "b2b_leads", column: "id" },
      { table: "link_clicks", column: "id" },
      { table: "review_analyses", column: "id" },
      { table: "kpi_goals", column: "organization_id" },
      { table: "promotion_plans", column: "id" },
      { table: "channel_profiles_store", column: "id" },
      { table: "shorts_settings_store", column: "id" },

      // B2C / core
      { table: "b2c_channel_connections", column: "id" },
      { table: "b2c_inventory", column: "id" },
      { table: "b2c_competitor_prices", column: "id" },
      { table: "b2c_settings", column: "organization_id" },
      { table: "b2c_pending_approvals", column: "id" },
      { table: "nexus_routine_runs", column: "id" },
    ];

    const results: Record<string, { ok: boolean; error?: string }> = {};

    const checkTable = async (table: string, column: string) => {
      if (!supabase) return { ok: false, error: "supabase_not_configured" };
      const { data, error } = await supabase
        .from(table)
        .select(column)
        .limit(1);
      if (error) return { ok: false, error: error.message };
      if (!data) return { ok: false, error: "empty_response" };
      return { ok: true };
    };

    const tablesOk: boolean[] = [];
    for (const c of checks) {
      const r = await checkTable(c.table, c.column);
      results[c.table] = r;
      tablesOk.push(r.ok);
    }

    const isServerlessRuntime = process.env.VERCEL === "1";
    const ffmpegInstalled = isServerlessRuntime ? true : await checkFfmpegInstalled();
    const ready = supabaseConfigured && tablesOk.every(Boolean) && ffmpegInstalled;

    reply.code(ready ? 200 : 503).send({
      status: ready ? "ok" : "not_ready",
      checkedAt: now,
      supabase: {
        configured: supabaseConfigured,
        serviceRoleValid: isServiceRoleValid,
        using: isServiceRoleValid ? "service_role" : "anon_key_fallback",
      },
      ffmpegInstalled,
      ffmpegCheckSkipped: isServerlessRuntime,
      tables: results,
    });
  });

  /**
   * One-time bootstrap: create first admin. No auth required.
   * Only succeeds when there are zero users with role=admin.
   * Set ADMIN_BOOTSTRAP_ENABLED=false to disable after first use.
   */
  app.post<{
    Body: { email?: string; password?: string };
  }>("/bootstrap", async (req: FastifyRequest<{ Body: { email?: string; password?: string } }>, reply: FastifyReply) => {
    if (!BOOTSTRAP_ENABLED) {
      return reply.code(403).send({ error: "Bootstrap disabled" });
    }
    const email = (req.body?.email ?? "").trim().toLowerCase();
    const password = req.body?.password ?? "";
    if (!email || !password) {
      return reply.code(400).send({ error: "email and password required" });
    }
    if (password.length < 8) {
      return reply.code(400).send({ error: "password must be at least 8 characters" });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return reply.code(503).send({ error: "Supabase not configured" });
    }
    try {
      const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const admins = (users ?? []).filter((u) => (u.app_metadata?.role as string) === "admin");
      if (admins.length > 0) {
        return reply.code(403).send({ error: "Admin already exists. Use seed-users or Supabase Dashboard." });
      }
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role: "admin" },
      });
      if (error) {
        req.log.warn(error);
        return reply.code(400).send({ error: error.message });
      }
      req.log.info({ email: data.user?.email }, "Admin bootstrap created");
      return { ok: true, message: "Admin created. Sign in with the provided email.", email: data.user?.email };
    } catch (err) {
      req.log.error(err);
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  });

  /** Check if bootstrap is still allowed (no admin exists yet). No auth. */
  app.get("/bootstrap-status", async (_req: FastifyRequest, reply: FastifyReply) => {
    if (!BOOTSTRAP_ENABLED) {
      return reply.send({ allowed: false, reason: "disabled" });
    }
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return reply.send({ allowed: false, reason: "no_supabase" });
    }
    try {
      const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const admins = (users ?? []).filter((u) => (u.app_metadata?.role as string) === "admin");
      return { allowed: admins.length === 0, reason: admins.length > 0 ? "admin_exists" : "ok" };
    } catch {
      return reply.send({ allowed: false, reason: "error" });
    }
  });
}

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAdmin } from "../lib/auth.js";
import { getSupabaseAdmin } from "../lib/supabaseServer.js";

const BOOTSTRAP_ENABLED = process.env.ADMIN_BOOTSTRAP_ENABLED !== "false";

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

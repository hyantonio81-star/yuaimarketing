/**
 * Backend auth: verify Supabase JWT and get user + role.
 * Use for admin-only routes and optional user context.
 */
import type { FastifyRequest, FastifyReply } from "fastify";
import { getSupabaseAdmin } from "./supabaseServer.js";

export interface AuthUser {
  id: string;
  email?: string;
  role: string;
  app_metadata?: Record<string, unknown>;
}

export async function getAuthUserFromRequest(req: FastifyRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) return null;
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return null;
    const role = (user.app_metadata?.role as string) ?? "user";
    return {
      id: user.id,
      email: user.email ?? undefined,
      role,
      app_metadata: user.app_metadata as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply): Promise<AuthUser | null> {
  const user = await getAuthUserFromRequest(req);
  if (!user) {
    reply.code(401).send({ error: "Unauthorized", message: "로그인이 필요합니다." });
    return null;
  }
  if (user.role !== "admin") {
    reply.code(403).send({ error: "Forbidden", message: "관리자만 접근할 수 있습니다." });
    return null;
  }
  return user;
}

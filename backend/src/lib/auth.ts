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
  // 로컬 개발 모드 바이패스 (NODE_ENV가 development이고 DEV_SKIP_AUTH가 'true'일 때만 작동)
  if (process.env.NODE_ENV === "development" && process.env.DEV_SKIP_AUTH === "true") {
    return {
      id: "dev-admin-id",
      email: "anto@yuanto.com",
      role: "admin",
      app_metadata: { role: "admin" },
    };
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) return null;
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    // 로컬 개발 환경에서 Supabase 인증이 일시적으로 실패할 경우 (네트워크 등) 
    // 토큰이 존재한다면 테스트를 위해 기본 사용자 정보를 반환하는 로직 추가 (DEV_SKIP_AUTH 가 'true'일 때만)
    if (error || !user) {
      if (process.env.NODE_ENV === "development" && process.env.DEV_SKIP_AUTH === "true") {
        console.warn("[Auth] getUser failed, but allowing in development mode. Error:", error?.message);
        // 토큰이 있는 경우 최소한의 유저 정보 반환 (주의: 운영 환경에서는 절대 금지)
        return {
          id: "dev-user",
          email: "anto@yuanto.com",
          role: "admin",
          app_metadata: { role: "admin" },
        };
      }
      if (error) console.error("[Auth] getUser error:", error.message);
      return null;
    }
    
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

/** 로그인한 사용자 필수. 미인증 시 401 반환 후 null */
export async function requireUser(req: FastifyRequest, reply: FastifyReply): Promise<AuthUser | null> {
  const user = await getAuthUserFromRequest(req);
  if (!user) {
    reply.code(401).send({ error: "Unauthorized", message: "Login required." });
    return null;
  }
  return user;
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

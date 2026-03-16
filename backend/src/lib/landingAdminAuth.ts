/**
 * 랜딩 Tienda 관리자 인증: 비밀번호 기반, 메모리 세션 토큰.
 * LANDING_ADMIN_PASSWORD env와 일치하면 로그인 성공 → 토큰 발급.
 */
import type { FastifyRequest, FastifyReply } from "fastify";
import { randomBytes } from "node:crypto";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const sessions = new Map<string, { expiresAt: number }>();

function getPassword(): string {
  return (process.env.LANDING_ADMIN_PASSWORD || "").trim();
}

function createToken(): string {
  return randomBytes(24).toString("base64url");
}

export function validateLandingAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const session = sessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export async function landingAdminLogin(password: string): Promise<{ token: string } | null> {
  const expected = getPassword();
  if (!expected || password !== expected) return null;
  const token = createToken();
  sessions.set(token, { expiresAt: Date.now() + SESSION_TTL_MS });
  return { token };
}

export function getLandingAdminToken(request: FastifyRequest): string | undefined {
  const authHeader = request.headers.authorization;
  return authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;
}

export async function requireLandingAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<boolean> {
  const token = getLandingAdminToken(request);
  return validateLandingAdminToken(token);
}

/**
 * 제휴/캠페인 단축 링크 리다이렉트: GET /go/:id → 302 to configured URL
 * 목적지 URL 변경 시 이 설정만 수정하면 됨 (포스트/광고 URL 고정).
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getSupabaseAdmin } from "../lib/supabaseServer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let redirectsMap: Record<string, string> = {};

async function loadRedirects(): Promise<Record<string, string>> {
  const paths = [
    process.env.REDIRECTS_JSON_PATH,
    join(process.cwd(), "backend", "data", "redirects.json"),
    join(__dirname, "..", "..", "data", "redirects.json"),
  ].filter(Boolean) as string[];
  for (const p of paths) {
    try {
      const raw = await readFile(p, "utf-8");
      const data = JSON.parse(raw);
      if (data && typeof data === "object") {
        return data as Record<string, string>;
      }
    } catch {
      continue;
    }
  }
  return {};
}

export async function goRedirectRoutes(app: FastifyInstance) {
  redirectsMap = await loadRedirects();

  const allowlistRaw = process.env.REDIRECT_ALLOWLIST ?? "";
  const allowlist = allowlistRaw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  function isAllowedRedirectUrl(url: string): boolean {
    try {
      const u = new URL(url);
      const protoOk = u.protocol === "http:" || u.protocol === "https:";
      if (!protoOk) return false;

      if (allowlist.length === 0) return true;
      const host = u.hostname.toLowerCase();

      // 간단 allowlist: exact match 또는 '.example.com' 같은 suffix 허용
      return allowlist.some((a) => a === host || (a.startsWith(".") ? host.endsWith(a) : host === a));
    } catch {
      return false;
    }
  }

  app.get<{ Params: { id: string } }>("/go/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const id = (request.params?.id ?? "").trim().toLowerCase();
    if (!id) return reply.code(404).send({ error: "Not found" });
    const url = redirectsMap[id] ?? process.env[`GO_${id.replace(/-/g, "_").toUpperCase()}`];
    if (!url || typeof url !== "string") return reply.code(404).send({ error: "Redirect not found" });
    if (!isAllowedRedirectUrl(url)) return reply.code(404).send({ error: "Redirect not allowed" });

    // 클릭 추적 (비동기, 리다이렉트 방해 금지) - 2026-03-20 build re-trigger
    const supabase = getSupabaseAdmin();
    if (supabase) {
      // link_clicks.client_ip_hash: SHA-256 hex of the client IP only (never store raw IP).
      const rawIp = (request.ip || "").trim();
      const client_ip_hash = rawIp
        ? createHash("sha256").update(rawIp, "utf8").digest("hex")
        : null;
      supabase.from("link_clicks").insert({
        link_id: id,
        target_url: url,
        referrer: (request.headers.referer as string) || null,
        user_agent: (request.headers["user-agent"] as string) || null,
        client_ip_hash,
      }).then(({ error }: { error: any }) => {
        if (error) app.log.warn(`Click tracking error for ${id}: ${error.message}`);
      });
    }

    return reply.redirect(url, 302);
  });
}

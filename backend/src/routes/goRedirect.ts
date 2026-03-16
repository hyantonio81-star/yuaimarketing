/**
 * 제휴/캠페인 단축 링크 리다이렉트: GET /go/:id → 302 to configured URL
 * 목적지 URL 변경 시 이 설정만 수정하면 됨 (포스트/광고 URL 고정).
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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

  app.get<{ Params: { id: string } }>("/go/:id", async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const id = (request.params?.id ?? "").trim().toLowerCase();
    if (!id) return reply.code(404).send({ error: "Not found" });
    const url = redirectsMap[id] ?? process.env[`GO_${id.replace(/-/g, "_").toUpperCase()}`];
    if (!url || typeof url !== "string") return reply.code(404).send({ error: "Redirect not found" });
    return reply.redirect(url, 302);
  });
}

import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env") });

import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dashboardRoutes } from "./routes/dashboard.js";
import { marketIntelRoutes } from "./routes/marketIntel.js";
import { competitorRoutes } from "./routes/competitors.js";
import { seoRoutes } from "./routes/seo.js";
import { threadsCommerceRoutes } from "./routes/threadsCommerce.js";
import { b2bRoutes } from "./routes/b2b.js";
import { b2cRoutes } from "./routes/b2c.js";
import { govRoutes } from "./routes/gov.js";
import { shortsRoutes } from "./routes/shorts.js";
import { goRedirectRoutes } from "./routes/goRedirect.js";
import { drProductsRoutes } from "./routes/drProducts.js";
import { nexusRoutes } from "./routes/nexus.js";
import { marketRoutes } from "./routes/market.js";
import { adminRoutes } from "./routes/admin.js";
import { contentAutomationRoutes } from "./routes/contentAutomation.js";
import { userSettingsRoutes } from "./routes/userSettings.js";
import { registerRoutes } from "./routes/index.js";
import { getSupabaseAdmin } from "./lib/supabaseServer.js";
import { startDailyRoutineScheduler } from "./jobs/dailyRoutineScheduler.js";

const fastify = Fastify({
  logger: true
});

async function buildServer() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.trim();
  await fastify.register(cors, {
    origin: allowedOrigins ? allowedOrigins.split(",").map((o) => o.trim()).filter(Boolean) : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Organization-Id", "X-Country"],
  });

  /** 보안 헤더: XSS·클릭재킹 완화 */
  fastify.addHook("onRequest", async (_request, reply) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("X-Frame-Options", "DENY");
    reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
    reply.header("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  });

  fastify.get("/health", async () => {
    const supabase = getSupabaseAdmin();
    const supabaseStatus = supabase ? "configured" : "not_configured";
    return { status: "ok", service: "yuanto-ai-backend", supabase: supabaseStatus };
  });

  registerRoutes(fastify);

  await fastify.register(dashboardRoutes, { prefix: "/api" });
  await fastify.register(marketIntelRoutes, { prefix: "/api/market-intel" });
  await fastify.register(competitorRoutes, { prefix: "/api/competitors" });
  await fastify.register(seoRoutes, { prefix: "/api/seo" });
  await fastify.register(threadsCommerceRoutes, { prefix: "/api/seo/threads-commerce" });
  await fastify.register(b2bRoutes, { prefix: "/api/b2b" });
  await fastify.register(b2cRoutes, { prefix: "/api/b2c" });
  await fastify.register(govRoutes, { prefix: "/api/gov" });
  await fastify.register(shortsRoutes, { prefix: "/api/shorts" });
  await fastify.register(goRedirectRoutes, { prefix: "/api" });
  await fastify.register(drProductsRoutes, { prefix: "/api/landing" });
  await fastify.register(nexusRoutes, { prefix: "/api/nexus" });
  await fastify.register(marketRoutes, { prefix: "/api/markets" });
  await fastify.register(adminRoutes, { prefix: "/api/admin" });
  await fastify.register(contentAutomationRoutes, { prefix: "/api/content-automation" });
  await fastify.register(userSettingsRoutes, { prefix: "/api/user" });

  /** PC/서버용: 프론트엔드 빌드 정적 서빙 (같은 포트에서 API + SPA 제공) */
  const candidates = [
    process.env.PUBLIC_DIR,
    join(__dirname, "..", "..", "frontend", "dist"),
    join(process.cwd(), "frontend", "dist"),
    join(process.cwd(), "nexus-ai", "frontend", "dist"),
  ].filter(Boolean) as string[];
  let publicDir: string | null = null;
  for (const dir of candidates) {
    if (dir && existsSync(dir) && existsSync(join(dir, "index.html"))) {
      publicDir = dir;
      fastify.log.info({ publicDir }, "Serving frontend from");
      break;
    }
  }
  if (publicDir) {
    await fastify.register(fastifyStatic, { root: publicDir });
    fastify.setNotFoundHandler(async (request, reply) => {
      if (request.method !== "GET") return reply.code(404).send();
      const indexPath = join(publicDir!, "index.html");
      if (!existsSync(indexPath)) return reply.code(404).send();
      const html = await readFile(indexPath, "utf-8");
      return reply.type("text/html").send(html);
    });
  }

  return fastify;
}

async function start() {
  try {
    const app = await buildServer();
    const port = Number(process.env.PORT) || 4000;
    await app.listen({ port, host: "0.0.0.0" });
    if (process.env.VERCEL !== "1") {
      startDailyRoutineScheduler(app.log as { info: (o: unknown, msg?: string) => void; error: (o: unknown, msg?: string) => void });
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

if (process.env.VERCEL !== "1") {
  start();
}

export { buildServer };

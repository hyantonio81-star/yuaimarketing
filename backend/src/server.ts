import Fastify from "fastify";
import cors from "@fastify/cors";
import { dashboardRoutes } from "./routes/dashboard.js";
import { marketIntelRoutes } from "./routes/marketIntel.js";
import { competitorRoutes } from "./routes/competitors.js";
import { seoRoutes } from "./routes/seo.js";
import { b2bRoutes } from "./routes/b2b.js";
import { b2cRoutes } from "./routes/b2c.js";
import { govRoutes } from "./routes/gov.js";
import { nexusRoutes } from "./routes/nexus.js";
import { registerRoutes } from "./routes/index.js";
import { getSupabaseAdmin } from "./lib/supabaseServer.js";

const fastify = Fastify({
  logger: true
});

async function buildServer() {
  await fastify.register(cors, {
    origin: true
  });

  fastify.get("/health", async () => {
    const supabase = getSupabaseAdmin();
    const supabaseStatus = supabase ? "configured" : "not_configured";
    return { status: "ok", service: "nexus-ai-backend", supabase: supabaseStatus };
  });

  registerRoutes(fastify);

  await fastify.register(dashboardRoutes, { prefix: "/api" });
  await fastify.register(marketIntelRoutes, { prefix: "/api/market-intel" });
  await fastify.register(competitorRoutes, { prefix: "/api/competitors" });
  await fastify.register(seoRoutes, { prefix: "/api/seo" });
  await fastify.register(b2bRoutes, { prefix: "/api/b2b" });
  await fastify.register(b2cRoutes, { prefix: "/api/b2c" });
  await fastify.register(govRoutes, { prefix: "/api/gov" });
  await fastify.register(nexusRoutes, { prefix: "/api/nexus" });

  return fastify;
}

async function start() {
  try {
    const app = await buildServer();
    const port = Number(process.env.PORT) || 4000;
    await app.listen({ port, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

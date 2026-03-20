import { FastifyInstance } from "fastify";
import { getPillars } from "../services/dashboardService.js";
import { requireUser } from "../lib/auth.js";

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return reply;
  });

  app.get("/pillars", async () => {
    return { pillars: getPillars() };
  });
}

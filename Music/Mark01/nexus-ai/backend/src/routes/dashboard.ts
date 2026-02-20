import { FastifyInstance } from "fastify";
import { getPillars } from "../services/dashboardService.js";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get("/pillars", async () => {
    return { pillars: getPillars() };
  });
}

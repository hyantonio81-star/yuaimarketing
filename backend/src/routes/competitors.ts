import { FastifyInstance } from "fastify";
import {
  getAutoTracking,
  getAlgorithms,
  getAlerts,
} from "../services/competitorService.js";

export async function competitorRoutes(app: FastifyInstance) {
  app.get("/tracking", async () => ({ tracking: getAutoTracking() }));
  app.get("/algorithms", async () => ({ algorithms: getAlgorithms() }));
  app.get("/alerts", async () => ({ alerts: getAlerts() }));
}

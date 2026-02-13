import { FastifyInstance } from "fastify";
import {
  getSources,
  getAnalysisTech,
  getResultOutputs,
} from "../services/marketIntelService.js";

export async function marketIntelRoutes(app: FastifyInstance) {
  app.get("/sources", async () => ({ sources: getSources() }));
  app.get("/analysis", async () => ({ analysis: getAnalysisTech() }));
  app.get("/results", async () => ({ results: getResultOutputs() }));
}

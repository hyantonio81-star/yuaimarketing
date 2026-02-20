import { FastifyInstance } from "fastify";

export async function registerRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return { message: "YuantO Ai backend ready" };
  });
}

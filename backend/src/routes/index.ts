import { FastifyInstance } from "fastify";

export async function registerRoutes(app: FastifyInstance) {
  // GET "/" is served by static (index.html) when frontend dist exists; no root JSON route
}

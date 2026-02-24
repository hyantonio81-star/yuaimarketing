import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  getDailyRoutine,
  runDailyRoutineTask,
  handleUserRequest,
  getProactiveAlerts,
} from "../services/nexusCoreService.js";
import { validateAiRequestBody } from "../lib/aiSecurity.js";
import { checkRateLimit } from "../lib/rateLimit.js";

interface HandleRequestBody {
  request: string;
  user?: { ui_style?: string };
}

export async function nexusRoutes(fastify: FastifyInstance) {
  fastify.get("/daily-routine", async () => {
    return getDailyRoutine();
  });

  fastify.post<{
    Body: { task_time?: string };
  }>("/daily-routine/run", async (request: FastifyRequest<{ Body: { task_time?: string } }>, reply: FastifyReply) => {
    const taskTime = request.body?.task_time;
    if (!taskTime) {
      return reply.code(400).send({ error: "task_time required (e.g. 02:00)" });
    }
    return await runDailyRoutineTask(String(taskTime));
  });

  fastify.post<{
    Body: HandleRequestBody;
  }>("/handle-request", async (request: FastifyRequest<{ Body: HandleRequestBody }>, reply: FastifyReply) => {
    if (!checkRateLimit(request)) {
      return reply.code(429).send({ error: "Too many requests. Try again later." });
    }
    const body = request.body;
    const rawRequest = body?.request;
    const validated = validateAiRequestBody(rawRequest);
    if (!validated.ok) {
      return reply.code(validated.statusCode).send({ error: validated.error });
    }
    if (validated.flagged) {
      request.log.warn({ input: rawRequest?.slice(0, 200) }, "AI request flagged for prompt-injection pattern");
    }
    return handleUserRequest({
      request: validated.sanitized,
      user: body?.user,
    });
  });

  fastify.get("/proactive-alerts", async () => {
    return getProactiveAlerts();
  });
}

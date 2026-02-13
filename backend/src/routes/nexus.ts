import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  getDailyRoutine,
  runDailyRoutineTask,
  handleUserRequest,
  getProactiveAlerts,
} from "../services/nexusCoreService.js";

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
    return runDailyRoutineTask(String(taskTime));
  });

  fastify.post<{
    Body: HandleRequestBody;
  }>("/handle-request", async (request: FastifyRequest<{ Body: HandleRequestBody }>, reply: FastifyReply) => {
    const body = request.body;
    if (body?.request == null) {
      return reply.code(400).send({ error: "request required" });
    }
    return handleUserRequest({
      request: String(body.request),
      user: body.user,
    });
  });

  fastify.get("/proactive-alerts", async () => {
    return getProactiveAlerts();
  });
}

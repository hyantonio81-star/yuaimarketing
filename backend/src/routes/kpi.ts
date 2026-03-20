import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireUser } from "../lib/auth.js";
import { sanitizeOrgId } from "../lib/apiSecurity.js";
import {
  loadKpiGoals,
  saveKpiGoals,
  type KpiGoal,
  type KpiGoalsStore,
} from "../services/kpiGoalsService.js";

export async function kpiRoutes(app: FastifyInstance) {
  const getOrgId = (req: FastifyRequest): string =>
    sanitizeOrgId((req.headers["x-organization-id"] as string | undefined) ?? "default");

  /** KPI 목표 목록 조회 (로그인 필수) */
  app.get("/goals", async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const store = await loadKpiGoals(getOrgId(req));
    return store;
  });

  /** KPI 목표 저장 (로그인 필수) */
  app.put<{ Body: { goals: KpiGoal[] } }>(
    "/goals",
    async (req: FastifyRequest<{ Body: { goals: KpiGoal[] } }>, reply: FastifyReply) => {
      const user = await requireUser(req, reply);
      if (!user) return;
      const goals = req.body?.goals;
      if (!Array.isArray(goals)) {
        return reply.code(400).send({ error: "goals array required" });
      }
      const normalized: KpiGoal[] = goals.map((g, i) => ({
        id: typeof g.id === "string" && g.id ? g.id : `goal-${i + 1}`,
        name: typeof g.name === "string" ? g.name : "",
        target: typeof g.target === "number" && g.target >= 0 ? g.target : 0,
        current: typeof g.current === "number" && g.current >= 0 ? g.current : undefined,
        category: g.category as KpiGoal["category"],
        deadline: typeof g.deadline === "string" ? g.deadline : undefined,
        unit: typeof g.unit === "string" ? g.unit : undefined,
      }));
      const store: KpiGoalsStore = { goals: normalized };
      await saveKpiGoals(store, getOrgId(req));
      return store;
    }
  );
}

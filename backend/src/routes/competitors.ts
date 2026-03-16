import { FastifyInstance } from "fastify";
import {
  getAutoTracking,
  getAlgorithms,
  getAlerts,
  getCompetitors,
  addCompetitor,
  deleteCompetitor,
  getCompetitorEvents,
  getCompetitorReports,
  generateCompetitorReport,
  getAlertSettings,
  setAlertSettings,
  getTrackingProfile,
  setTrackingProfile,
  getIndustryOptions,
} from "../services/competitorService.js";

export async function competitorRoutes(app: FastifyInstance) {
  app.get("/tracking", async () => ({ tracking: getAutoTracking() }));
  app.get("/algorithms", async () => ({ algorithms: getAlgorithms() }));
  app.get("/alerts", async () => ({ alerts: getAlerts() }));

  /** 관심 스코프 (업계·제품) — needs 파악 및 추적/학습용 */
  app.get<{ Querystring: { orgId?: string; country?: string } }>("/tracking-profile", async (req) => {
    const orgId = req.query?.orgId ?? "default";
    const country = req.query?.country ?? "ALL";
    const profile = getTrackingProfile(orgId, country);
    return { profile };
  });

  app.put<{
    Body: { orgId?: string; country?: string; industries?: string[]; product_focus?: string[]; additional_countries?: string[] };
  }>("/tracking-profile", async (req) => {
    const orgId = (req.body?.orgId as string) ?? "default";
    const country = (req.body?.country as string) ?? "ALL";
    const profile = setTrackingProfile(orgId, country, {
      industries: req.body?.industries,
      product_focus: req.body?.product_focus,
      additional_countries: req.body?.additional_countries,
    });
    return { profile };
  });

  /** 업계 옵션 (다국어) */
  app.get<{ Querystring: { lang?: string } }>("/industry-options", async (req) => {
    const lang = (req.query?.lang as "ko" | "en" | "es") ?? "ko";
    return { options: getIndustryOptions(lang) };
  });

  /** 추적 중인 경쟁사 목록 (조직·국가 스코프) */
  app.get<{ Querystring: { orgId?: string; country?: string } }>("/list", async (req) => {
    const orgId = req.query?.orgId ?? "default";
    const country = req.query?.country ?? "ALL";
    return { competitors: getCompetitors(orgId, country) };
  });

  app.post<{
    Body: { orgId?: string; country?: string; name?: string; url?: string; tracking_types?: string[] };
  }>("/list", async (req, reply) => {
    const orgId = (req.body?.orgId as string) ?? "default";
    const country = (req.body?.country as string) ?? "ALL";
    const name = req.body?.name as string | undefined;
    if (!name || !name.trim()) {
      return reply.status(400).send({ error: "name required" });
    }
    const tracking_types = (req.body?.tracking_types as string[] | undefined)?.filter((t) =>
      ["website", "price", "product", "hiring", "patent", "ads"].includes(t)
    ) as import("../services/competitorService.js").TrackingType[] | undefined;
    const competitor = addCompetitor(orgId, country, {
      name: name.trim(),
      url: req.body?.url as string | undefined,
      tracking_types,
    });
    return { competitor };
  });

  app.delete<{ Querystring: { orgId?: string; country?: string; id?: string } }>("/list", async (req, reply) => {
    const orgId = req.query?.orgId ?? "default";
    const country = req.query?.country ?? "ALL";
    const id = req.query?.id as string | undefined;
    if (!id) {
      return reply.status(400).send({ error: "id required" });
    }
    const deleted = deleteCompetitor(orgId, country, id);
    if (!deleted) return reply.status(404).send({ error: "competitor not found" });
    return { ok: true };
  });

  /** 최근 알림/이벤트 */
  app.get<{ Querystring: { orgId?: string; country?: string; limit?: string } }>("/events", async (req) => {
    const orgId = req.query?.orgId ?? "default";
    const country = req.query?.country ?? "ALL";
    const limit = Math.min(50, Math.max(1, parseInt(req.query?.limit ?? "20", 10) || 20));
    return { events: getCompetitorEvents(orgId, country, limit) };
  });

  /** 주간 경쟁사 리포트 목록 */
  app.get<{ Querystring: { orgId?: string; country?: string } }>("/reports", async (req) => {
    const orgId = req.query?.orgId ?? "default";
    const country = req.query?.country ?? "ALL";
    return { reports: getCompetitorReports(orgId, country) };
  });

  /** 리포트 생성 (1회 / 주간 / 월간). body.schedule: "once" | "weekly" | "monthly" */
  app.post<{ Body: { orgId?: string; country?: string; schedule?: string } }>("/reports/generate", async (req) => {
    const orgId = (req.body?.orgId as string) ?? "default";
    const country = (req.body?.country as string) ?? "ALL";
    const schedule = ["once", "weekly", "monthly"].includes(req.body?.schedule as string)
      ? (req.body?.schedule as import("../services/competitorService.js").ReportSchedule)
      : undefined;
    const report = generateCompetitorReport(orgId, country, { schedule });
    return report;
  });

  /** 알림 수신 설정 */
  app.get<{ Querystring: { orgId?: string; country?: string } }>("/alert-settings", async (req) => {
    const orgId = req.query?.orgId ?? "default";
    const country = req.query?.country ?? "ALL";
    return { settings: getAlertSettings(orgId, country) };
  });

  app.put<{
    Body: { orgId?: string; country?: string; settings?: Partial<import("../services/competitorService.js").AlertSettings> };
  }>("/alert-settings", async (req) => {
    const orgId = (req.body?.orgId as string) ?? "default";
    const country = (req.body?.country as string) ?? "ALL";
    const settings = (req.body?.settings as Partial<import("../services/competitorService.js").AlertSettings>) ?? {};
    const updated = setAlertSettings(orgId, country, settings);
    return { settings: updated };
  });
}

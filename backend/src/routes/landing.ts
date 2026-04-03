/**
 * 랜딩 페이지용 공개 API.
 * - POST /contact: 문의 폼 제출 (이메일 전송 또는 저장은 환경에 따라 확장)
 * - POST /newsletter: 뉴스레터 구독 이메일 저장
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getLocalDataDir } from "../lib/localDataDir.js";

interface ContactBody {
  inquiryType?: string;
  name?: string;
  email?: string;
  message?: string;
}

interface NewsletterBody {
  email?: string;
  source?: string;
}

interface NewsletterEntry {
  email: string;
  source: string;
  created_at: string;
}

const NEWSLETTER_PATH = join(getLocalDataDir(), "landing-newsletter.json");

async function loadNewsletterEntries(): Promise<NewsletterEntry[]> {
  try {
    if (!existsSync(NEWSLETTER_PATH)) return [];
    const raw = await readFile(NEWSLETTER_PATH, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as NewsletterEntry[]) : [];
  } catch {
    return [];
  }
}

async function saveNewsletterEntries(entries: NewsletterEntry[]): Promise<void> {
  const dir = join(NEWSLETTER_PATH, "..");
  if (!existsSync(dir)) {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(dir, { recursive: true });
  }
  await writeFile(NEWSLETTER_PATH, JSON.stringify(entries, null, 2), "utf-8");
}

export async function landingRoutes(app: FastifyInstance) {
  app.post<{ Body: ContactBody }>(
    "/contact",
    async (request: FastifyRequest<{ Body: ContactBody }>, reply: FastifyReply) => {
      const body = request.body || {};
      const inquiryType = String(body.inquiryType ?? "general").trim();
      const name = String(body.name ?? "").trim();
      const email = String(body.email ?? "").trim();
      const message = String(body.message ?? "").trim();

      if (!email) {
        return reply.code(400).send({ error: "Email is required" });
      }

      request.log.info(
        { inquiryType, name, email, messageLength: message.length },
        "Landing contact form submission"
      );

      // TODO: send email (e.g. Resend, SendGrid) or store in DB
      return reply.send({ ok: true, message: "Received" });
    }
  );

  app.post<{ Body: NewsletterBody }>(
    "/newsletter",
    async (request: FastifyRequest<{ Body: NewsletterBody }>, reply: FastifyReply) => {
      const body = request.body || {};
      const email = String(body.email ?? "").trim().toLowerCase();
      const source = String(body.source ?? "landing-home").trim() || "landing-home";
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return reply.code(400).send({ error: "Valid email is required" });
      }

      const entries = await loadNewsletterEntries();
      const exists = entries.some((x) => x.email === email);
      if (!exists) {
        entries.push({
          email,
          source,
          created_at: new Date().toISOString(),
        });
        await saveNewsletterEntries(entries);
      }
      return reply.send({ ok: true, subscribed: !exists });
    }
  );
}

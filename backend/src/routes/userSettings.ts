/**
 * 사용자 설정: 연동 관리 진입용 2차 PIN
 * GET /api/user/connection-pin → { configured }
 * POST /api/user/connection-pin → { action: 'set'|'verify', pin }
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getAuthUserFromRequest } from "../lib/auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "..", "data");
const CONNECTION_PINS_PATH = join(DATA_DIR, "connection-pins.json");
const SECRET = (process.env.CONNECTION_PIN_SECRET ?? "connection-pin-default").trim();

function hashPin(userId: string, pin: string): string {
  return createHash("sha256").update(SECRET + userId + pin, "utf8").digest("hex");
}

async function loadPins(): Promise<Record<string, string>> {
  try {
    if (!existsSync(CONNECTION_PINS_PATH)) return {};
    const raw = await readFile(CONNECTION_PINS_PATH, "utf-8");
    const data = JSON.parse(raw);
    return typeof data === "object" && data !== null ? data : {};
  } catch {
    return {};
  }
}

async function savePins(pins: Record<string, string>): Promise<void> {
  await writeFile(CONNECTION_PINS_PATH, JSON.stringify(pins, null, 2), "utf-8");
}

export async function userSettingsRoutes(app: FastifyInstance) {
  async function requireUser(req: FastifyRequest, reply: FastifyReply) {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      reply.code(401).send({ error: "Unauthorized", message: "Login required." });
      throw new Error("Unauthorized");
    }
    return user;
  }

  /** 연동 전용 PIN 설정 여부 */
  app.get("/connection-pin", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await requireUser(request, reply);
    const pins = await loadPins();
    return { configured: !!pins[user.id] };
  });

  /** 연동 전용 PIN 설정 또는 검증 */
  app.post<{ Body: { action?: string; pin?: string } }>(
    "/connection-pin",
    async (request: FastifyRequest<{ Body: { action?: string; pin?: string } }>, reply: FastifyReply) => {
      const user = await requireUser(request, reply);
      const body = request.body ?? {};
      const action = (body.action ?? "").trim().toLowerCase();
      const pin = (body.pin ?? "").trim();

      if (action === "set") {
        if (!pin || pin.length < 4) {
          return reply.code(400).send({ error: "PIN must be at least 4 characters" });
        }
        const pins = await loadPins();
        pins[user.id] = hashPin(user.id, pin);
        await savePins(pins);
        return { ok: true, message: "PIN set" };
      }

      if (action === "verify") {
        const pins = await loadPins();
        const stored = pins[user.id];
        if (!stored) return { ok: true, verified: true };
        const match = hashPin(user.id, pin) === stored;
        return { ok: match, verified: match };
      }

      return reply.code(400).send({ error: "action must be 'set' or 'verify'" });
    }
  );
}

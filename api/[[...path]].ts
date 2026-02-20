import type { VercelRequest, VercelResponse } from "@vercel/node";
import path from "path";
import { pathToFileURL } from "url";

let appPromise: ReturnType<typeof getApp> | null = null;

async function getApp() {
  const serverPath = path.join(process.cwd(), "backend/dist/server.js");
  const { buildServer } = await import(pathToFileURL(serverPath).href);
  return buildServer();
}

function normalizeUrl(raw: string | undefined): string {
  if (!raw || typeof raw !== "string") return "/";
  let path = raw;
  try {
    if (raw.startsWith("http")) path = new URL(raw).pathname;
    else if (!raw.startsWith("/")) path = `/api/${raw}`;
  } catch {
    path = raw.startsWith("/") ? raw : `/api/${raw}`;
  }
  return path === "/api/health" ? "/health" : path;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!appPromise) appPromise = getApp();
    const app = await appPromise;
    const url = normalizeUrl(req.url);
    const payload =
      req.method !== "GET" && req.method !== "HEAD" && req.body != null
        ? typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body)
        : undefined;
    const response = await app.inject({
      method: req.method || "GET",
      url,
      headers: (req.headers as Record<string, string>) || {},
      payload,
    });
    res.status(response.statusCode);
    const headers = response.headers as Record<string, string | string[] | undefined>;
    if (headers && typeof headers === "object") {
      for (const [k, v] of Object.entries(headers)) {
        if (v !== undefined) res.setHeader(k, Array.isArray(v) ? v.join(", ") : v);
      }
    }
    res.send(response.payload ?? "");
  } catch (err) {
    console.error("[api handler]", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

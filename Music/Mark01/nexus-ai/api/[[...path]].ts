import type { VercelRequest, VercelResponse } from "@vercel/node";
import path from "path";
import { pathToFileURL } from "url";

let appPromise: ReturnType<typeof getApp> | null = null;

function getServerPath(): string {
  const cwd = process.cwd();
  return path.join(cwd, "backend/dist/server.js");
}

async function getApp() {
  const serverPath = getServerPath();
  const { buildServer } = await import(pathToFileURL(serverPath).href);
  return buildServer();
}

function normalizeUrl(req: { url?: string; headers?: Record<string, string | string[] | undefined> }): string {
  const raw =
    req.url ||
    (typeof req.headers?.["x-invoke-path"] === "string" ? req.headers["x-invoke-path"] : null) ||
    (typeof req.headers?.["x-url"] === "string" ? req.headers["x-url"] : null);
  if (!raw || typeof raw !== "string") return "/api/health";
  let path = raw.trim();
  try {
    if (path.startsWith("http")) path = new URL(path).pathname;
    else if (!path.startsWith("/")) path = path.startsWith("api") ? `/${path}` : `/api/${path}`;
  } catch {
    path = path.startsWith("/") ? path : `/api/${path}`;
  }
  return path === "/api/health" ? "/health" : path;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = normalizeUrl(req);
  if (url === "/health") {
    try {
      if (!appPromise) appPromise = getApp();
      const app = await appPromise;
      const response = await app.inject({ method: "GET", url: "/health" });
      res.status(response.statusCode).setHeader("Content-Type", "application/json").send(response.payload ?? "{}");
      return;
    } catch {
      res.status(503).json({ status: "unavailable", service: "yuanto-ai-backend", error: "Backend not built or failed to load" });
      return;
    }
  }
  try {
    if (!appPromise) appPromise = getApp();
    const app = await appPromise;
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

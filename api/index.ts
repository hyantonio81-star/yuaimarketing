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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathParam = req.query?.path;
  const pathStr = Array.isArray(pathParam) ? pathParam.join("/") : pathParam ?? "";

  const normalized = String(pathStr).trim().replace(/^\/+/, "");
  const basePath = normalized ? `/api/${normalized}` : "/api";

  // path를 제외한 나머지 query를 유지하여 OAuth callback(code/state) 등
  // 라우트 파라미터가 유실되지 않도록 합니다.
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query ?? {})) {
    if (key === "path") continue;
    if (Array.isArray(value)) {
      for (const v of value) queryParams.append(key, String(v));
      continue;
    }
    if (value != null) queryParams.append(key, String(value));
  }
  const qs = queryParams.toString();
  const targetUrl = qs ? `${basePath}?${qs}` : basePath;

  // `/api/health`는 보통 `api/health.js`가 처리합니다. 여기는 `path=health`로 들어온 경우만 해당.
  if (normalized === "health") {
    res.setHeader("Content-Type", "application/json");
    res.status(200).end(JSON.stringify({ status: "ok", service: "yuaimarketing-api", source: "api/index.ts" }));
    return;
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
      url: targetUrl,
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
    console.error("[api/index handler]", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}


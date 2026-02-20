import type { VercelRequest, VercelResponse } from "@vercel/node";
import path from "path";
import { pathToFileURL } from "url";

let appPromise: ReturnType<typeof getApp> | null = null;

async function getApp() {
  const serverPath = path.join(process.cwd(), "backend/dist/server.js");
  const { buildServer } = await import(pathToFileURL(serverPath).href);
  return buildServer();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!appPromise) appPromise = getApp();
    const app = await appPromise;
    let url = req.url || "/";
    if (url === "/api/health") url = "/health";
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
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.send(response.payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

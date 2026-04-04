#!/usr/bin/env node
/**
 * Shorts 원격 FFmpeg 조립 워커 (Vercel 밖에서 실행)
 *
 * Env:
 *   SHORTS_API_BASE   — 예: https://your-app.vercel.app/api/shorts (끝 슬래시 없음)
 *   SHORTS_WORKER_SECRET — Vercel과 동일한 비밀키
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — 최종 mp4 업로드용 (backend .env와 동일)
 *
 * 한 사이클: pending 목록 → claim → 로컬에서 tsx로 조립·업로드 → complete
 *
 * Usage:
 *   SHORTS_API_BASE=... SHORTS_WORKER_SECRET=... node scripts/shorts-assembly-worker.mjs
 */
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const backendDir = join(repoRoot, "backend");

const base = (process.env.SHORTS_API_BASE ?? "").trim().replace(/\/$/, "");
const secret = (process.env.SHORTS_WORKER_SECRET ?? "").trim();
const limit = Math.min(10, Math.max(1, parseInt(process.env.SHORTS_ASSEMBLY_LIMIT ?? "3", 10) || 3));

if (!base || !secret) {
  console.error("Set SHORTS_API_BASE and SHORTS_WORKER_SECRET");
  process.exit(1);
}

function headers() {
  return {
    "content-type": "application/json",
    "x-shorts-worker-secret": secret,
  };
}

const listRes = await fetch(`${base}/assembly/pending-jobs?limit=${limit}`, { headers: headers() });
const listData = await listRes.json().catch(() => ({}));
if (!listRes.ok) {
  console.error("pending-jobs failed", listRes.status, listData);
  process.exit(1);
}

const jobs = listData.jobs ?? [];
if (jobs.length === 0) {
  console.log(JSON.stringify({ message: "no pending assembly jobs" }));
  process.exit(0);
}

for (const row of jobs) {
  const jobId = row.jobId;
  const manifest = row.manifest;
  if (!jobId || !manifest) continue;

  const claimRes = await fetch(`${base}/assembly/claim`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ jobId }),
  });
  const claimData = await claimRes.json().catch(() => ({}));
  if (!claimRes.ok || !claimData.manifest) {
    console.error("claim failed", jobId, claimData);
    continue;
  }

  const tmpDir = await mkdtemp(join(tmpdir(), "shorts-worker-"));
  const manifestPath = join(tmpDir, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(claimData.manifest), "utf-8");

  const r = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["tsx", "src/cli/runManifestAssembly.ts", manifestPath, jobId],
    {
      cwd: backendDir,
      encoding: "utf-8",
      env: { ...process.env },
      shell: process.platform === "win32",
    }
  );

  let out = (r.stdout ?? "").trim();
  const lines = out.split("\n").filter(Boolean);
  const jsonLine = lines[lines.length - 1] ?? "";
  let parsed;
  try {
    parsed = JSON.parse(jsonLine);
  } catch {
    console.error("worker assemble parse error", jobId, r.stderr, out);
    await fetch(`${base}/assembly/complete`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ jobId, error: r.stderr || out || "assemble_failed" }),
    });
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    continue;
  }

  if (!parsed.ok) {
    await fetch(`${base}/assembly/complete`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ jobId, error: parsed.error || "assemble_failed" }),
    });
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    continue;
  }

  const completeRes = await fetch(`${base}/assembly/complete`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ jobId, supabasePublicUrl: parsed.publicUrl }),
  });
  const completeData = await completeRes.json().catch(() => ({}));
  console.log(JSON.stringify({ jobId, complete: completeRes.ok, completeData }));

  await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
}

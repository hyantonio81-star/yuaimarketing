#!/usr/bin/env node
/**
 * Nexus AI 실행 전 환경·의존성 간단 점검
 * 사용: node scripts/check-setup.js (nexus-ai 폴더에서)
 */
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const backendEnvPath = join(root, "backend", ".env");

const checks = [];

// Node
const nodeVersion = process.version;
const major = parseInt(nodeVersion.slice(1).split(".")[0], 10);
if (major >= 18 && major <= 20) {
  checks.push({ name: "Node.js", ok: true, detail: nodeVersion });
} else {
  checks.push({ name: "Node.js", ok: false, detail: `${nodeVersion} — 18.x~20.x 권장` });
}

// FFmpeg
try {
  execSync("ffmpeg -version", { stdio: "pipe", encoding: "utf-8" });
  checks.push({ name: "FFmpeg", ok: true, detail: "설치됨 (Shorts 영상 조립 가능)" });
} catch {
  checks.push({
    name: "FFmpeg",
    ok: false,
    detail: "미설치 — docs/FFMPEG_SETUP.md 참고 (Shorts 편집은 스텁 반환)",
  });
}

// backend/.env
if (existsSync(backendEnvPath)) {
  let envContent = "";
  try {
    envContent = readFileSync(backendEnvPath, "utf-8");
  } catch {
    envContent = "";
  }
  const hasSupabase =
    /SUPABASE_URL\s*=\s*[^\s]/.test(envContent) &&
    (/\bSUPABASE_ANON_KEY\s*=\s*[^\s]/.test(envContent) || /\bSUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s]/.test(envContent));
  const hasOpenAI = /\bOPENAI_API_KEY\s*=\s*[^\s]/.test(envContent);
  const hasYouTube = /\bYOUTUBE_CLIENT_ID\s*=\s*[^\s]/.test(envContent);
  checks.push({
    name: "backend/.env",
    ok: true,
    detail: `존재 (Supabase: ${hasSupabase ? "설정됨" : "미설정"}, OpenAI: ${hasOpenAI ? "설정됨" : "미설정"}, YouTube OAuth: ${hasYouTube ? "설정됨" : "미설정"})`,
  });
  if (!hasSupabase) {
    checks.push({
      name: "로그인/대시보드",
      ok: false,
      detail: "Supabase URL·키 설정 필요 (backend/.env.example 참고)",
    });
  }
} else {
  checks.push({
    name: "backend/.env",
    ok: false,
    detail: "없음 — backend/.env.example 복사 후 Supabase 등 설정",
  });
}

// Output
console.log("\n[Nexus AI 설정 점검]\n");
let allOk = true;
for (const c of checks) {
  const icon = c.ok ? "✓" : "✗";
  const status = c.ok ? "OK" : "주의";
  console.log(`  ${icon} ${c.name}: ${status}`);
  console.log(`    ${c.detail}`);
  if (!c.ok) allOk = false;
}
console.log("");
if (allOk) {
  console.log("  실행: npm run build && npm run start:server  또는  npm run dev\n");
} else {
  console.log("  일부 항목 미설정 시에도 서버는 기동됩니다. 상세: docs/ENV_AND_DEPS_체크리스트.md\n");
}

process.exit(0);

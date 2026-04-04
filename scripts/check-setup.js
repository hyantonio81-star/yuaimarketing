#!/usr/bin/env node
/**
 * Nexus AI 실행 전 환경·의존성 간단 점검
 * 사용: node scripts/check-setup.js (nexus-ai 폴더에서)
 */
import { execSync, spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const backendEnvPath = join(root, "backend", ".env");
const frontendEnvPath = join(root, "frontend", ".env");

const checks = [];

// Node
const nodeVersion = process.version;
const major = parseInt(nodeVersion.slice(1).split(".")[0], 10);
if (major >= 18 && major <= 20) {
  checks.push({ name: "Node.js", ok: true, detail: nodeVersion });
} else {
  checks.push({ name: "Node.js", ok: false, detail: `${nodeVersion} — 18.x~20.x 권장` });
}

// FFmpeg (backend/.env 의 FFMPEG_PATH 반영)
let beForFfmpeg = "";
if (existsSync(backendEnvPath)) {
  try {
    beForFfmpeg = readFileSync(backendEnvPath, "utf-8");
  } catch {
    beForFfmpeg = "";
  }
}
const ffmM = beForFfmpeg.match(/^\s*FFMPEG_PATH\s*=\s*(.+)$/m);
if (ffmM) {
  process.env.FFMPEG_PATH = ffmM[1].trim().replace(/^["']|["']$/g, "");
}
const ffmpegExe = (process.env.FFMPEG_PATH || "").trim() || "ffmpeg";
const ffmOk =
  spawnSync(ffmpegExe, ["-version"], {
    stdio: "pipe",
    encoding: "utf-8",
    shell: process.platform === "win32",
  }).status === 0;
if (ffmOk) {
  checks.push({
    name: "FFmpeg",
    ok: true,
    detail:
      ffmpegExe === "ffmpeg"
        ? "설치됨 (PATH, Shorts 영상 조립 가능)"
        : `설치됨 (${ffmpegExe})`,
  });
} else {
  checks.push({
    name: "FFmpeg",
    ok: false,
    detail:
      "미설치 — docs/FFMPEG_SETUP.md · scripts/install-ffmpeg-windows.ps1 또는 FFMPEG_PATH 설정",
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

// frontend/.env (Vite 로그인용)
if (existsSync(frontendEnvPath)) {
  let fe = "";
  try {
    fe = readFileSync(frontendEnvPath, "utf-8");
  } catch {
    fe = "";
  }
  const viteUrl = /\bVITE_SUPABASE_URL\s*=\s*https?:\/\//.test(fe);
  const viteAnon =
    /\bVITE_SUPABASE_ANON_KEY\s*=\s*eyJ/.test(fe) ||
    (/\bVITE_SUPABASE_ANON_KEY\s*=\s*[^\s]+/.test(fe) && !/your-anon-key/.test(fe));
  const feOk = viteUrl && viteAnon;
  checks.push({
    name: "frontend/.env (로그인)",
    ok: feOk,
    detail: feOk
      ? "VITE_SUPABASE_URL·VITE_SUPABASE_ANON_KEY 설정됨"
      : "VITE_SUPABASE_* 미설정 시 프로덕션 로그인 불가 — Vercel에도 동일 변수 필요",
  });
} else {
  checks.push({
    name: "frontend/.env",
    ok: false,
    detail: "없음 — frontend/.env.example 참고해 VITE_SUPABASE_* 설정",
  });
}

// Tienda 비밀번호 (백엔드)
if (existsSync(backendEnvPath)) {
  try {
    const be = readFileSync(backendEnvPath, "utf-8");
    const landingPw = /\bLANDING_ADMIN_PASSWORD\s*=\s*\S+/.test(be);
    checks.push({
      name: "LANDING_ADMIN_PASSWORD",
      ok: landingPw,
      detail: landingPw
        ? "설정됨 (Tienda /tienda-admin)"
        : "미설정 — Tienda 로그인 503/실패. Vercel 백엔드에도 설정",
    });
  } catch {
    /* ignore */
  }
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

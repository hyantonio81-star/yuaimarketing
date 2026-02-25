#!/usr/bin/env node
/**
 * Vercel 프로젝트 Root Directory + Framework/빌드 설정을 API로 맞춥니다.
 * (Production Overrides와 Project Settings 불일치 경고 해소)
 * 사용: VERCEL_TOKEN=xxx node scripts/vercel-set-root.js
 * 토큰 발급: https://vercel.com/account/tokens
 */
const PROJECT_ID = "prj_pSDwd60OjCnRlcw09ApsFfmXWJft";
const ROOT_DIRECTORY = "Music/Mark01/nexus-ai";

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error("VERCEL_TOKEN 환경 변수를 설정하세요. (https://vercel.com/account/tokens)");
  process.exit(1);
}

async function main() {
  const body = {
    rootDirectory: ROOT_DIRECTORY,
    buildCommand: "npm run build",
    installCommand: "npm install",
    outputDirectory: "frontend/dist",
    framework: null,
  };

  const res = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("설정 실패:", res.status, data.error || data);
    process.exit(1);
  }
  console.log("설정 완료:");
  console.log("  Root Directory:", data.rootDirectory ?? ROOT_DIRECTORY);
  console.log("  Build Command:", data.buildCommand ?? body.buildCommand);
  console.log("  Output Directory:", data.outputDirectory ?? body.outputDirectory);
  console.log("이제 Vercel에서 해당 브랜치를 Redeploy 하세요.");
}

main();

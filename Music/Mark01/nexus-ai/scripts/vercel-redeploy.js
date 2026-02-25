#!/usr/bin/env node
/**
 * Vercel Production 배포 트리거 (Git 소스로 새 배포 생성)
 * 사용: VERCEL_TOKEN=xxx node scripts/vercel-redeploy.js
 */
const PROJECT_ID = "prj_pSDwd60OjCnRlcw09ApsFfmXWJft";
const GITHUB_ORG = "hyantonio81-star";
const GITHUB_REPO = "yuaimarketing";
const BRANCH = "master";

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error("VERCEL_TOKEN 환경 변수를 설정하세요.");
  process.exit(1);
}

async function main() {
  const res = await fetch("https://api.vercel.com/v13/deployments?forceNew=1", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "yuaimarketing",
      project: PROJECT_ID,
      target: "production",
      gitSource: {
        type: "github",
        ref: BRANCH,
        repo: GITHUB_REPO,
        org: GITHUB_ORG,
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Redeploy 실패:", res.status, data.error || data);
    process.exit(1);
  }
  console.log("Redeploy 트리거됨:", data.id || data.url);
  console.log("상태:", data.status);
  console.log("Vercel 대시보드 Deployments에서 진행 상황 확인하세요.");
}

main();

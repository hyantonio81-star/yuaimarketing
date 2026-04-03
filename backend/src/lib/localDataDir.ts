import { join } from "node:path";

/**
 * 로컬 JSON·토큰·Shorts 스크래치 파일용 디렉터리.
 * Vercel/AWS Lambda: /var/task 는 읽기 전용이라 /tmp 만 쓰기 가능.
 */
export function getLocalDataDir(): string {
  if (process.env.VERCEL === "1" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)) {
    return join("/tmp", "nexus-ai-data");
  }
  return join(process.cwd(), "data");
}

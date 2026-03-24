import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (mode === "production") {
    const url = (env.VITE_SUPABASE_URL ?? "").trim();
    const key = (env.VITE_SUPABASE_ANON_KEY ?? "").trim();
    const allowSkip = env.VITE_ALLOW_BUILD_WITHOUT_SUPABASE === "true";
    const hasRealKeys =
      url.length > 0 &&
      key.length > 0 &&
      !url.includes("your-project-ref") &&
      key !== "your-anon-key";
    if (!hasRealKeys && !allowSkip) {
      throw new Error(
        "[YuantO Ai] 프로덕션 빌드에 Supabase 프론트 변수가 없습니다.\n" +
          "Vercel → Project → Settings → Environment Variables 에 다음을 추가하세요:\n" +
          "  VITE_SUPABASE_URL = Supabase Project URL\n" +
          "  VITE_SUPABASE_ANON_KEY = anon public 키 (JWT)\n" +
          "저장 후 Redeploy. 문서: docs/SUPABASE_프론트_Vercel_설정.md\n" +
          "(임시로 빌드만 통과시키려면 VITE_ALLOW_BUILD_WITHOUT_SUPABASE=true — 로그인은 계속 불가)"
      );
    }
  }

  return {
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/go": {
        target: "http://localhost:4000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/go/, "/api/go"),
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src"
    }
  },
  build: {
    chunkSizeWarningLimit: 1200
  }
};
});

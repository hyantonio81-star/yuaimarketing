# 환경 변수 매트릭스 (이름만 — 값은 대시보드/.env에서 설정)

| 변수 | Backend | Frontend | Landing | Vercel (통합 배포 시) |
|------|---------|----------|---------|------------------------|
| `SUPABASE_URL` | 필수 | — | — | API/Functions 환경 |
| `SUPABASE_ANON_KEY` | 권장 | — | — | API |
| `SUPABASE_SERVICE_ROLE_KEY` | 필수(서버) | — | — | API (노출 금지) |
| `VITE_SUPABASE_URL` | — | 필수 | — | **프론트 빌드** 시 주입 |
| `VITE_SUPABASE_ANON_KEY` | — | 필수 | — | **프론트 빌드** 시 주입 |
| `VITE_API_URL` | — | 권장 | `VITE_API_URL` | 프론트·랜딩 빌드 |
| `VITE_REQUIRE_LOGIN` | — | 선택 | — | 프론트 |
| `LANDING_ADMIN_PASSWORD` | 필수(Tienda) | — | — | API |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` | 선택 | — | — | API |
| `SERPAPI_KEY` | 선택 | — | — | API |
| `VITE_ALLOW_BUILD_WITHOUT_SUPABASE` | — | CI만 | — | GitHub Actions 빌드 안정화 (프로덕션 비권장) |

상세: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md), [SUPABASE_프론트_Vercel_설정.md](./SUPABASE_프론트_Vercel_설정.md), [backend/.env.example](../backend/.env.example)

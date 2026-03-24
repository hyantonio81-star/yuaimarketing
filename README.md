## YuantO Ai Monorepo

This is the monorepo for **YuantO Ai**, containing:

- `frontend` – React + Vite + Tailwind CSS + shadcn/ui (main app + login)
- `backend` – Node.js + Fastify + TypeScript
- `landing` – marketing / Tienda 랜딩

### Getting started

1. Install dependencies from the root:

```bash
npm install
```

2. Copy env examples and fill Supabase keys:

- `backend/.env` ← `backend/.env.example`
- `frontend/.env` ← `frontend/.env.example` (must include `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` for login)

3. Run both frontend and backend in development:

```bash
npm run dev
```

4. Environment sanity check:

```bash
npm run check-setup
```

5. Supabase **database tables**: apply migrations in order — see [docs/SUPABASE_SCHEMA_RUNBOOK.md](docs/SUPABASE_SCHEMA_RUNBOOK.md) (`supabase/migrations/` or `supabase db push`).

6. Alternatively, run workspaces individually:

```bash
npm run dev:frontend
npm run dev:backend
npm run dev:landing
```

### Workspaces

This project uses **npm workspaces** with:

- `frontend`
- `backend`
- `landing`

### Deploy / CI

**Vercel (요약)**

- Root / **Root Directory**: 저장소가 `nexus-ai` 루트면 비우거나 `.` (자세한 내용: [서버_파이프라인_CI_스키마_점검.md](docs/서버_파이프라인_CI_스키마_점검.md)의 Vercel 절).
- Build: `npm run build` → `backend`·`frontend`·`landing` 산출물 + API는 `api/[[...path]].ts`.
- **환경 변수**: API용 `SUPABASE_*`, 프론트용 `VITE_SUPABASE_*` 등 — 체크리스트 [docs/ENV_MATRIX.md](docs/ENV_MATRIX.md), 프론트 설정 [docs/SUPABASE_프론트_Vercel_설정.md](docs/SUPABASE_프론트_Vercel_설정.md). 적용 후 **Redeploy**.

**Supabase DB**: 마이그레이션 적용 순서는 [docs/SUPABASE_SCHEMA_RUNBOOK.md](docs/SUPABASE_SCHEMA_RUNBOOK.md).

**GitHub Actions**: `.github/workflows/ci.yml` — `main`에서 lint → test → build. CI용 Vite 정책은 RUNBOOK의 *GitHub Actions와 프론트 빌드* 절 참고.

### Docs index

| Doc | Purpose |
|-----|---------|
| [SUPABASE_SCHEMA_RUNBOOK.md](docs/SUPABASE_SCHEMA_RUNBOOK.md) | All SQL migrations order |
| [NEXT_STEPS_RUNBOOK.md](docs/NEXT_STEPS_RUNBOOK.md) | Post-deploy checklist |
| [서버_파이프라인_CI_스키마_점검.md](docs/서버_파이프라인_CI_스키마_점검.md) | Server, Vercel, CI overview |


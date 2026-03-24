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

- **Vercel**: set env vars for API + **Vite** (`VITE_*`) and redeploy — [docs/SUPABASE_프론트_Vercel_설정.md](docs/SUPABASE_프론트_Vercel_설정.md), [docs/ENV_MATRIX.md](docs/ENV_MATRIX.md)
- **GitHub Actions**: `.github/workflows/ci.yml` (lint, test, build)

### Docs index

| Doc | Purpose |
|-----|---------|
| [SUPABASE_SCHEMA_RUNBOOK.md](docs/SUPABASE_SCHEMA_RUNBOOK.md) | All SQL migrations order |
| [NEXT_STEPS_RUNBOOK.md](docs/NEXT_STEPS_RUNBOOK.md) | Post-deploy checklist |
| [서버_파이프라인_CI_스키마_점검.md](docs/서버_파이프라인_CI_스키마_점검.md) | Server, Vercel, CI overview |


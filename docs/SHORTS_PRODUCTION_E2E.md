# Shorts production E2E (assembly · deploy · buffer)

Vercel serverless cannot bundle FFmpeg. Treat **`/api/shorts/health`** as the source of truth:

| `deployTarget` | `ffmpegInstalled` | What to do |
|----------------|-------------------|------------|
| `vercel` | `false` | Use **remote assembly** (`SHORTS_DISABLE_REMOTE_ASSEMBLY` ≠ `1`) + a worker that calls `GET /api/shorts/assembly/pending-jobs` with `X-Shorts-Worker-Secret`, uploads `final.mp4`, then `POST /api/shorts/assembly/complete`. |
| `standard` | `true` | Run the API on a host with FFmpeg (Docker/VM). Same HTTP routes; assembly runs in-process. |

**Worker secret:** Set `SHORTS_WORKER_SECRET`. Send it as `X-Shorts-Worker-Secret` or `Authorization: Bearer <same>` (Vercel Cron uses Bearer).

**Deploy queue:** `POST` or `GET /api/shorts/distribution/queue/process` with the worker secret (Cron-friendly GET).

**Buffer refill:** `POST` or `GET /api/shorts/buffer/refill` with the worker secret. Configure `SHORTS_BUFFER_*` env vars (see plan). Root `vercel.json` schedules daily Crons (Hobby-compatible): distribution `0 6 * * *` UTC, buffer refill `0 7 * * *` UTC. **Pro**에서는 더 촘촘한 스케줄로 바꿀 수 있습니다. `CRON_SECRET`을 `SHORTS_WORKER_SECRET`과 동일하게 두면 `Authorization: Bearer …`가 통과합니다.

See also: `docs/FFMPEG_SETUP.md`, `docs/로컬백엔드_FFMPEG.md`, `public/docs/SHORTS_REMOTE_ASSEMBLY.md` (frontend).

### Job 행 스토어 · 한도 · 알림 (Supabase 마이그레이션 `20260404130000_*`)

- **`shorts_pipeline_jobs`**: job 단위 행 + `payload` jsonb (멀티 인스턴스 동기화). 레거시 `shorts_jobs` blob은 `SHORTS_JOBS_DUAL_WRITE_BLOB` 기본 동시 기록.
- **`shorts_daily_generation` + RPC `shorts_claim_daily_generation`**: UTC 일일 생성 상한. `SHORTS_DAILY_MAX_PIPELINES` (0=비활성).
- **`SHORTS_MAX_CONCURRENT_PIPELINES`**: 활성 상태 job 수 DB 기준 (0=비활성). 버퍼 리필은 `skipGenerationLimits`로 한도 제외.
- **`SHORTS_ALERT_WEBHOOK_URL`**: Slack 등 Incoming Webhook — 배포 **영구 실패** 시 JSON `{ "text": "..." }` 전송. 버퍼 크론은 `SHORTS_BUFFER_OWNER_USER_ID` 누락 시 **위험** 알림.

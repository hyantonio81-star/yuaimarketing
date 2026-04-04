# Shorts production E2E (assembly · deploy · buffer)

Vercel serverless cannot bundle FFmpeg. Treat **`/api/shorts/health`** as the source of truth:

| `deployTarget` | `ffmpegInstalled` | What to do |
|----------------|-------------------|------------|
| `vercel` | `false` | Use **remote assembly** (`SHORTS_DISABLE_REMOTE_ASSEMBLY` ≠ `1`) + a worker that calls `GET /api/shorts/assembly/pending-jobs` with `X-Shorts-Worker-Secret`, uploads `final.mp4`, then `POST /api/shorts/assembly/complete`. |
| `standard` | `true` | Run the API on a host with FFmpeg (Docker/VM). Same HTTP routes; assembly runs in-process. |

**Worker secret:** Set `SHORTS_WORKER_SECRET`. Send it as `X-Shorts-Worker-Secret` or `Authorization: Bearer <same>` (Vercel Cron uses Bearer).

**Deploy queue:** `POST` or `GET /api/shorts/distribution/queue/process` with the worker secret (Cron-friendly GET).

**Buffer refill:** `POST` or `GET /api/shorts/buffer/refill` with the worker secret. `vercel.json` uses **daily** Crons on Hobby (buffer 07:00 UTC, distribution 06:00 UTC). Set **CRON_SECRET** = **SHORTS_WORKER_SECRET** for Bearer auth.

See also: `FFMPEG_SETUP.md`, `SHORTS_REMOTE_ASSEMBLY.md`.

### Row job store · limits · alerts (migration `20260404130000_*`)

- **`shorts_pipeline_jobs`**: one row per job (`payload` jsonb). Legacy `shorts_jobs` blob still dual-written unless `SHORTS_JOBS_DUAL_WRITE_BLOB=false`.
- **`SHORTS_DAILY_MAX_PIPELINES`**: UTC daily cap via RPC `shorts_claim_daily_generation` (0 = off).
- **`SHORTS_MAX_CONCURRENT_PIPELINES`**: max active jobs in DB (0 = off). Buffer refill skips limits internally.
- **`SHORTS_ALERT_WEBHOOK_URL`**: Slack-style webhook; notifies on distribution **permanent** failure. Missing `SHORTS_BUFFER_OWNER_USER_ID` when buffer needs refill triggers a **critical** alert.

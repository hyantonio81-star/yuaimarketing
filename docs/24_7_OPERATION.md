# 24/7 운영 가이드 (Nexus AI)

서버를 상시 가동하여 일과 루틴이 매일 자동 실행되도록 하는 방법입니다.

## 요구사항

- 백엔드가 **항상 켜져 있는 환경**에서 실행되어야 합니다 (클라우드 VM, PM2, Docker, 또는 상시 켜진 PC).
- Vercel 등 **서버리스**에서는 내장 스케줄러가 동작하지 않으므로, 외부 cron(예: Vercel Cron, GitHub Actions, cron-job.org)으로 `POST /api/nexus/daily-routine/run` 를 호출해야 합니다.

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `DAILY_ROUTINE_ENABLED` | 일과 스케줄러 사용 여부 | `true` (미설정 시 활성) |
| `TZ` 또는 `ROUTINE_TIMEZONE` | 스케줄 기준 시간대 | `Asia/Seoul` |
| `VERCEL` | `1` 이면 내장 스케줄러 비활성 (외부 cron 사용) | - |
| `GOV_TENDER_ENABLED` | `true`일 때만 Pillar 4(정부 입찰) API 활성. 미설정/`false`면 수동 모드 | `false` |

예:

```bash
export TZ=Asia/Seoul
export DAILY_ROUTINE_ENABLED=true
```

## 내장 스케줄러 (node-cron)

- **동작 조건**: `DAILY_ROUTINE_ENABLED !== "false"` 이고 `VERCEL !== "1"` 일 때만 등록됩니다.
- **실행 시각** (Asia/Seoul 기준): 02:00, 03:00, 04:00, 05:00, 06:00, 07:00, 09:00, 12:00, 18:00 — 각 시각에 해당 태스크 1회 실행.
- **재시도**: 스케줄러는 `runDailyRoutineTaskWithRetry` 를 사용해 최대 3회 재시도(5초 간격) 후 실패 시 로그·이력에 기록합니다.
- **동시 실행 방지**: 같은 `task_time` 이 이미 실행 중이면 해당 시각의 실행은 스킵됩니다.

**시각별 배치 내용** (스텁 없이 실제 서비스 호출): 02:00 시장 뉴스 갱신, 03:00 경쟁사 이벤트, 04:00 B2C 재고, 05:00 B2C 가격, 06:00 입찰 공고 점검, 07:00 일일 리포트 생성, 09:00 B2C 이탈 방지, 12:00 뉴스+경쟁사 스냅샷, 18:00 EOD 알림 요약. 상세는 `24_7_IMPROVEMENT_PLAN.md` 참고.

서버 기동 시 로그에 다음이 보이면 스케줄러가 켜진 것입니다:

```
Daily routine scheduler started (24/7) { times: [...], TZ: 'Asia/Seoul' }
```

## 외부 Cron (Vercel / 서버리스)

Vercel에 배포한 경우, 다음처럼 **매시 정각**에 `POST /api/nexus/daily-routine/run` 을 호출하도록 설정합니다.

- **Body**: `{ "task_time": "02:00" }` … `"18:00"` 까지 해당 시각에 맞춰 호출
- **인증**: 필요 시 헤더에 API 키 등 추가

예 (cron-job.org / GitHub Actions 등):

```bash
# 매일 02:00 KST = 17:00 UTC (전날)
curl -X POST "https://your-api.vercel.app/api/nexus/daily-routine/run" \
  -H "Content-Type: application/json" \
  -d '{"task_time":"02:00"}'
```

각 시각별로 한 번씩 호출하면 됩니다 (02:00, 03:00, 04:00, 05:00, 06:00, 07:00, 09:00, 12:00, 18:00).

## 실행 이력·대시보드

- **이력 조회**: `GET /api/nexus/daily-routine/history?limit=50&task_time=04:00`
- **마지막 실행(시간대별)**: `GET /api/nexus/daily-routine` 응답의 `last_runs` 또는 `GET /api/nexus/daily-routine/last-runs`
- **대시보드**: 일과 루틴 카드에 시간대별 마지막 실행 상태와 "Run again" 버튼이 표시됩니다.

## 실패 시 알림

- 오늘 실패한 루틴은 **프로액티브 알림** (`GET /api/nexus/proactive-alerts`) 에 `routine_failure` 타입으로 포함됩니다.
- 대시보드에서 "프로액티브 알림" 새로고침 시 확인할 수 있습니다.

## Supabase 마이그레이션

실행 이력·B2C 설정·승인대기를 DB에 저장하려면 Supabase SQL Editor에서 다음 파일을 실행하세요:

- `docs/supabase-24-7-migrations.sql`

**실행 방법**

1. [Supabase 대시보드](https://supabase.com/dashboard) → 프로젝트 선택 → **SQL Editor**
2. **New query** 클릭 후 `nexus-ai/docs/supabase-24-7-migrations.sql` 파일 내용 전체 복사·붙여넣기
3. **Run** 실행

이후 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`(또는 anon key)가 설정된 환경에서는 자동으로 해당 테이블을 사용합니다.

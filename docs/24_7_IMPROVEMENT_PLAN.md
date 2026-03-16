# 24/7 개선 계획 (Nexus AI)

AI 자율 팀이 24/7 안정적으로 동작하도록 하기 위한 개선 시나리오와 우선순위입니다.

## 시나리오 요약

| 단계 | 내용 | 상태 |
|------|------|------|
| **A** | 스케줄러: 시간별 일과 루틴 자동 실행 (내장 node-cron 또는 외부 cron) | ✅ 적용 |
| **B** | 실행 이력: DB 저장, API, 대시보드에 마지막 실행·상태 표시 | ✅ 적용 |
| **C** | 재시도·실패 알림: 2~3회 재시도, 실패 시 프로액티브 알림에 노출 | ✅ 적용 |
| **D** | 스케줄 단일 소스, 동시 실행 방지 | ✅ 적용 (scheduler 내 guard) |
| **E** | B2C 설정·승인대기 Supabase 영속화 | ✅ 적용 |
| **F** | 스텁 태스크 실구현 (02:00, 03:00, 06:00, 07:00, 12:00, 18:00 등) | ✅ 적용 (배치 실구현) |

## 효율적 업무화 (배치 실구현)

각 시각별 태스크가 **스텁이 아닌 실제 서비스 호출**로 동작합니다. 한 시각에 한 배치가 돌며, 배치 내에서 필요한 단계만 순차 실행합니다.

| 시각 | 태스크 | 배치 내용 |
|------|--------|-----------|
| 02:00 | market_intel_update | 시장 뉴스 요약 수집 (`getMarketNewsSummaryAsync`) |
| 03:00 | competitor_monitoring | 경쟁사 이벤트 조회 (`getCompetitorEvents`) |
| 04:00 | inventory_sync | B2C 연동 채널·재고 점검 (기존) |
| 05:00 | price_optimization | B2C 최적가 계산·승인대기 (기존) |
| 06:00 | tender_monitoring | 나라장터 키워드 기반 입찰 공고 점검 (`monitorKoreaProcurement`) |
| 07:00 | generate_daily_report | 시장 인텔 리포트 생성·저장 PDF/DOCX (`generateMarketReportAsync`) |
| 09:00 | churn_prevention_check | B2C 이탈 방지 캠페인 (기존) |
| 12:00 | midday_performance_check | 뉴스 요약 + 경쟁사 이벤트 스냅샷 (병렬) |
| 18:00 | eod_summary | 프로액티브 알림 기반 EOD 요약 (`getProactiveAlertsAsync`) |

구현: `backend/src/services/nexusRoutineBatches.ts` — 각 배치 함수가 대응 서비스를 호출하고, `nexusCoreService.runDailyRoutineTask`에서 태스크명별로 배치 실행.

## 우선순위

1. **1순위**: A + E — 스케줄러 가동 + B2C 데이터 영속화
2. **2순위**: B — 실행 이력·대시보드
3. **3순위**: C + D — 재시도·실패 알림·동시 실행 방지
4. **4순위**: F — 나머지 태스크 실구현 ✅ (배치로 적용됨)

## 구현 요약

- **스케줄러**: `backend/src/jobs/dailyRoutineScheduler.ts` — node-cron, `DAILY_ROUTINE_ENABLED`, `TZ`(기본 Asia/Seoul), Vercel 시 스킵
- **실행 이력**: `nexus_routine_runs` 테이블, `nexusRoutineRunsService`, GET `/api/nexus/daily-routine/history`, `last_runs` in GET `/api/nexus/daily-routine`
- **재시도**: `runDailyRoutineTaskWithRetry` (최대 3회, 5초 백오프), 스케줄러 전용
- **실패 알림**: `getProactiveAlertsAsync` — 오늘 실패한 루틴을 `routine_failure` 알림으로 포함
- **B2C 영속화**: `b2c_settings`, `b2c_pending_approvals` Supabase 테이블, Async 서비스·라우트 연동
- **배치 실구현**: `nexusRoutineBatches.ts` — 02/03/06/07/12/18 시각 태스크가 시장 인텔·경쟁사·입찰·리포트·EOD 등 실제 서비스 호출로 동작

## 마이그레이션

- `docs/supabase-24-7-migrations.sql` — `b2c_settings`, `b2c_pending_approvals`, `nexus_routine_runs` 생성

운영 방법은 `24_7_OPERATION.md`를 참고하세요.

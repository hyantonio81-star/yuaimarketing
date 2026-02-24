# B2C AI 반자율/자율화 기획·설정 가이드

B2C Pillar에서 AI 일과 루틴(재고 동기화, 가격 최적화, 이탈 방지 등)이 **반자율**로 동작할지 **완전 자율**로 동작할지 설정하는 방법과, 승인 대기 플로우를 설명합니다.

---

## 1. 반자율 vs 자율

| 구분 | 반자율 (기본) | 자율 |
|------|----------------|------|
| **설정** | `ai_automation_enabled: false` | `ai_automation_enabled: true` |
| **일과 태스크** | 실행됨 (재고 동기화, 가격 계산, 이탈 방지 등) | 동일 |
| **민감한 액션** | **승인 대기**에 적재 → 사용자 승인/거부 후 반영 | **즉시 적용** (승인 대기 없음) |

- **반자율**: 가격 변경, 리뷰 답글, 윈백 발송, 프로모션 적용 등은 “승인 대기” 목록에 쌓이고, 사용자가 승인/거부할 때만 반영됩니다.
- **자율**: 위 액션도 AI가 계산한 대로 바로 적용됩니다.

---

## 2. 설정 항목

조직별로 다음 설정이 저장됩니다.

- **`ai_automation_enabled`** (boolean)  
  - `false`: 반자율 (기본)  
  - `true`: 자율

저장소는 현재 **인메모리**(`b2cSettingsService`)이며, 서버 재시작 시 기본값(`false`)으로 초기화됩니다. 영구 저장이 필요하면 DB 연동을 추가하면 됩니다.

---

## 3. 일과 루틴 태스크 (B2C 연동)

일과 루틴(`POST /nexus/daily-routine/run`)에서 B2C 관련 태스크가 다음처럼 동작합니다.

| 태스크 키 | 실행 시각(예) | 내용 | 반자율 시 동작 |
|-----------|----------------|------|----------------|
| `inventory_sync` | 04:00 | 재고 동기화 (연동 채널 조회) | 실행만 하고 승인 대기 없음 |
| `price_optimization` | 05:00 | 최적 가격 계산 | **가격 변경 시** → `price_change` 타입으로 승인 대기 적재 |
| `churn_prevention_check` | 09:00 | 이탈 방지 캠페인(윈백 등) | **발송 건수 > 0**이면 → `winback_send` 타입으로 승인 대기 적재 |

- **자율**이 켜져 있으면 위 “승인 대기 적재” 없이 바로 적용됩니다.

---

## 4. 승인 대기 (Pending Approvals)

### 4.1 타입

- `price_change` — 가격 변경
- `review_reply` — 리뷰 답글
- `winback_send` — 윈백/이탈 방지 발송
- `promotion_apply` — 프로모션 적용

### 4.2 API

- **목록**: `GET /b2c/pending-approvals?status=pending`  
  - 응답: `{ items: [...], pending_count: N }`
- **승인**: `POST /b2c/pending-approvals/:id/approve`
- **거부**: `POST /b2c/pending-approvals/:id/reject`

조직 스코프는 `X-Organization-Id`로 전달하며, 미전달 시 `default`입니다.

### 4.3 플로우

1. 일과 태스크 실행 시, **반자율**이고 해당 액션이 “민감”하면 `addPending(orgId, type, payload)` 호출.
2. 프론트/관리자가 `GET /b2c/pending-approvals`로 목록 확인.
3. 승인 시 `POST .../approve` → 실제 반영 로직 실행 (추후 확장).
4. 거부 시 `POST .../reject` → 해당 건만 완료 처리.

승인 대기 저장도 현재 **인메모리**(`b2cPendingApprovalsService`)입니다.

---

## 5. 설정 방법

### 5.1 프론트 (B2C 커머스 페이지)

- **B2C 커머스** 페이지 상단 **「AI 자동화 설정」** 섹션에서:
  - **「AI 자율화 사용」** 체크란: 켜면 자율, 끄면 반자율.
  - 체크 시 `PUT /b2c/settings`로 `{ ai_automation_enabled: true }` 저장.
  - 반자율일 때는 “반자율 모드” 안내 문구와 **「승인 대기 N건」**이 표시됩니다.

### 5.2 API로 직접 설정

- **조회**: `GET /b2c/settings`  
  - 응답: `{ ai_automation_enabled: boolean }`
- **저장**: `PUT /b2c/settings`  
  - Body: `{ "ai_automation_enabled": true }` 또는 `false`

---

## 6. 정리

- **반자율(기본)**: 일과는 돌리되, 가격/윈백 등은 승인 대기 → 사용자 확인 후 반영.
- **자율**: 위 액션도 자동 적용.
- 설정은 조직별 `ai_automation_enabled` 하나로 제어하며, 프론트 체크란 또는 `PUT /b2c/settings`로 변경할 수 있습니다.

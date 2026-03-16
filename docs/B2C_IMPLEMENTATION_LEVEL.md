# B2C 서비스별 현재 구현 수준 (1페이지)

B2C 커머스 필라에서 **실연동** vs **규칙 기반 시뮬레이션(스텁)** 구분과 **AI(LLM) 사용 여부**를 한 페이지로 정리합니다.  
UI에는 각 섹션에 "규칙 기반 시뮬레이션" 배지를 노출해 사용자 기대를 맞춥니다.

---

## 요약 표

| 서비스 | 구현 수준 | AI(LLM) | 비고 |
|--------|-----------|---------|------|
| **채널 연동** (connections) | **실연동** | — | Shopify OAuth 연동 시 실연동; 미연동 시 메모리 fallback |
| **시뮬레이션용 제품** (simulation-products) | **실연동** | — | 제휴 shortlist(Threads Commerce) 실데이터 |
| **재고 동기화** (inventory-sync) | **반실연동** | — | 중앙 재고는 Supabase/메모리 영속화; 채널별 반영은 규칙 기반 배분(실제 Shopify 재고 API 미호출) |
| **주문 처리** (process-order) | **시뮬레이션** | — | 사기점수·재고예약·결제·송장·배송 모두 규칙/스텁, 실제 채널 API 미호출 |
| **최적 가격** (optimal-price) | **시뮬레이션** | — | 휴리스틱 가격 모델; 경쟁사/수요 데이터는 스텁 |
| **프로모션 계획** (promotion-plan) | **시뮬레이션** | — | 할인/BOGO/번들 시나리오 규칙 기반; LLM 미사용 |
| **리뷰 분석** (review-analysis) | **시뮬레이션 + AI 1회** | **선택** | 감정/테마 규칙 기반; 실 리뷰 수집 미연동. GEMINI/OPENAI 설정 시 한 줄 요약(ai_summary) LLM 1회 호출 |
| **부정 리뷰 대응** (handle-negative-review) | **시뮬레이션** | — | 심각도 규칙 기반; 자동 응답 스텁 |
| **이탈 방지** (churn-prevention) | **시뮬레이션** | — | 이탈 확률 휴리스틱; 고객 목록·이메일/SMS 발송 스텁 |
| **맞춤 추천** (recommendations) | **시뮬레이션** | — | 협업/콘텐츠/트렌딩 앙상블 규칙 기반; 실 구매 데이터 미연동 |
| **AI 자동화 설정** (반자율/자율) | **실연동** | — | 설정·승인 대기 목록 Supabase/메모리 영속화 |

---

## 채널·데이터 소스

- **실연동**: Shopify(연동 시), 제휴 shortlist, Supabase(연동·재고·설정·승인 대기).
- **스텁/시뮬레이션**: 경쟁사 가격, 리뷰, 고객 CLV/이탈, 결제·송장·배송·이메일/SMS, Threads/블로그 실제 발행 제한적.

---

## E2E·환경 체크

- **API 키**: 리뷰 AI 요약 사용 시 `GEMINI_API_KEY` 또는 `OPENAI_API_KEY` 필요.
- **B2C 전용**: [B2C_SETUP.md](./B2C_SETUP.md) — Supabase 테이블·스코프.
- **전체 환경·의존성**: [ENV_AND_DEPS_체크리스트.md](./ENV_AND_DEPS_체크리스트.md), [E2E_FIRST_RUN_기획.md](./E2E_FIRST_RUN_기획.md).

---

## 참고

- [STUB_REPLACEMENT_로드맵.md](./STUB_REPLACEMENT_로드맵.md) — 스텁 제거·실연동 전환 순서  
- [B2C_SETUP.md](./B2C_SETUP.md) — B2C 스키마·환경 변수  
- [B2C_AI_AUTOMATION.md](./B2C_AI_AUTOMATION.md) — 반자율/자율화 기획

---

## 추가 개선 제안 (우선순위 낮음)

| 항목 | 설명 |
|------|------|
| 리뷰 분석 LLM 타임아웃 | `generateAiReviewSummary`에 10초 등 타임아웃 추가 시 장애 시 응답 지연 방지 |
| 프로모션 카피 LLM 1회 | 실행 계획 메시징(messaging)을 규칙 문구 대신 LLM 1회 생성해 "AI 기반" 배지 적용 |
| 단위/통합 테스트 | ✅ `backend/src/services/*.test.ts` 및 `backend/src/routes/b2c.routes.test.ts` 추가. `npm run test` (vitest)로 실행 |
| Shopify 재고/주문 실연동 | 한 채널(Shopify)만이라도 재고 반영·승인 대기 → 실행 연동 |

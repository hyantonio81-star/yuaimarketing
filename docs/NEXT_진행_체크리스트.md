# 다음 진행 체크리스트

B2C 개선(UI/에러/문서/LLM/테스트)까지 반영된 상태에서의 **추천 다음 단계**입니다.

---

## ✅ 이미 완료된 항목 (참고)

- B2C UI: 스텁·시뮬레이션 배지, 에러 메시지 구체화(`getApiErrorMessage`)
- B2C 문서: [B2C_IMPLEMENTATION_LEVEL.md](./B2C_IMPLEMENTATION_LEVEL.md) 1페이지
- 리뷰 분석: LLM 1회 호출(ai_summary) + 타임아웃 + 로딩 문구
- 프로모션: 실행 계획 카피 LLM 1회(planPromotionWithAiCopy) + AI 카피 배지
- B2C 테스트: 단위 11개 + 라우트 5개 (`npm run test`)

---

## 1순위 — 곧 진행 추천

| # | 항목 | 내용 | 산출물/참고 |
|---|------|------|-------------|
| 1 | **E2E 한 줄 정하기** | Shorts 업로드 vs Threads 포스트 중 **하나**를 “첫 E2E”로 정하고, 해당 경로만 스텁 없이 끝까지 동작하도록 맞추기 | [E2E_FIRST_RUN_기획.md](./E2E_FIRST_RUN_기획.md) |
| 2 | **Shorts/Threads 미연동 시 안내** | FFmpeg·YouTube·Threads 미설정 시 “설정 가이드 링크 + 안내 문구”로 명확히 표시 | [STUB_REPLACEMENT_로드맵.md](./STUB_REPLACEMENT_로드맵.md) §1, §2 |
| 3 | **yuaimarketop 랜딩 최소** | 메인(/) + /links 카드형 페이지 → 도메인·픽셀 연결 | [YUAIMARKETOP_HOMEPAGE_기획.md](./YUAIMARKETOP_HOMEPAGE_기획.md) Phase 1 |

---

## 2순위 — B2C·인프라 강화

| # | 항목 | 내용 |
|---|------|------|
| 4 | **Shopify 재고/주문 실연동** | 한 채널(Shopify)만이라도 재고 반영·승인 대기 → 실제 반영 연동 ([B2C_IMPLEMENTATION_LEVEL.md](./B2C_IMPLEMENTATION_LEVEL.md) 참고) |
| 5 | **의존성·환경 통합 체크리스트** | API 키·채널·E2E를 한 페이지에 정리 ([IMPROVEMENT_PLAN_보강안.md](./IMPROVEMENT_PLAN_보강안.md) §2.5) |
| 6 | **1차 수익 타깃 정의** | B2B 리드 / 제휴 전환 / Shorts 중 하나를 “1차 성공 지표”로 선택·기재 ([IMPROVEMENT_PLAN_보강안.md](./IMPROVEMENT_PLAN_보강안.md) §2.4) |

---

## 3순위 — 선택

- Threads: Amazon RSS·Shein 피드 실연동 후 포스트 1건 E2E 검증
- Temu/Ali 소싱: 단계별 문서화 후 API·피드 연동
- 블로그 발행: Phase 2 명시 + 수동 복사 가이드

---

## 바로 실행할 때

- **테스트**: `cd nexus-ai/backend && npm run test`
- **개발 서버**: `cd nexus-ai && npm run dev`
- **문서**: [B2C_IMPLEMENTATION_LEVEL.md](./B2C_IMPLEMENTATION_LEVEL.md), [IMPROVEMENT_PLAN_보강안.md](./IMPROVEMENT_PLAN_보강안.md), [E2E_FIRST_RUN_기획.md](./E2E_FIRST_RUN_기획.md)

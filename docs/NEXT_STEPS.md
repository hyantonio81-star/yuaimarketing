# 당장 할 일 1–3 (Nexus AI)

로드맵·개선안 기준으로 **지금 당장 진행하면 좋은** 작업 1–3개입니다.

---

## 1. 제휴 링크 동작 확인 (수동)

- **목표**: 스레드 커머스 제휴 설정이 저장·로드되고, 파이프라인 실행 시 상품 링크에 추적 ID가 붙는지 확인.
- **방법**:
  1. 대시보드 → SEO·콘텐츠 → 스레드 커머스 → 설정에서 Amazon Associate Tag(또는 AliExpress/Temu 파라미터) 입력 후 저장.
  2. 페이지 새로고침 후 값이 유지되는지 확인.
  3. 파이프라인 1회 실행 후 생성된 포스트(및 블로그 사용 시 해당 링크)에서 상품 URL에 `tag=`, `aff_` 등 파라미터가 붙었는지 확인.
- **참고**: [AFFILIATE_TRACKING_LINKS.md](./AFFILIATE_TRACKING_LINKS.md)

---

## 2. 24/7 스텁 태스크 실구현 (02:00, 03:00, …)

- **목표**: 일과 루틴의 각 시각(02:00, 03:00, 04:00, 05:00, 06:00, 07:00, 09:00, 12:00, 18:00)에 실행되는 태스크를 스텁이 아닌 **실제 로직**으로 채우기.
- **현재**: 스케줄러·이력·재시도·알림은 적용됨. 각 `task_time`별로 무엇을 할지는 아직 스텁 또는 미정.
- **다음**: `dailyRoutineScheduler.ts` 또는 해당 태스크 핸들러에서 시각별로 실행할 작업(예: 시장 인텔 갱신, B2C 가격 체크, 스레드 포스트 예약 등)을 정의하고 연동.
- **참고**: [24_7_IMPROVEMENT_PLAN.md](./24_7_IMPROVEMENT_PLAN.md) 단계 F, [24_7_OPERATION.md](./24_7_OPERATION.md)

---

## 3. 콘텐츠 자동화 설정 UI 추가 시 제휴 필드 포함

- **목표**: 콘텐츠 자동화 전용 설정 페이지를 만들 때, **Amazon Tag / AliExpress / Temu** 입력란을 포함해 블로그·SNS 발행 시 동일 제휴 링크 로직이 적용되도록 함.
- **현재**: 백엔드 `PUT /api/content-automation/settings` 는 이미 `amazonAssociateTag`, `aliexpressAffiliateParams`, `temuAffiliateParams` 를 받음. 프론트에는 해당 설정 화면이 없음.
- **다음**: 콘텐츠 자동화 설정 라우트·페이지를 신설할 때, 스레드 커머스 설정과 같은 세 필드를 추가.
- **참고**: [AFFILIATE_TRACKING_LINKS.md](./AFFILIATE_TRACKING_LINKS.md) §4

---

*이 문서는 로드맵에서 추린 우선 작업입니다. 완료 후 여기 항목을 갱신하거나, 새 당장 할 일을 추가해 두면 됩니다.*

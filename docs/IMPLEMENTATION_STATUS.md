# 구현 상태 (문서 대비 코드)

Pillar·주요 기능별로 “문서 명세 대비 실제 구현 여부”를 정리한 표입니다. 자세한 보강 순서는 [IMPROVEMENT_PLAN_보강안.md](./IMPROVEMENT_PLAN_보강안.md)를 참고하세요.

---

## Pillar별 요약

| Pillar | API·UI | 비고 |
|--------|--------|------|
| **Pillar 1** | Market Intel, Competitor, SEO 라우트·페이지 구현됨 | country 스코프·리포트 생성 등 MASTER_PLAN 대비 적용 여부는 기능별 확인 필요 |
| **Pillar 2** | B2B Trade 라우트·페이지 구현됨 | 검증·제안서·리드·배송 등 API 존재; WhatsApp 등 발송은 외부 자동화 연동 |
| **Pillar 3** | B2C Commerce·Ecommerce 라우트·페이지 구현됨 | 24/7 배치·Supabase 영속화 적용 |
| **Pillar 4** | Gov Tender 라우트·페이지 구현됨 | **수동 모드 기본**(`GOV_TENDER_ENABLED !== 'true'` 시 API 503). 활성화 시 기존 로직 동작 |

---

## 기타 기능

| 기능 | 상태 | 비고 |
|------|------|------|
| Shorts 파이프라인 | 구현됨 | 편집은 FFmpeg 필수, 미설치 시 스텁; 업로드는 YouTube 연동 시 실업로드 |
| /go 리다이렉트 | 구현됨 | `backend/data/redirects.json` 또는 env |
| 24/7 일과 루틴 | 구현됨 | 스케줄러·이력·재시도·배치 실구현; Vercel 시 외부 cron 필요 |
| yuaimarketop 랜딩 | 기획만 | 메인·/links·/p/[slug] 등 코드 없음, [YUAIMARKETOP_HOMEPAGE_기획.md](./YUAIMARKETOP_HOMEPAGE_기획.md) 참고 |

---

## 스텁·실연동

스텁이 남아 있는 구간과 실연동 전환 순서는 [STUB_REPLACEMENT_로드맵.md](./STUB_REPLACEMENT_로드맵.md)를 참고하세요.

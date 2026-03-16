# 보강 개선안 기획 (Improvement Plan)

중간 평가에서 도출된 부족한 부분을 보강하기 위한 작업 목록과 적용 순서입니다.

---

## Part 1. Pillar 4 (정부 입찰) 수동 모드 — 적용 완료

| 항목 | 상태 | 비고 |
|------|------|------|
| 백엔드 `GOV_TENDER_ENABLED` 플래그 | ✅ | `false`(기본) 시 모든 Gov API가 503 + manual 메시지 반환 |
| `GET /api/gov/status` | ✅ | `mode: "active" \| "manual"` 반환 |
| 프론트 Gov 페이지 배너·버튼 비활성화 | ✅ | 수동 모드 시 안내 배너 + 모든 실행 버튼 비활성 |
| 사이드바 "수동" 배지 | ✅ | Layout에서 Gov가 수동 모드일 때 "수동" 표시 |
| 문서 반영 | ✅ | MASTER_PLAN, SERVER_PC_SETUP, 24_7_OPERATION에 `GOV_TENDER_ENABLED` 명시 |

**활성화 방법**: 서버(또는 Vercel 환경변수)에 `GOV_TENDER_ENABLED=true` 설정 후 재시작.

---

## Part 2. 부족한 부분 보강 — 할 일

### 2.1 한 줄 E2E 정하고 스텁 제거 (우선순위 1)

**목표**: 최소 하나의 흐름을 스텁 없이 끝까지 동작하게 한다.

| 옵션 | 완료 기준 | 필요한 작업 |
|------|-----------|-------------|
| **A. Shorts 1편 유튜브 업로드** | 키워드 입력 → mp4 조립 → 연동된 채널에 업로드 | FFmpeg 설치 가이드 문서화; YouTube 미연동 시 안내 문구 명확화; (선택) FFmpeg 없을 때 스텁 대신 에러+가이드 링크 |
| **B. Threads 포스트 1건 발행** | 대시보드에서 포스트 1건 실행 → 실제 Threads에 게시 | Threads 연동 상태 확인 API/UI; Amazon RSS 또는 1개 소스 실연동 후 포스트 생성→발행 E2E 검증 |

**산출물**: [E2E_FIRST_RUN_기획.md](./E2E_FIRST_RUN_기획.md) — 우선 E2E 선택 후 해당 경로 체크리스트 정리.

---

### 2.2 yuaimarketop 랜딩 최소 구현 (우선순위 1)

**목표**: 인스타/Threads 바이오·제휴 전환용 단일 URL 확보.

| 단계 | 내용 |
|------|------|
| 1 | 메인(/) + /links 카드형 페이지 구현 (이 레포 내 `frontend-landing` 또는 기존 frontend 확장) |
| 2 | 도메인 www.yuaimarketop.com 연결 ([YUAIMARKETOP_DOMAIN_VERCEL_체크리스트.md](./YUAIMARKETOP_DOMAIN_VERCEL_체크리스트.md)) |
| 3 | 픽셀·GA4 공통 레이아웃 삽입 ([YUAIMARKETOP_HOMEPAGE_기획.md](./YUAIMARKETOP_HOMEPAGE_기획.md) §7) |

**산출물**: [YUAIMARKETOP_HOMEPAGE_기획.md](./YUAIMARKETOP_HOMEPAGE_기획.md) §8 Phase 1 체크리스트.

---

### 2.3 스텁 제거·실연동 로드맵 (우선순위 2)

**목표**: 데모용 스텁을 단계적으로 실제 연동으로 교체할 순서를 정한다.

| 기능 | 현재 | 1단계 | 2단계 |
|------|------|-------|-------|
| Shorts 편집 | FFmpeg 없으면 스텁 | FFmpeg 설치 가이드 + 미설치 시 에러/링크 반환 | (유지) |
| Shorts 업로드 | YouTube 미연동 시 스텁 | 대시보드에 연동 상태·설정 링크 표시 | (유지) |
| Threads 소싱 | Amazon RSS/스텁, Shein/Temu/Ali 스텁 | Shein: 피드 URL 없을 때만 스텁; Temu/Ali 단계별 문서화 | Temu/Ali 피드·API 연동 |
| 블로그 발행 | 스텁(TODO) | Phase 2로 명시, 수동 복사 대체 문서화 | Blogger OAuth 연동 |
| 시장 인텔 뉴스 | 무료 RSS + 스텁 폴백 | (유지) | 유료 소스 연동 시 스텁 축소 |

**산출물**: [STUB_REPLACEMENT_로드맵.md](./STUB_REPLACEMENT_로드맵.md).

---

### 2.4 수익·검증 1차 타깃 정의 (우선순위 2)

**목표**: 무엇을 먼저 “성공”으로 볼지 한 줄로 정한다.

| 선택지 | 1차 성공 지표 |
|--------|----------------|
| A. B2B 리드 | 도미니카 등 타깃에서 검증·제안서·WhatsApp까지 한 건 성공 |
| B. 제휴 전환 | yuaimarketop /links·/go로 유입 후 구매 클릭 1건 이상 |
| C. Shorts | 한 편이 실제 유튜브에 업로드되고 조회/구독 발생 |

**산출물**: MASTER_PLAN 또는 NEXT_STEPS에 “1차 수익 타깃” 섹션 추가 후, 위 A/B/C 중 하나 선택·기재.

---

### 2.5 의존성·환경 통합 체크리스트 (우선순위 2)

**목표**: 새 환경에서 “뭐부터 켜야 하는지” 한 번에 본다.

| 포함 항목 | 설명 |
|-----------|------|
| 서버/런타임 | Node 버전, (선택) FFmpeg |
| API·키 | Google(YouTube, Blogger 등), OpenAI, Meta, Supabase |
| 제휴 | Shein 피드 URL, Amazon Associate Tag, Temu/Ali 파라미터 |
| 기능 플래그 | GOV_TENDER_ENABLED, DAILY_ROUTINE_ENABLED, VERCEL |

**산출물**: [ENV_AND_DEPS_체크리스트.md](./ENV_AND_DEPS_체크리스트.md) — 필수/선택·사용처·미설정 시 동작 정리.

---

### 2.6 문서–코드 정합 (우선순위 3)

**목표**: Pillar/기능별로 “문서 대비 구현 상태”를 한눈에 본다.

| 내용 | 산출물 |
|------|--------|
| Pillar 1~4, Nexus, Shorts, 랜딩 등 문서 명세 vs 실제 API·UI 구현 여부 | [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) 또는 MASTER_PLAN 내 섹션 |
| 스텁/실연동 구분 | 동일 표에 기재 |

---

## Part 3. 적용 순서 제안

| 순서 | 작업 | 결과 |
|------|------|------|
| 1 | Pillar 4 수동 모드 | ✅ 완료 |
| 2 | E2E 한 줄 선택 + 해당 경로 스텁/가이드 정리 (2.1) | Shorts 또는 Threads 중 하나 “끝까지 동작” |
| 3 | yuaimarketop 랜딩 최소(메인 + /links) 구현 (2.2) | SNS 바이오·제휴 전환 URL 확보 |
| 4 | 의존성·환경 체크리스트 (2.5) | 새 환경 설정 시간 단축 |
| 5 | 스텁 로드맵 (2.3) + 수익 1차 타깃 (2.4) | 우선순위·목표 명확화 |
| 6 | 문서–코드 정합 (2.6) | 기획과 구현 상태 일치 |

---

## 참고 문서

- [MASTER_PLAN.md](./MASTER_PLAN.md) — Pillar·스코프
- [YUAIMARKETOP_HOMEPAGE_기획.md](./YUAIMARKETOP_HOMEPAGE_기획.md) — 랜딩 구조
- [24_7_OPERATION.md](./24_7_OPERATION.md) — 스케줄러·환경 변수

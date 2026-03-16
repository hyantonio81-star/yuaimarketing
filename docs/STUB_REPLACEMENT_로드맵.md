# 스텁 제거·실연동 로드맵 (Stub Replacement Roadmap)

데모용 스텁을 단계적으로 실제 연동으로 교체하기 위한 순서와 담당 영역입니다.

---

## 1. Shorts

| 구간 | 현재 | 1단계 | 2단계 | 비고 |
|------|------|-------|-------|------|
| 편집(조립) | FFmpeg 없으면 스텁 경로 반환 | FFmpeg 설치 가이드 문서화; 미설치 시 503 또는 에러 + 가이드 링크 반환 | (유지) | [SHORTS_AGENT.md](./SHORTS_AGENT.md), [SHORTS_AI_TEAMS_기획.md](./SHORTS_AI_TEAMS_기획.md) |
| 업로드 | YouTube 미연동 시 스텁 URL 반환 | 대시보드에 연동 상태·설정 링크 표시; 스텁 시 문구 명확화 | (유지) | youtubeUploadService, Shorts UI |
| BGM | 단일 샘플 URL 다운로드 | (유지) | 라이브러리/DB 선택 시 BGM 확장 | shortsBgmAgent |

---

## 2. Threads Commerce·콘텐츠 자동화

| 구간 | 현재 | 1단계 | 2단계 | 비고 |
|------|------|-------|-------|------|
| Amazon 소싱 | RSS 또는 스텁 | RSS URL 설정 시 실제 풀링; 미설정 시 스텁 | (유지) | amazonSourcingService |
| Shein 소싱 | 스텁 | `SHEIN_AFFILIATE_FEED_URL` 있을 때만 실피드; 없으면 스텁 1건 또는 빈 배열 | (유지) | sheinSourcingService, sheinAffiliateFeedService |
| Temu / AliExpress 소싱 | 스텁 | “실연동 시 API/피드로 교체” 단계 문서화 | 피드·API 연동 구현 | temuSourcingService, aliexpressSourcingService |
| 블로그 발행 | 스텁(TODO) | Phase 2로 명시; 수동 복사·URL 플레이스홀더 문서화 | Blogger OAuth + posts.insert 연동 | bloggerService |

---

## 3. 시장 인텔

| 구간 | 현재 | 1단계 | 2단계 | 비고 |
|------|------|-------|-------|------|
| 뉴스 요약 | 무료 RSS + 스텁 폴백 | (유지) | 유료 소스 연동 시 스텁 축소 | marketIntelService |
| 세분화·리포트 | 무료 API + 스텁 보조 | (유지) | 유료 소스·세분화 옵션 확대 | marketIntelService |

---

## 4. Gov Tender (Pillar 4)

| 구간 | 현재 | 비고 |
|------|------|------|
| 전체 | 수동 모드 기본(`GOV_TENDER_ENABLED !== 'true'` 시 503) | 활성화 시 기존 로직 동작; 나라장터는 G2B_API_KEY 필요 |

---

## 5. 적용 우선순위

1. **Shorts**: 편집·업로드 안내(가이드·에러 메시지) 정리 → FFmpeg·YouTube 설정 시 E2E 가능하도록.
2. **Threads/콘텐츠**: Shein 피드·Amazon RSS 실사용 확인 후, Temu/Ali·블로그는 2단계로 문서화.
3. **시장 인텔·Gov**: 현 구조 유지, 확장 시 위 표 2단계 반영.

---

## 참고

- [IMPROVEMENT_PLAN_보강안.md](./IMPROVEMENT_PLAN_보강안.md) — 보강안 전체
- [E2E_FIRST_RUN_기획.md](./E2E_FIRST_RUN_기획.md) — 첫 E2E 선택·체크리스트

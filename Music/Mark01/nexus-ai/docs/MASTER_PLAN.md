# YuantO Ai 통합 마스터 플랜 — Pillar 1·2·3·4

조직(Organization) + 국가(Country/Market) 스코프로 **Pillar 1~4**를 통합하는 기획 및 시스템 적용 기준 문서입니다.

---

## 1. 설계 원칙

- **조직(Organization)**: 가입 업체 단위. 모든 데이터·전략은 조직 소속.
- **국가(마켓, Market)**: 조직이 타깃하는 시장. 국가가 지정되면 **그 나라에 맞는 데이터·전략만** 적용.
- **통일 스코프**: 모든 Pillar에서 `(organization_id, country_code)` 기준으로 조회·저장.

---

## 2. Pillar별 통합 요약

| Pillar | 내용 | 국가 적용 |
|--------|------|------------|
| **Pillar 1** | Market Intel, Competitor Tracking, SEO & Content | 시장 인텔·경쟁사·키워드를 **타깃 국가** 기준으로 필터. |
| **Pillar 2** | B2B Trade | 바이어·가격·결제조건·인코텀스를 **수출 대상국** 기준. |
| **Pillar 3** | B2C Commerce | 채널·프로모션·재고·가격을 **판매 국가** 기준. |
| **Pillar 4** | Gov Tender | 입찰 공고·규격·참가자격을 **입찰 시장 국가** 기준. |

---

## 3. 데이터 모델

### 3.1 조직·마켓

- **organizations**: 업체(회사). `id`, `name`, `default_country`, 등.
- **organization_markets**: 조직별 타깃 국가. `organization_id`, `country_code`, `locale`, `currency`, `is_default`, `b2b_enabled`, `b2c_enabled`.
- **market_profiles**: 국가별 상세 설정. `organization_id`, `country_code`, `product_categories[]`, `industries[]`, `company_type`, `b2b_strategy`, `b2c_strategy`, `keywords[]`, `competitor_ids[]`.

### 3.2 국가 마스터

- **country_master**: `country_code`, `name`, `locale`, `currency`, `regions`. 시스템 공통.

### 3.3 사용자

- **users**: `organization_id` 소속. (선택) `default_market_id` / `last_country_code`.

---

## 4. API·클라이언트 규칙

- **요청 스코프**: 모든 Pillar API에 `organization_id`(세션/토큰) + `country_code`(헤더 `X-Country` 또는 쿼리 `country`) 전달.
- **응답**: 해당 `(organization_id, country_code)`에 한정된 데이터만 반환.

---

## 5. 프론트엔드

- **현재 국가(마켓)**: 전역 상태 또는 Context로 유지. 레이아웃에 **국가 선택기** 제공.
- **API 호출**: 현재 선택된 `country_code`를 헤더 또는 쿼리로 항상 포함.

---

## 6. Pillar별 상세

### Pillar 1 — Market Intel, Competitor, SEO

- **시장조사 흐름 (툴 → 서비스 → 결과물)**  
  - **툴**: 소셜·커뮤니티, 리뷰·평점, 검색·트렌드, 무역·관세, 공식·통계 등 데이터 소스/수집 도구.  
  - **서비스**: (1) 데이터 수집 → (2) 분석·가공(NLP·감정·토픽) → (3) 인사이트·리포트 생성.  
  - **결과물**: 소비자 니즈 Top 10, 불만 포인트 분석, 구매 의도 신호 등.  
- **시장 리포트 출력 설정**:  
  - **형식**: PDF / Excel / JSON.  
  - **스코프**: 국가별 / 업종별 / 아이템별 / 전체.  
  - **발행 주기**: 1회 / 주간 / 월간.  
  - **포함 섹션**: 요약, 시장 규모, 니즈·불만·구매의도, 경쟁·트렌드·제안 등 선택 저장.  
  - API: `GET/PUT /api/market-intel/report-settings` (orgId, country, options).  
  - 리포트 생성: `POST /api/market-intel/generate-report` (orgId, country).  
  - Data Sources: `GET /api/market-intel/sources?lang=` — 수출지원·공고(COMPRA GOBIERNO, KOTRA, PRODOMINICANA 등) 포함.  
  - 유료 소스: `GET/PUT /api/market-intel/enabled-paid-sources`. 세분화: `research-types`, `granular-request`, `segmented-analysis-results`.  
- 시장 인텔: 소스·분석·결과를 `country_code`(및 `market_profile`의 품목·산업)로 필터.
- **경쟁사(Competitor Tracking)**: 해당 국가 시장의 경쟁사만. **관심 스코프**(업계·관심 제품/품목) 입력·저장으로 needs 파악 및 추적/학습 기반 구축. API: `GET/PUT /api/competitors/tracking-profile` (industries, product_focus), `GET /api/competitors/industry-options`, `GET/POST/DELETE /api/competitors/list`, `GET /api/competitors/events`, `GET/POST /api/competitors/reports`, `GET/PUT /api/competitors/alert-settings`. Market Intel 요약 블록 연동(해당 시장 뉴스·동향)으로 시장 흐름과 경쟁사 동향 통합 뷰 제공.
- SEO: `country_code` + `seo_locale`로 키워드·콘텐츠 스코핑.

### Pillar 2 — B2B Trade

- 바이어 매칭: `countries` 필터 = 현재 국가(또는 타깃 국가).
- 결제·인코텀스·랜디드코스트: `country_master.currency` + `market_profiles.b2b_strategy`.
- 상업송장·HS: 목적지 국가 기준.

### Pillar 3 — B2C Commerce

- 채널·재고·가격·프로모션: `market_profiles.b2c_strategy` + 국가별 설정.
- 리뷰·추천: 해당 국가 마켓플레이스/자사몰 기준.

### Pillar 4 — Gov Tender

- 공고 소스: 국가별(나라장터, GSA, UNGM 등). `country_code`로 소스 선택.
- 규격·참가자격: 해당 국가 규칙. 모니터링·알림도 국가별.

---

## 7. 고객 등록 폼

- **경로**: `/register`. 계정(이메일·비밀번호) + 조직명 + 타깃 국가(복수) + 품목·산업·업체 유형·B2B/B2C 선택.
- **플로우**: Supabase `signUp` 후 백엔드 `POST /api/markets/register`로 조직·시장 정보 전달. (실제 DB 연동은 Supabase 테이블 추가 후 적용 가능.)
- **UX**: 섹션별 카드(계정·조직 / 타깃 시장 / 사업 정보), 국가 버튼 다중 선택, 업체 유형 버튼, 로그인 링크.

---

## 8. 구현 단계

1. **기반**: 조직·마켓 타입, 국가 마스터(목록), 마켓 컨텍스트 서비스(백엔드), 마켓 Context + 국가 선택기(프론트), API에 `X-Country` 전달. **고객 등록 폼** (`/register`) 구현.
2. **Pillar 1**: Market Intel / Competitor / SEO API에 `country` 스코프 반영.
3. **Pillar 2**: B2B API에 `country` 스코프 반영.
4. **Pillar 3**: B2C API에 `country` 스코프 반영.
5. **Pillar 4**: Gov Tender API에 `country` 스코프 반영.
6. **DB**: Supabase에 `organizations`, `organization_markets`, `market_profiles`, `country_master` 테이블 및 RLS.

---

*이 문서는 시스템 전반의 스코프·데이터 적용 기준을 정의합니다. 실제 테이블·API 스펙은 코드와 마이그레이션을 따릅니다.*

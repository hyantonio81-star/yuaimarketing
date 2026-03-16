# 시장 인텔 파이프라인 (Market Intel Pipeline)

## 흐름 요약

```
[툴 Tools] → [서비스 Services] → [결과물 Outputs]
     ↓              ↓                    ↓
  소스 목록     수집→분석→인사이트      니즈/불만/리포트
     ↓
[데이터 소스 Data Sources] (무료/유료 API·RSS·사이트)
```

## 1. 툴 (Tools)

| id       | 이름             | 설명 |
|----------|------------------|------|
| social   | 소셜·커뮤니티   | Reddit, X, YouTube 댓글·멘션 수집 |
| reviews  | 리뷰·평점       | Amazon, 앱스토어, G2 리뷰 |
| search   | 검색·트렌드     | Google Trends, 키워드 검색량 |
| trade    | 무역·관세       | HS코드별 수출입, 관세 데이터 |
| official | 공식·통계       | 국가통계, 유엔 무역 DB |

## 2. 서비스 (Services) — 3단계

| step | 이름         | 설명 |
|------|--------------|------|
| 1    | 데이터 수집   | 국가·업계·아이템 기준 소스별 수집 |
| 2    | 분석·가공     | NLP·감정분석, 토픽 모델링, 시계열 |
| 3    | 인사이트·리포트 | 니즈·불만·구매의도 요약, 리포트 생성 |

## 3. 결과물 (Outputs)

**메타 전용(파이프라인 예정):**
- 소비자 니즈 Top 10 (주간)
- 불만 포인트 분석 (이슈별)
- 구매 의도 신호 (실시간)

**실제 연동 아웃풋 (결과물 섹션에서 "보기"로 이동):**
- **세분화 분석 결과** — 조사 실행 후 시장 장악·관련 업체·사용 소스 (GET /segmented-analysis-results, POST /run-research)
- **뉴스 요약** — 국가별·관심 분야(b2b/b2c) 필터 (GET /news-summary)
- **시장 리포트** — PDF/DOCX/Excel 생성 (POST /generate-report, GET /reports/:jobId/download)

## 4. API 엔드포인트 (백엔드)

| 용도           | 메서드/경로 | 연동 소스 |
|----------------|-------------|-----------|
| 소스 목록      | GET /sources | 내부 SOURCES |
| 뉴스 요약      | GET /news-summary | **관심 분야(categories) 서버 필터** · 로컬 시장(DGCP 등) + NewsData/Mediastack/RSS |
| 세분화 분석 결과 | GET /segmented-analysis-results | **UN Comtrade (HS 코드 지원), World Bank, OpenCorporates** |
| 경제 지표      | GET /indicators | **World Bank** |
| 경제 스냅샷    | GET /economic-snapshot | World Bank, IMF, FRED(선택) |
| FRED 시계열    | GET /series | **FRED** (FRED_API_KEY 시) |
| IMF 지표       | GET /imf | **IMF Data** |
| OECD 데이터셋  | GET /oecd | **OECD Stat** |
| UNIDO 제조·산업 | GET /unido | **UNIDO** |
| 회사 검색      | GET /companies | **OpenCorporates** (토큰 선택) |
| YouTube 검색  | GET /youtube/search | **YouTube Data API** (API 키) |
| YouTube 댓글  | GET /youtube/comments | **YouTube Data API** (API 키) |
| Google 트렌드 | GET /trends | **SerpApi** (유료 SERPAPI_KEY) |
| Google 검색   | GET /google-search | **SerpApi** 또는 **Google Custom Search** (키) |
| 도미니카 DGCP | GET /dgcp-dominican | **DGCP (정부조달 오픈데이터, OCDS)** |
| Facebook 페이지 | GET /facebook/page | **Meta Graph API** (토큰) |
| Facebook 검색 | GET /facebook/search | **Meta Graph API** (토큰, PPMA 권한) |
| 리포트 설정/생성 | GET\|PUT /report-settings, POST /generate-report | 옵션 저장, 생성은 스텁 |

## 5. 연동된 API (무료·유료)

| API | 용도 | 키 |
|-----|------|-----|
| World Bank Open Data | 국가별 지표(GDP 등), 프로젝트 검색 | 불필요 |
| UN Comtrade | 무역 통계 (수출/수입) | 불필요 (1 req/s 제한) |
| RSS (Reuters, BBC) | 뉴스 헤드라인 | 불필요 |
| FRED | 경제 시계열 | FRED_API_KEY (선택) |
| IMF Data | GDP·환율 등 지표 | 불필요 |
| OECD Stat | 무역·산업 지표 | 불필요 (제한 있음) |
| UNIDO | 제조·산업 통계 (CIP 등) | 불필요 |
| OpenCorporates | 회사 검색 (법인 정보) | OPENCOMPORATES_API_TOKEN (선택, 제한 완화) |
| YouTube Data API v3 | 동영상 검색·댓글 | GOOGLE_API_KEY 또는 YOUTUBE_API_KEY (무료 쿼터 1만/일) |
| Google Custom Search | 웹 검색 (100회/일 무료) | GOOGLE_API_KEY + GOOGLE_CSE_ID (2027년 종료 예정) |
| SerpApi | Google 검색·트렌드 스크래핑 | SERPAPI_KEY (유료) |
| DGCP (도미니카) | 정부조달 입찰·계약 (OCDS) | 불필요 (DGCP_API_BASE 선택) |
| Facebook Graph API | 페이지 조회·검색 | FB_ACCESS_TOKEN 또는 FB_APP_ID+FB_APP_SECRET (PPMA App Review 필요할 수 있음) |

**리포트 파이프라인 (POST /generate-report):**  
`buildReportData()` → **Supervisor** (`runMarketIntelSupervisor`)가 세분화 의뢰·옵션을 읽고 **세분화 분석**(Comtrade HS 코드 반영 + World Bank + OpenCorporates)과 **뉴스 요약**을 병렬 실행 후 리포트용 데이터 반환.  
- **HS 코드**: 의뢰에 `hs_code`가 4자리/6자리 숫자면 Comtrade `cc` 파라미터로 전달되어 해당 품목 수출·수입만 집계됨.

**뉴스 검색 설정 확인:**  
- **관심 분야**: `GET /news-summary?country=DO&lang=ko&categories=b2b,b2c` 로 요청 시 서버에서 b2b/b2c/both 기준 필터링 후 반환. 프론트에서 선택한 관심 분야가 그대로 API에 전달됨.  
- **로컬 시장 데이터**: 국가가 DO(도미니카)일 때 **DGCP 정부조달** API에서 입찰/공고를 가져와 뉴스 요약 상단에 포함. 그 외 NewsData → Mediastack → RSS 순으로 수집 후 병합.  
- **미설정 시**: 뉴스 API 키 없으면 RSS(Reuters, BBC)만 사용.  
- 확인 방법: `GET /api/market-intel/news-summary?country=DO&lang=ko` 호출 후 `items`에 DGCP 항목 또는 RSS 항목이 있으면 정상.

**백엔드 환경변수 예시 (선택):**  
`NEWSDATA_API_KEY`, `MEDIASTACK_ACCESS_KEY` → 뉴스 요약 (미설정 시 RSS만 사용)  
`OPENCOMPORATES_API_TOKEN` → OpenCorporates 제한 완화 (세분화 분석 관련 업체 추천)  
`GOOGLE_API_KEY` 또는 `YOUTUBE_API_KEY` → YouTube 검색/댓글  
`GOOGLE_CSE_ID` → Google Custom Search (동일 키와 함께)  
`SERPAPI_KEY` → SerpApi (Google 검색·트렌드, 유료)  
`DGCP_API_BASE` → 도미니카 DGCP API base URL (기본: dgcp.gob.do/datos-abiertos/api)  
`FB_ACCESS_TOKEN` 또는 `FB_APP_ID`+`FB_APP_SECRET` → Facebook 페이지/검색

## 6. 에이전트 팀 (marketIntelAgents)

| 에이전트 | 역할 | 출력 |
|----------|------|------|
| **TradeAgent** | UN Comtrade HS 코드별 수출/수입 | exportData, importData, year, countryCode, hsCode |
| **CompanyAgent** | OpenCorporates 기업 검색 | companies, query, jurisdictionCode |
| **NewsAgent** | 국가별 뉴스 요약 (NewsData → Mediastack → RSS) | NewsSummaryItem[] |
| **Supervisor** | 위 데이터 수집 오케스트레이션 | request, segmentedResult, newsItems, options, lang |

리포트 생성 시 `buildReportData()` → Supervisor + `buildTopCompanyDetails()` 로 세분화 분석(Comtrade+World Bank+OpenCorporates)과 뉴스 요약, **주요 바이어/업체 Top 10** 및 **1~3위 업체 1페이지 상세**(OpenCorporates 검색)를 포함한다.  
- **Top 10**: 시장 장악(파트너국)·관련 업체 리스트 각 10건.  
- **Top 3 상세**: 관련 업체 1~3위에 대해 업체 정보·연락처·수입/수출 안내·제품 선호/지역 문구를 1업체 1페이지로 리포트에 포함.  
- **데이터소스 API 반영**: 조사 시 **DGCP**(DO일 때)·**IMF**·**OECD**·**UNIDO** 를 자동 호출해 `supplementary_data` 및 `data_sources_used`에 반영. (무료 API만 사용)

## 7. SOURCES 연동 현황 (marketIntelService SOURCES 기준)

- **SOURCES.connected**: 백엔드 API가 구현된 소스는 `connected: true`. 프론트 데이터소스 카드에 "연동" 뱃지 표시.
- **조사 실행 시 사용 소스**: `SOURCE_IDS_FOR_SEGMENTED`(un_comtrade, world_bank, opencorporates, dgcp_do, imf_data, oecd_stat, unido)와 사용자 선택 **enabled_paid_source_ids**를 병합해 `getSegmentedAnalysisResultAsync(..., { enabledSourceIds })`에 전달. 해당 id에 해당하는 API만 호출(Comtrade/WB/OC 및 보강 DGCP·IMF·OECD·UNIDO).

| source id | 연동 여부 | 사용처 |
|-----------|-----------|--------|
| world_bank | 연동됨 | /indicators, /economic-snapshot, Gov 입찰(프로젝트) |
| un_comtrade | 연동됨 | /segmented-analysis-results |
| reuters_rss | 연동됨 | /news-summary (Reuters, BBC) |
| fred | 연동됨 (키 시) | /series, /economic-snapshot |
| imf_data | 연동됨 | /imf, /economic-snapshot |
| oecd_stat | 연동됨 | /oecd |
| unido | 연동됨 | /unido |
| opencorporates | 연동됨 | /companies |
| youtube_api | 연동됨 (키 시) | /youtube/search, /youtube/comments |
| google_trends | 연동됨 (SerpApi 유료) | /trends |
| serp_api | 연동됨 (키 시) | /google-search, /trends |
| dgcp_do | 연동됨 | /dgcp-dominican (도미니카 정부조달) |
| facebook_api | 연동됨 (키 시) | /facebook/page, /facebook/search |
| reddit_api | 미연동 | OAuth/API 키 필요 |
| wto_tariff | 미연동 | WTO API 포털 키, 클라이언트 미구현 |

**LATAM B2B·연락처 소스 (SOURCES 확장, 메타 등록·연동 추후)**  
| source id | 카테고리 | 용도 |
|-----------|-----------|------|
| connectamericas | latam_b2b | ConnectAmericas (IDB)·10만+ 기업·구매 공고 |
| solostocks | latam_b2b | SoloStocks (MX/CO/CL)·공업 부품·도매 |
| quiminet | latam_b2b | QuimiNet·멕시코 중심 화학·식품·기계 |
| tradekey_latam | latam_b2b | TradeKey Latin America |
| conectnext | latam_b2b | ConectNext·산업 기계·고부가가치 |
| b2bmap_peru | latam_b2b | B2BMAP (페루) |
| paginas_amarillas | directory_contact | Páginas Amarillas (9개국) |
| telelistas_br | directory_contact | Telelistas (브라질) |
| seccion_amarilla_mx | directory_contact | Sección Amarilla (멕시코) |
| publicar_latam | directory_contact | Publicar (CO/CL/PE 등) |
| paginas_amarillas_rd | directory_contact | Páginas Amarillas RD (도미니카) |
| aird_do | export_promotion | AIRD (도미니카 산업 협회) |
| adoexpo_do | export_promotion | ADOEXPO (도미니카 수출업체 협회) |
| camara_santo_domingo | export_promotion | Cámara Santo Domingo (상공회의소) |
| twilio_lookup | directory_contact | Twilio Lookup·번호 검증 (유료 API) |

**데이터 플랫폼 강화 전략 요약**  
- **1계층**: 공식 API·오픈데이터 (Comtrade, DGCP, NewsData 등) — 기존 유지·보강.  
- **2계층**: LATAM B2B 플랫폼 (ConnectAmericas, SoloStocks, QuimiNet 등) — API 유무 확인 후 어댑터 또는 스크래핑 스펙 문서화.  
- **3계층**: 연락처·검증 (Yellow Pages, Twilio) — B2B 공개 번호 위주, 옵트인·LGPD 고려.  
- **자동화**: 공급망 매칭(공고+기업 소스), Due Diligence(디렉토리 크로스 체크), WhatsApp 리드 발송은 리스트 제공까지 플랫폼 책임·발송은 Lumi/별도 서비스.

**도미니카공화국 (DO):** PRODOMINICANA(수출진흥청), **DGCP**(정부조달 API 연동), **PROINDUSTRIA**(제조·경쟁력), **CNZFE**(수출자유지역), **DGA**(관세청) — SOURCES에 등록, DGCP만 무료 API 제공.

**B2B·수출진흥 사이트:** 인도 FIEO, DGFT, IndiaMART, EPC / 베트남 Vietrade, Vietnam Export / 인도네시아 TEI, Kemendag / 브라질 ApexBrasil / 남아공 TISA / 방글라데시 EPB / 파키스탄 TDAP 등 (site 타입).

**소셜·소셜커머스:** **Facebook (Meta) Graph API** 연동(페이지 조회·검색). SOURCES에 **facebook_api**, **instagram_api**, **tiktok_business_api**, **social_commerce**(Facebook Shop, Instagram Shopping, TikTok Shop) 추가 — Instagram/TikTok 전용 클라이언트는 토큰·비즈니스 API 정책에 따라 추후 확장.

## 8. 프론트 연동

- **MarketIntel.jsx**: 툴/서비스/결과물, 소스 목록, 세분화 의뢰 저장 → 세분화 분석 결과, 뉴스 요약, 리포트 설정, 유료 소스 선택.
- **api.js** `marketIntelApi`: getSources, getNewsSummary, getSegmentedAnalysisResults, getReportSettings, generateReport, getIndicators, getEconomicSnapshot, getSeries, getImf, getOecd, getUnido, getCompanies, **getYoutubeSearch**, **getYoutubeComments**, **getTrends**, **getGoogleSearch** 등.

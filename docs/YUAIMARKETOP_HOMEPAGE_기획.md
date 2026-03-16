# www.yuaimarketop.com 홈페이지 기획서

## 1. 목적·위치

| 항목 | 내용 |
|------|------|
| **도메인** | www.yuaimarketop.com |
| **브랜드** | YUAI Marketop |
| **역할** | (1) 브랜드 공식 사이트 (2) Nexus AI·소셜·광고의 공통 랜딩 허브 (3) 제품/캠페인별 딥링크 진입점 |
| **주 사용자** | 인스타·Threads·FB 포스트/광고·이메일에서 유입된 방문자, 제휴/제품 링크 클릭자 |

---

## 2. 전체 사이트 구조 (권장)

```
www.yuaimarketop.com
├── /                    → 메인(홈)
├── /links               → 링크 허브 (Linktree 대체, 인스타/Threads 바이오용)
├── /go/[id]             → 단축 리다이렉트 (제휴 URL 관리용, 목적지 변경 시 설정만 수정)
├── /products            → 제품 카탈로그/리스트 (선택)
├── /p/[slug]            → 제품별 랜딩 (캠페인·포스트별 딥링크)
├── /blog                → 블로그 목록 (Nexus AI 블로그와 연동 시)
└── /contact             → 문의/연락 (선택)
```

- **/go/[id]**: 포스트/광고에서는 `yuaimarketop.com/go/amazon-pick` 등 고정 URL만 사용. 실제 제휴 URL은 nexus-ai `backend/data/redirects.json` 또는 환경변수로 관리. 플랫폼 정책 변경 시 한 곳만 수정.
- **메인(/)**: 브랜드 소개 + CTA로 `/links` 또는 인기 제품/캠페인으로 유도.
- **/links**: 단일 스크롤 페이지에 “쇼핑”, “블로그”, “SNS”, “문의” 등 버튼/카드 배치 → Nexus AI의 “랜딩 URL”로 사용.
- **/p/[slug]**: 제품·캠페인별 전용 랜딩. 포스트/광고에서 `yuaimarketop.com/p/xxx` 로 보내고, 해당 페이지에서 최종 제휴 구매 링크로 연결.

---

## 3. 메인 페이지(/) 구성 기획

### 3.1 섹션 순서 및 역할

| 순서 | 섹션명 | 목적 | Nexus AI 연동 |
|------|--------|------|----------------|
| 1 | **히어로** | 브랜드명·한 줄 소개·주요 CTA | CTA → /links 또는 인기 /p/xxx |
| 2 | **서비스 요약** | 시장 인텔·제품 큐레이션·마케팅 지원 등 3~4개 카드 | 콘텐츠 허브/제품 분석 이미지·문구 재활용 가능 |
| 3 | **인기 링크/제품** | 상위 3~6개 제품 또는 채널 카드 | Threads Commerce·제휴 상품 링크로 연결 |
| 4 | **모든 링크** | “전체 링크 보기” 버튼 → /links | 랜딩 URL = /links 로 통일 시 이 섹션이 핵심 |
| 5 | **SNS/채널** | 인스타·Threads·FB 아이콘 링크 | 포스트·프로필로 역연결 |
| 6 | **푸터** | 연락처·이메일(hyantonio81@gmail.com)·저작권·필요 시 간단 법적 문구 | - |
| (선택) | **사회적 증거** | “많은 쇼퍼들이 선택” 등 문구 또는 추후 수치·리뷰 슬라이드 | 전환율 보조 |

### 3.2 히어로 영역 (상단)

- **로고/브랜드**: YUAI Marketop.
- **헤드라인**: 예) “시장 인사이트와 맞춤 제품을 한곳에서” (또는 영문/스페인어 버전).
- **서브카피**: 1~2문장으로 역할 설명. (권장) “전문가가 큐레이션한 중남미/글로벌 트렌드 상품” 등 무역·전문성 강조.
- **CTA 버튼**:
  - 주 CTA: “모든 링크 보기” → `/links`
  - 보조 CTA: “쇼핑하기” → `/links#shopping` 또는 대표 `/p/xxx`.

### 3.3 “인기 링크/제품” 섹션

- 카드 3~6개: 썸네일·제품명(또는 채널명)·짧은 설명·“보기” 버튼.
- 클릭 시:
  - 제품: `/p/[slug]` 또는 직접 제휴 URL(Amazon/쉬인/테무 등).
  - 채널/블로그: `/links` 내 해당 앵커 또는 외부 URL.
- Nexus AI에서 자동 생성하는 상품·포스트와 매칭하려면, “인기 상품”을 수동/반자동으로 갱신하거나, 나중에 API/피드로 연동할 수 있도록 설계 여지 확보.

---

## 4. /links 페이지 (링크 허브) 기획

- **용도**: 인스타·Threads 바이오, FB “웹사이트” 링크, Nexus AI “랜딩 페이지 URL”로 사용.
- **UI 권장 — 카드형**: 텍스트 버튼만 쓰지 말고 **썸네일 이미지가 포함된 카드**로 구성. 이커머스·소셜 유입자는 시각 정보에 반응이 크므로 카드형이 전환에 유리함.
- **구성**:
  - 상단: YUAI Marketop 로고·짧은 문구.
  - 블록별 구분 (각 항목 = **카드**: 썸네일 + 라벨 + 링크):
    - **쇼핑**: Amazon·쉬인·테무 등 채널별 또는 “추천 상품” 링크.
    - **콘텐츠**: 블로그·시장 인사이트 요약 링크.
    - **SNS**: 인스타·Threads·FB 프로필 링크.
    - **문의**: 이메일·문의 폼 링크.
  - 제휴 링크는 `yuaimarketop.com/go/[id]` 로 보내거나 Nexus AI 설정(Associate Tag 등)이 붙은 URL을 그대로 사용.
- **(선택)** 뉴스레터 구독: “매주 핫 아이템 리포트 받기” 등 블록을 /links 중간 또는 푸터 위에 배치.

이렇게 하면 “한 URL(/links)로 모든 채널과 Nexus AI를 일원화”할 수 있습니다.

---

## 5. /p/[slug] (제품별 랜딩) 기획

- **URL 예**: `www.yuaimarketop.com/p/amazon-summer-pick`, `www.yuaimarketop.com/p/shein-dress-01`.
- **페이지 요소**:
  - 제품 이미지·이름·요약 설명.
  - 가격·할인 문구(있을 경우).
  - **“구매하기” 버튼**: 최종 제휴 URL(Amazon tag, 쉬인/테무 파라미터 포함)로 이동.
  - (선택) “다른 제품 보기” → `/links` 또는 `/products`.
- **Nexus AI 연동**: Threads Commerce·콘텐츠 자동화에서 만드는 포스트의 “상품 링크”를 (1) 직접 제휴 URL로 보내거나, (2) `yuaimarketop.com/p/xxx` 로 보내고, 해당 페이지에서 제휴 URL로 리다이렉트/버튼 링크. (2)가 되면 픽셀·전환 측정을 본인 도메인에서 일괄 관리하기 좋습니다.

---

## 6. Nexus AI와의 효율적 연동 정리

| Nexus AI 기능 | yuaimarketop.com 활용 |
|---------------|------------------------|
| **Threads Commerce “랜딩 페이지 URL”** | `https://www.yuaimarketop.com/links` (또는 `https://www.yuaimarketop.com`) |
| **포스트 내 상품 링크** | 제휴 URL 직접 노출 또는 `https://www.yuaimarketop.com/p/[slug]` 또는 **`https://www.yuaimarketop.com/go/[id]`** 로 유도 후 구매 버튼/리다이렉트에서 제휴 URL |
| **제휴 URL 관리 (/go)** | nexus-ai 백엔드 `backend/data/redirects.json`(또는 env)에서 id별 목적지 URL 관리. 플랫폼 정책 변경 시 한 곳만 수정 |
| **제휴 추적** | [AFFILIATE_TRACKING_LINKS.md](./AFFILIATE_TRACKING_LINKS.md) 대로 Amazon/쉬인/테무 설정 유지; 랜딩은 yuaimarketop.com으로 통일 |
| **FB 픽셀** | 메인·/links·/p/* 모든 공개 페이지에 동일 픽셀 설치 → 트래픽·전환 측정 |
| **콘텐츠 허브** | 블로그 요약·시장 인사이트를 yuaimarketop.com/blog 또는 /links#content 로 연결 가능 |

---

## 7. 기술·구현 권장사항

- **호스팅**: Vercel·Netlify(정적 사이트) 또는 Google Sites(빠른 구축). 도메인은 Google Domains(Workspace)에서 yuaimarketop.com을 Vercel/Netlify/Sites에 연결. 연결 시 [YUAIMARKETOP_DOMAIN_VERCEL_체크리스트.md](./YUAIMARKETOP_DOMAIN_VERCEL_체크리스트.md) 참고.
- **픽셀 (Meta)**: 메인·/links·/p/* **공통 레이아웃**에 Meta 픽셀 스크립트 한 번 삽입. 전환 이벤트(Lead, Purchase)는 구매 버튼·문의 제출 시 `fbq('track', 'Lead')` / `fbq('track', 'Purchase', ...)` 추가. 상세는 [FACEBOOK_BUSINESS_MANAGER_연계_시나리오.md](./FACEBOOK_BUSINESS_MANAGER_연계_시나리오.md).
- **GA4 (Google Analytics 4)**: 동일하게 **공통 레이아웃**에 gtag.js 한 번 삽입. 유입·페이지뷰·전환(이벤트) 측정. 랜딩 오픈과 동시에 설치 권장.
- **CORS/API**: Nexus AI 대시보드를 나중에 `app.yuaimarketop.com` 등 서브도메인으로 둘 경우, 백엔드 `ALLOWED_ORIGINS`에 `https://www.yuaimarketop.com`, `https://app.yuaimarketop.com` 추가.
- **언어**: YUAI Marketop 타깃에 맞춰 ko/en/es 중 선택 또는 멀티 언어(경로/쿼리) 준비.
- **(확장)** 상품 데이터: /p/[slug]가 많아지면 Strapi·Sanity 등 Headless CMS로 상품명·이미지·제휴 URL 관리 후 페이지 자동 생성 권장.
- **(확장)** OG 이미지: slug별 동적 미리보기(예: @vercel/og)로 SNS 공유 시 클릭률 개선.

---

## 8. 우선순위별 구현 단계 제안

| 단계 | 범위 | 결과물 |
|------|------|--------|
| **0** | 도메인·Vercel 연결 | [YUAIMARKETOP_DOMAIN_VERCEL_체크리스트.md](./YUAIMARKETOP_DOMAIN_VERCEL_체크리스트.md) 완료 후 www.yuaimarketop.com 접속 가능 |
| **1** | 메인(/) + /links | 히어로·서비스 요약·“모든 링크” CTA·**카드형** /links 페이지. Nexus AI 랜딩 URL을 `https://www.yuaimarketop.com/links` 로 설정 |
| **2** | 픽셀 + GA4 + 푸터 | 메인·/links **공통 레이아웃**에 Meta 픽셀·GA4 설치, 푸터에 연락처·이메일 |
| **3** | /p/[slug] 2~3개 | 대표 제품 2~3개로 제품 랜딩 페이지 구성, 구매 버튼 → 제휴 URL 또는 `/go/[id]` |
| **4** | 확장 | /products·/blog·캠페인별 slug 확대, 인기 상품 갱신·CMS·OG 이미지 검토 |

### 랜딩 코드 위치

- **경로**: `nexus-ai/landing` (Vite + React). 라우트: `/`, `/links`, `/go/:id`, `/p/:slug`. `/go/:id`는 Nexus AI 백엔드 `GET /api/go/:id`로 이동.
- **로컬**: 루트에서 `npm run dev:landing` 또는 `cd landing && npm run dev` (포트 5174).
- **Vercel 배포**: 새 프로젝트에서 Root Directory = `landing`, 환경변수 `VITE_API_URL` = 백엔드 URL. [landing/README.md](../landing/README.md) 참고.

### Quick Start (최소 기능 우선)

- **Step 0**: 도메인 소유권 인증 + Vercel 연결(체크리스트).
- **Step 1**: /links 페이지를 가장 먼저 구현하고 모든 SNS 바이오를 이 URL로 통일.
- **Step 2**: 픽셀·GA4 설치 후 유입·전환 관찰.
- **Step 3**: 상품이 늘어나면 /p/[slug] 템플릿화 및 Nexus AI·/go 데이터 연동.

---

## 참고 문서

- [YUAIMARKETOP_DOMAIN_VERCEL_체크리스트.md](./YUAIMARKETOP_DOMAIN_VERCEL_체크리스트.md) — 도메인·Vercel 연결 시 확인
- [AFFILIATE_TRACKING_LINKS.md](./AFFILIATE_TRACKING_LINKS.md) — 제휴 링크 설정
- [FACEBOOK_BUSINESS_MANAGER_연계_시나리오.md](./FACEBOOK_BUSINESS_MANAGER_연계_시나리오.md) — BM·픽셀 연동
- [AFFILIATE_HUB_STRUCTURE.md](./AFFILIATE_HUB_STRUCTURE.md) — 콘텐츠 허브 구조

# 랜딩·이커머스 개선 기획 (2026 트렌드 반영)

Gemini 정리 내용(3D 웹 트렌드, 웹앱 설정, 어필리에이트 클로킹)을 **nexus-ai / YUAI Marketop** 현재 스택(React/Vite, Fastify 백엔드)에 맞춰 적용 가능한 항목과 우선순위를 정리한 문서입니다.

---

## 1. 현재 상태 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| **제휴 클로킹** | ✅ 구현됨 | `yuaimarketop.com/go/[id]` → Vercel rewrite → `/api/go/:id` → 302 |
| **다크 모드** | ✅ 지원됨 | 테마 토글(다크/라이트/시스템), `theme-color` in index.html |
| **랜딩/링크 허브** | ✅ 기본 구현 | `landing/src/pages/Home.jsx`, `Links.jsx` — 메타·픽셀 placeholder 보강 여지 있음 |
| **PWA** | ✅ 구현됨 | `landing/public/manifest.json`, index.html 링크 연동 |
| **마이크로 인터랙션** | ✅ 적용됨 | CTA·카드·네비 hover/active scale, `btn-micro`·card-float |
| **벤토 그리드** | ✅ 적용됨 | Bento 스타일 그리드 + 셀 링/호버 시각 강화 (`landing/` Home.jsx) |
| **3D/Lottie** | ❌ 미적용 | 선택 시 히어로 또는 카드 1곳 시범 적용 |
| **이미지 최적화** | △ 부분 | WebP·picture 전략 정리 필요 |

---

## 2. Gemini 제안 → 적용 가능성 및 개선 기획

### 2.1 3D·인터랙션 (난이도·효과 균형)

- **인터랙티브 제품 프리뷰 (회전/색상 변경)**  
  - **적용**: 제품 랜딩(`/p/[slug]`) 또는 링크 허브 "쇼핑" 카드에서 선택적 도입.  
  - **도구**: Spline 임베드 또는 Three.js(전문 개발 시). 우선 **이미지 + 호버 줌**으로 대체 가능.  
  - **우선순위**: 중 (상품 페이지 확장 시)

- **스크롤리텔링 (스크롤에 따른 3D/모션)**  
  - **적용**: 랜딩 메인 섹션에서 "서비스 소개" 블록에 스크롤 기반 간단 모션.  
  - **구현**: CSS scroll-driven animations 또는 Lottie + Intersection Observer로 가벼운 버전 권장.  
  - **우선순위**: 낮음 (콘텐츠 안정화 후)

- **마이크로 인터랙션**  
  - **적용**: 버튼·카드 호버 시 `scale(1.02)`, `transition`, 아이콘 살짝 움직임.  
  - **구현**: Tailwind `hover:scale-105`, `transition-transform` 등으로 즉시 적용 가능.  
  - **우선순위**: 높음 (코드 변경 최소, 체감 품질 상승)

- **벤토 그리드 레이아웃**  
  - **적용**: `landing/src/pages/Home.jsx`의 "서비스 요약" 3열 그리드 → **Bento 스타일**(사각형 박스, 크기 차이·그룹핑) 적용.  
  - **구현**: CSS Grid + Tailwind `col-span-2`·`row-span-2`, `bento-cell`·`bento-cell-featured` 링/호버 시각 강화.  
  - **상태**: 적용 완료.

---

### 2.2 3D 도구 선택 가이드 (프로젝트 기준)

| 도구 | 용도 | 언제 쓸지 |
|------|------|-----------|
| **Spline** | 웹 전용 3D, 피그마형 워크플로우 | 랜딩 히어로·제품 비주얼 하나씩 도입 시 |
| **Vectary** | 3D·AR, 이커머스 연동 | 상품 페이지 본격화 시 |
| **Three.js** | 완전 커스텀 | 퍼포먼스·커스텀 요구가 있을 때만 |
| **Lottie** | 가벼운 모션(아이콘·일러스트) | 3D 없이 "생동감"만 줄 때 우선 추천 |

현재 단계에서는 **Lottie + 벤토 그리드 + 마이크로 인터랙션** 조합으로 진행하는 것을 권장합니다.

---

### 2.3 웹앱 설정 (PWA·성능·다크모드)

- **PWA(Progressive Web App)**  
  - **적용**: `manifest.json` 추가, `theme-color`·`short_name`·`start_url` 설정. (선택) 서비스 워커로 오프라인 캐시.  
  - **우선순위**: 중 — 재방문율·"앱처럼 설치" 경험 목표 시 진행.  
  - **참고**: `landing/index.html`에 `theme-color` 및 manifest 링크 있음. `landing/public/manifest.json`과 연동됨.

- **이미지 최적화**  
  - **적용**: 썸네일·제품 이미지는 **WebP** 제공, 가능하면 `picture`/`srcset`로 폴백.  
  - **3D 대체**: 무거운 3D 대신 **Lottie** 또는 정적 이미지 + CSS 호버로 로딩 속도 유지.  
  - **우선순위**: 높음 (랜딩·링크 허브에 이미지 도입 시 필수).

- **다크 모드**  
  - **적용**: 이미 지원 중. 랜딩·링크 허브가 라우트 공통 레이아웃을 쓰면 시스템/클래스 기반 다크 모드가 그대로 적용됨.  
  - **개선**: 헤더에 테마 토글(다크/라이트/시스템) 추가 완료. `ThemeContext`·`ThemeSwitcher` 사용.

---

### 2.4 어필리에이트 클로킹 (Pretty Links 스타일)

- **현재 구조**:  
  - 공개 URL: `https://www.yuaimarketop.com/go/[id]`  
  - Vercel: `/go/:id` → `/api/go/:id`  
  - 백엔드: `GET /api/go/:id` → `redirects.json` 또는 `GO_*` env → 302  
- **적용**: 이미 Gemini 권장과 동일한 "깔끔한 단축 URL" 구조입니다.  
- **개선**:  
  - **문서화**: `AFFILIATE_TRACKING_LINKS.md`에 "클로킹 규칙"(항상 `yuaimarketop.com/go/xxx`만 노출, 목적지 변경은 서버/env만 수정) 명시.  
  - **프론트**: 링크 허브·포스트에서는 **상대 경로 `/go/xxx`** 사용 권장 (같은 도메인일 때).  
  - **redirects.json 스키마**: 예시 및 env 예시를 문서에 보강.

---

## 3. 우선순위별 실행 계획

| 단계 | 항목 | 작업 내용 | 산출물 |
|------|------|-----------|--------|
| **Phase A** | 마이크로 인터랙션 | 버튼·카드·네비 hover/active scale, transition | ✅ Home.jsx, Links.jsx, Layout.jsx, index.css |
| **Phase A** | 벤토 그리드 | Bento 스타일 그리드 + 셀 시각 강화 | ✅ landing/src/pages/Home.jsx, index.css |
| **Phase A** | 어필리에이트 문서 | 클로킹 규칙·redirects.json·env 예시 보강 | AFFILIATE_TRACKING_LINKS.md |
| **Phase B** | 랜딩 메타·픽셀 | document title·meta description·픽셀/GA4 placeholder | Home.jsx, Links.jsx, 기획서 체크리스트 |
| **Phase B** | 이미지 전략 | WebP·picture 사용 가이드, Lottie 도입 위치 정리 | docs 또는 기획서 섹션 |
| **Phase C** | PWA | manifest.json 추가, theme-color 연동 | ✅ landing/public/manifest.json, index.html |
| **Phase C** | 다크 모드 토글 | 테마 전환(다크/라이트/시스템) | ✅ ThemeContext, ThemeSwitcher, Layout |
| **Phase C** | (선택) 3D/Lottie | 히어로 또는 카드에 Lottie/Spline 1곳 시범 적용 | 별도 기획 후 |

---

## 4. 참고 경로

- 랜딩·링크: `landing/src/pages/Home.jsx`, `landing/src/pages/Links.jsx`
- 라우트: `landing/src/App.jsx` — `/`, `/links` 등 공개
- 테마: `landing/src/context/ThemeContext.jsx`, `landing/src/components/ThemeSwitcher.jsx`
- PWA: `landing/public/manifest.json`, `landing/index.html`
- 제휴 리다이렉트: `backend/src/routes/goRedirect.ts`, `backend/data/redirects.json`, `vercel.json` rewrites
- 기획·도메인: `docs/YUAIMARKETOP_HOMEPAGE_기획.md`, `docs/YUAIMARKETOP_DOMAIN_VERCEL_체크리스트.md`
- 제휴 가이드: `docs/AFFILIATE_TRACKING_LINKS.md`

---

이 문서를 기준으로 Phase A부터 순차 적용하면, Gemini에서 언급한 "몰입감·속도·클로킹" 요구를 현재 코드베이스에 무리 없이 반영할 수 있습니다.

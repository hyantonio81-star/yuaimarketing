# 콘텐츠 허브 구조 (Affiliate Hub)

B2C·제품 분석·블로그를 **한곳(허브)**에서 관리하고, B2B는 별도 섹션으로 두는 구조입니다.

## 라우트 구조

| 경로 | 역할 |
|------|------|
| `/` (대시보드) | 허브 랜딩: 콘텐츠 허브 카드 + KPI + 일과 루틴 |
| `/b2c` | B2C 커머스 (채널·재고·가격·이커머스) |
| `/b2c/ecommerce` | 이커머스 채널 연동 (Shopify 등) |
| `/market-intel` | 제품·시장 분석 (리포트·뉴스·세분화) |
| `/seo` | 블로그·SEO·콘텐츠 (키워드·스레드 커머스) |
| `/shorts` | Shorts 에이전트 (동영상·소셜 확장) |
| `/b2b` | B2B 무역 (별도 섹션: 리드·바이어·입찰) |

## 대시보드 콘텐츠 허브

- **콘텐츠 허브** 블록: B2C · 제품 분석 · 블로그·콘텐츠 세 카드로 진입점 제공.
- 문구: "B2C·제품 분석·블로그를 한곳에서 관리하고, 동영상·소셜로 확장하세요."
- B2B는 같은 블록 하단에 "B2B는 별도 섹션에서" 링크로 안내.

## 콘텐츠 확장 플로우

1. **허브에서 작성**: 시장 인텔 리포트, B2C 제품/가격, SEO·스레드 포스트.
2. **재가공**: 같은 콘텐츠를 Shorts·동영상·소셜 댓글용으로 요약/스크립트 생성.
3. **채널 배포**: 유튜브·인스타·페이스북 등에 링크는 항상 허브(동일 도메인)로 연결.

번역 키: `dashboard.hubTitle`, `dashboard.hubSubtitle`, `hubB2cTitle`, `hubProductAnalysisTitle`, `hubBlogTitle`, `hubB2bNote` (ko/en/es).

## 참고 문서

- **제휴·추적 링크**: [AFFILIATE_TRACKING_LINKS.md](./AFFILIATE_TRACKING_LINKS.md) — Shein 피드, Amazon/AliExpress/Temu 설정 후 상품 링크 자동 부착.

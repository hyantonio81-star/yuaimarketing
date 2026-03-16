# 제휴·추적 링크 가이드 (Affiliate / Tracking Links)

Threads Commerce와 콘텐츠 자동화에서 **상품 링크에 제휴·추적 ID를 자동으로 붙이는** 방법을 정리합니다.

---

## 1. Shein (쉬인)

- **SHEIN_AFFILIATE_FEED_URL** 환경 변수에는 **이미 제휴·추적 링크가 포함된** 쉬인 파트너 피드 URL을 넣으세요.
- 시스템은 쉬인 상품 URL을 **그대로 사용**하며, 별도 파라미터를 덧붙이지 않습니다.
- 따라서 쉬인 제휴 추적은 **피드 URL 자체가 제휴 피드**인지 확인하면 됩니다.

---

## 2. Amazon / AliExpress / Temu — 한 번 설정 후 자동 부착

다음 ID·파라미터를 **한 번만** 설정해 두면, 포스트·블로그에 올라가는 상품 링크에 자동으로 붙습니다.

| 플랫폼 | 설정 위치 | 설명 |
|--------|-----------|------|
| **Amazon** | Threads Commerce 설정 · 콘텐츠 자동화 설정 | **Amazon Associate Tag** (예: `yoursite-20`) |
| **AliExpress** | 동일 | **제휴 쿼리 문자열** (예: `aff_fcid=xxx`) |
| **Temu** | 동일 | **제휴 쿼리 문자열** (예: `aff_xxx=yyy`) |

- **Threads Commerce**: 대시보드 → SEO·콘텐츠 → 스레드 커머스 → 설정 카드 내 **「제휴(Tracking ID)」** 블록에서 입력.
- **콘텐츠 자동화**: 동일한 필드를 콘텐츠 자동화 설정 API/화면에서 설정하면, 블로그 「Comprar aquí / Buy here」 링크와 SNS(Threads) 발행 시 상품 링크에 동일 로직이 적용됩니다.

동작 요약:

- 상품 풀링 시 **원본 상품 URL**을 가져온 뒤, 플랫폼별로 위 ID·파라미터를 **자동 부착**합니다.
- **한 번 설정 → 이후 포스트·블로그 링크는 모두 추적 링크**로 나갑니다.

---

## 3. 플로우 요약

1. **Shein**: 제휴 피드 URL을 `SHEIN_AFFILIATE_FEED_URL`에 설정.
2. **Amazon / AliExpress / Temu**: Threads Commerce(및 필요 시 콘텐츠 자동화) 설정에서 Associate Tag / 제휴 파라미터 입력.
3. 파이프라인 실행 시 상품 링크가 위 설정에 따라 **자동으로 제휴·추적 링크**로 생성됩니다.

---

## 4. 제휴 단축 링크 (/go) — 목적지 URL 일원 관리

포스트·광고에는 **고정 URL**만 사용하고, 실제 제휴 URL은 서버에서 관리하려면 **단축 리다이렉트**를 사용합니다.

| 항목 | 내용 |
|------|------|
| **URL 형식** | `https://www.yuaimarketop.com/go/[id]` (또는 배포 도메인 `/go/[id]`) |
| **설정 위치** | nexus-ai 백엔드 `backend/data/redirects.json` — `{ "id": "목적지 URL" }` 형태 |
| **환경변수 대안** | `GO_AMAZON_PICK=https://...` 처럼 `GO_` + id(하이픈→언더스코어, 대문자) 로도 설정 가능 |
| **효과** | Amazon/쉬인 등이 제휴 URL 정책을 바꿔도 `redirects.json`(또는 env)만 수정하면 됨 |

자세한 사이트 구조는 [YUAIMARKETOP_HOMEPAGE_기획.md](./YUAIMARKETOP_HOMEPAGE_기획.md) §2·§6 참고.

---

## 5. 콘텐츠 자동화 설정 UI (추후)

콘텐츠 자동화 전용 설정 화면을 만들 경우, 백엔드가 이미 동일 필드(`amazonAssociateTag`, `aliexpressAffiliateParams`, `temuAffiliateParams`)를 지원하므로 **동일한 세 개 입력란**을 추가하면 블로그·SNS 발행 시 같은 제휴 링크 로직이 적용됩니다.

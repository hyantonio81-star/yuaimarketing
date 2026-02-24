# B2C 스키마 및 마이그레이션 가이드

B2C Pillar(재고·이커머스 연동·최적가격 등)에서 사용하는 Supabase 테이블과 설정 방법입니다.

## 환경 변수 (백엔드)

Supabase를 쓰려면 백엔드에 다음이 설정되어 있어야 합니다.

- `SUPABASE_URL` — 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY` — 서비스 롤 키 (서버 전용, 프론트에 노출 금지)
- (선택) `SUPABASE_ANON_KEY` — 서비스 롤이 없을 때 대체용

미설정 시 연동·재고는 메모리 fallback으로 동작합니다.

## 테이블

- **b2c_channel_connections** — 조직별 이커머스 채널 연동 (Shopify 등)
  - `organization_id`, `channel`, `store_url`, `store_name`, `connected_at`
  - `UNIQUE(organization_id, channel)`
- **b2c_inventory** — 조직·국가별 중앙 재고
  - `organization_id`, `country_code`(nullable), `sku`, `central_quantity`, `updated_at`
  - `UNIQUE(organization_id, country_code, sku)`
- **b2c_competitor_prices** (선택) — 경쟁사 가격 실데이터용
  - `organization_id`, `channel`, `sku_or_product`, `price`, `fetched_at`

## 마이그레이션 실행

1. Supabase 대시보드 → SQL Editor
2. `docs/supabase-b2c-migrations.sql` 내용을 붙여넣고 실행

## Supabase 미설정 시

- **연동(connections)**: 메모리(Map)에 저장되며, 서버 재시작 시 초기화됩니다.
- **재고(inventory)**: 메모리(Map)에 `orgId|countryCode|sku` 키로 저장됩니다.
- API와 프론트 동작은 동일하며, 스코프(`x-organization-id`, `x-country` / `?country=`)는 그대로 적용됩니다.

## 스코프

- **조직**: `X-Organization-Id` 헤더로 조직 ID 전달. 미전달 시 `default` 사용.
- **국가**: `X-Country` 헤더 또는 `?country=` 쿼리로 국가 코드 전달 (선택). 재고는 조직+국가+SKU 단위로 구분.
- 재고·연동·최적가격 등 B2C API는 위 스코프를 받아 조직/국가별로 처리합니다.
- 프론트에서 `ecommerceApi.getConnections(orgId)`, `connectChannel(body, orgId)`, `disconnectChannel(channel, orgId)`처럼 두 번째 인자로 `orgId`를 넘기면 해당 요청에 `X-Organization-Id`가 붙습니다.

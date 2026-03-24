-- B2C Pillar 3: 재고·연동 영속화 (Supabase)
-- 정본: supabase/migrations/20260225100000_b2c_pillar3.sql (CLI db push)
-- 이 파일은 SQL Editor 수동 실행용 복사본입니다.

-- 1) 이커머스 채널 연동 (조직별)
CREATE TABLE IF NOT EXISTS b2c_channel_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL DEFAULT 'default',
  channel text NOT NULL,
  store_url text,
  store_name text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_b2c_connections_org ON b2c_channel_connections(organization_id);

-- 2) 중앙 재고 (조직별, SKU별)
CREATE TABLE IF NOT EXISTS b2c_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL DEFAULT 'default',
  country_code text,
  sku text NOT NULL,
  central_quantity integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, country_code, sku)
);

CREATE INDEX IF NOT EXISTS idx_b2c_inventory_org_country ON b2c_inventory(organization_id, country_code);

-- Optional: 경쟁사 가격 (가격 시뮬레이션 실데이터용)
CREATE TABLE IF NOT EXISTS b2c_competitor_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL DEFAULT 'default',
  channel text NOT NULL,
  sku_or_product text,
  price numeric NOT NULL,
  fetched_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_b2c_competitor_org ON b2c_competitor_prices(organization_id, channel);

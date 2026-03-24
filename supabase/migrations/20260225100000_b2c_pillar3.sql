-- B2C Pillar 3: 재고·연동 영속화 (docs/supabase-b2c-migrations.sql 와 동일)
-- 정본은 이 migrations 폴더; docs 파일은 참고용으로 유지

CREATE TABLE IF NOT EXISTS public.b2c_channel_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL DEFAULT 'default',
  channel text NOT NULL,
  store_url text,
  store_name text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_b2c_connections_org ON public.b2c_channel_connections(organization_id);

CREATE TABLE IF NOT EXISTS public.b2c_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL DEFAULT 'default',
  country_code text,
  sku text NOT NULL,
  central_quantity integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, country_code, sku)
);

CREATE INDEX IF NOT EXISTS idx_b2c_inventory_org_country ON public.b2c_inventory(organization_id, country_code);

CREATE TABLE IF NOT EXISTS public.b2c_competitor_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL DEFAULT 'default',
  channel text NOT NULL,
  sku_or_product text,
  price numeric NOT NULL,
  fetched_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_b2c_competitor_org ON public.b2c_competitor_prices(organization_id, channel);

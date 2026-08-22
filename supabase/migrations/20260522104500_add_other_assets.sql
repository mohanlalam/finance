-- Migration: Add support for Fixed Deposits, Gold, Real Estate, Insurances, and Document registry

CREATE TABLE IF NOT EXISTS fixed_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  principal_amount numeric NOT NULL DEFAULT 0,
  interest_rate numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  maturity_date date NOT NULL,
  maturity_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE fixed_deposits ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS gold_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  purity text NOT NULL DEFAULT '22K',
  weight_grams numeric NOT NULL DEFAULT 0,
  purchase_price numeric NOT NULL DEFAULT 0,
  current_valuation numeric NOT NULL DEFAULT 0,
  purchase_date date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE gold_holdings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS real_estate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  property_name text NOT NULL,
  property_type text NOT NULL DEFAULT 'apartment',
  location text,
  purchase_price numeric NOT NULL DEFAULT 0,
  current_valuation numeric NOT NULL DEFAULT 0,
  purchase_date date,
  monthly_rent numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE real_estate ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS insurances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  insurance_type text NOT NULL DEFAULT 'health',
  provider text NOT NULL,
  policy_name text NOT NULL,
  policy_number text,
  sum_assured numeric NOT NULL DEFAULT 0,
  premium_amount numeric NOT NULL DEFAULT 0,
  renewal_date date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE insurances ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  asset_type text NOT NULL DEFAULT 'general',
  asset_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Setup Storage for Documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('investment-documents', 'investment-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist, to avoid conflicts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Documents' AND tablename = 'objects') THEN
    DROP POLICY "Public Read Documents" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Insert Documents' AND tablename = 'objects') THEN
    DROP POLICY "Public Insert Documents" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Update Documents' AND tablename = 'objects') THEN
    DROP POLICY "Public Update Documents" ON storage.objects;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Delete Documents' AND tablename = 'objects') THEN
    DROP POLICY "Public Delete Documents" ON storage.objects;
  END IF;
END $$;

CREATE POLICY "Public Read Documents" ON storage.objects FOR SELECT USING (bucket_id = 'investment-documents');
CREATE POLICY "Public Insert Documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'investment-documents');
CREATE POLICY "Public Update Documents" ON storage.objects FOR UPDATE USING (bucket_id = 'investment-documents') WITH CHECK (bucket_id = 'investment-documents');
CREATE POLICY "Public Delete Documents" ON storage.objects FOR DELETE USING (bucket_id = 'investment-documents');

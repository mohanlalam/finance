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

-- Seed sample data
DO $$
DECLARE
  personal_id uuid;
  mother_id uuid;
  wife_id uuid;
BEGIN
  SELECT id INTO personal_id FROM portfolios WHERE name = 'personal';
  SELECT id INTO mother_id FROM portfolios WHERE name = 'mother';
  SELECT id INTO wife_id FROM portfolios WHERE name = 'wife';

  -- Seed FDs
  INSERT INTO fixed_deposits (portfolio_id, bank_name, principal_amount, interest_rate, start_date, maturity_date, maturity_amount, status) VALUES
    (personal_id, 'HDFC Bank', 500000.00, 7.10, '2025-01-15', '2027-01-15', 574500.00, 'active'),
    (mother_id, 'State Bank of India', 1000000.00, 7.50, '2024-06-10', '2028-06-10', 1342000.00, 'active'),
    (wife_id, 'ICICI Bank', 300000.00, 7.20, '2025-03-01', '2026-03-01', 322200.00, 'active')
  ON CONFLICT DO NOTHING;

  -- Seed Gold
  INSERT INTO gold_holdings (portfolio_id, item_name, purity, weight_grams, purchase_price, current_valuation, purchase_date) VALUES
    (mother_id, '24K Gold Coins', '24K', 50.00, 300000.00, 350000.00, '2024-10-12'),
    (wife_id, '22K Bridal Gold Necklace', '22K', 80.00, 450000.00, 520000.00, '2023-11-20')
  ON CONFLICT DO NOTHING;

  -- Seed Real Estate
  INSERT INTO real_estate (portfolio_id, property_name, property_type, location, purchase_price, current_valuation, purchase_date, monthly_rent) VALUES
    (personal_id, '2BHK Apartment (Whitefield)', 'apartment', 'Whitefield, Bangalore', 6500000.00, 8000000.00, '2022-04-18', 32000.00),
    (wife_id, 'Residential Plot (Hometown)', 'plot', 'Mysore, Karnataka', 2000000.00, 2500000.00, '2021-09-05', 0.00)
  ON CONFLICT DO NOTHING;

  -- Seed Insurances
  INSERT INTO insurances (portfolio_id, insurance_type, provider, policy_name, policy_number, sum_assured, premium_amount, renewal_date) VALUES
    (personal_id, 'health', 'HDFC Ergo', 'Optima Secure Family', 'POL-10928374', 1000000.00, 24500.00, '2027-02-15'),
    (personal_id, 'term', 'LIC of India', 'Tech Term Plan', 'POL-99238472', 15000000.00, 18000.00, '2026-11-05'),
    (mother_id, 'health', 'Star Health', 'Senior Citizens Red Carpet', 'POL-44829384', 500000.00, 31000.00, '2026-08-20'),
    (wife_id, 'health', 'Care Health', 'Care Supreme', 'POL-77283492', 700000.00, 15200.00, '2026-12-10')
  ON CONFLICT DO NOTHING;
END $$;

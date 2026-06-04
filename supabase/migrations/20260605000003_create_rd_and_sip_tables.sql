-- Migration: Create rd_accounts and sip_accounts tables and migrate data from fixed_deposits

-- 1. Create rd_accounts Table
CREATE TABLE IF NOT EXISTS rd_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  monthly_deposit numeric NOT NULL DEFAULT 0,
  interest_rate numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  maturity_date date NOT NULL,
  maturity_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  contributions jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rd_accounts ENABLE ROW LEVEL SECURITY;

-- 2. Create sip_accounts Table
CREATE TABLE IF NOT EXISTS sip_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  fund_name text NOT NULL,
  monthly_sip numeric NOT NULL DEFAULT 0,
  expected_cagr numeric NOT NULL DEFAULT 0,
  units numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  next_sip_date date,
  fallback_valuation numeric NOT NULL DEFAULT 0,
  mf_scheme_code text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sip_accounts ENABLE ROW LEVEL SECURITY;

-- 3. Migrate RDs from fixed_deposits
INSERT INTO rd_accounts (
  id,
  portfolio_id,
  bank_name,
  monthly_deposit,
  interest_rate,
  start_date,
  maturity_date,
  maturity_amount,
  status,
  contributions,
  notes,
  created_at
)
SELECT 
  id,
  portfolio_id,
  bank_name,
  principal_amount AS monthly_deposit,
  interest_rate,
  start_date,
  COALESCE(maturity_date, start_date), -- fallback if null
  maturity_amount,
  status,
  COALESCE(contributions, '[]'::jsonb),
  notes,
  created_at
FROM fixed_deposits
WHERE fd_type = 'recurring' OR fd_type = 'rd';

-- 4. Migrate SIPs from fixed_deposits
INSERT INTO sip_accounts (
  id,
  portfolio_id,
  fund_name,
  monthly_sip,
  expected_cagr,
  units,
  start_date,
  next_sip_date,
  fallback_valuation,
  mf_scheme_code,
  notes,
  created_at
)
SELECT 
  id,
  portfolio_id,
  bank_name AS fund_name,
  principal_amount AS monthly_sip,
  interest_rate AS expected_cagr,
  COALESCE(units, 0) AS units,
  start_date,
  maturity_date AS next_sip_date,
  maturity_amount AS fallback_valuation,
  mf_scheme_code,
  notes,
  created_at
FROM fixed_deposits
WHERE fd_type = 'sip';

-- 5. Delete migrated rows from fixed_deposits
DELETE FROM fixed_deposits WHERE fd_type IN ('recurring', 'rd', 'sip');

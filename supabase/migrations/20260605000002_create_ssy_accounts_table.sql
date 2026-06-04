-- Migration: Create ssy_accounts table and migrate SSY data from fixed_deposits
CREATE TABLE IF NOT EXISTS ssy_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  girl_dob date NOT NULL,
  annual_deposit numeric NOT NULL DEFAULT 0,
  interest_rate numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  maturity_date date NOT NULL,
  maturity_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  contributions jsonb NOT NULL DEFAULT '[]'::jsonb,
  rate_schedule jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ssy_accounts ENABLE ROW LEVEL SECURITY;

-- Migrate data from fixed_deposits (where fd_type = 'ssy') to ssy_accounts
-- principal_amount in fixed_deposits maps to annual_deposit in ssy_accounts
-- if girl_dob in fixed_deposits is null, we attempt to extract it from notes (format [DOB:YYYY-MM-DD]),
-- fallback to start_date or '2018-01-01' if both are missing/null.
INSERT INTO ssy_accounts (
  id,
  portfolio_id,
  bank_name,
  girl_dob,
  annual_deposit,
  interest_rate,
  start_date,
  maturity_date,
  maturity_amount,
  status,
  contributions,
  rate_schedule,
  notes,
  created_at
)
SELECT 
  id,
  portfolio_id,
  bank_name,
  COALESCE(
    girl_dob, 
    (SUBSTRING(notes FROM '\[DOB:([0-9]{4}-[0-9]{2}-[0-9]{2})\]'))::date,
    start_date,
    '2018-01-01'::date
  ) as girl_dob,
  principal_amount as annual_deposit,
  interest_rate,
  start_date,
  maturity_date,
  maturity_amount,
  status,
  COALESCE(contributions, '[]'::jsonb),
  COALESCE(rate_schedule, '[]'::jsonb),
  notes,
  created_at
FROM fixed_deposits
WHERE fd_type = 'ssy';

-- Delete the migrated rows from fixed_deposits
DELETE FROM fixed_deposits WHERE fd_type = 'ssy';

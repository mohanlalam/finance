/*
  Locally recreated migration.
*/

CREATE TABLE IF NOT EXISTS portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  label text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  sno integer DEFAULT 0,
  stock_name text NOT NULL,
  ticker text NOT NULL,
  yahoo_symbol text NOT NULL,
  qty numeric NOT NULL DEFAULT 0,
  avg_price numeric NOT NULL DEFAULT 0,
  amount_invested numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT holdings_portfolio_ticker_unique UNIQUE (portfolio_id, ticker)
);

ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;

-- Seed default portfolios
INSERT INTO portfolios (name, label) VALUES
  ('personal', 'My Portfolio'),
  ('mother', 'Mother''s Portfolio'),
  ('wife', 'Wife''s Portfolio')
ON CONFLICT (name) DO NOTHING;

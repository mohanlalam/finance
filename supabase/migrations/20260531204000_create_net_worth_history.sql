-- Migration: Create net_worth_history table for historical tracking
CREATE TABLE IF NOT EXISTS net_worth_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  total_value numeric NOT NULL DEFAULT 0,
  stocks_value numeric NOT NULL DEFAULT 0,
  fd_value numeric NOT NULL DEFAULT 0,
  gold_value numeric NOT NULL DEFAULT 0,
  real_estate_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(snapshot_date)
);

ALTER TABLE net_worth_history ENABLE ROW LEVEL SECURITY;

-- Allow read access to anyone authenticated
CREATE POLICY "Public Read Net Worth History" ON net_worth_history FOR SELECT USING (true);


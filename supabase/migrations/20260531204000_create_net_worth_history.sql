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

-- Seed sample history for the past 6 months (pre-2026-05-31)
INSERT INTO net_worth_history (snapshot_date, total_value, stocks_value, fd_value, gold_value, real_estate_value) VALUES
  ('2025-12-31', 9800000.00, 1500000.00, 1600000.00, 700000.00, 6000000.00),
  ('2026-01-31', 10100000.00, 1650000.00, 1620000.00, 730000.00, 6100000.00),
  ('2026-02-28', 10450000.00, 1800000.00, 1640000.00, 760000.00, 6250000.00),
  ('2026-03-31', 10900000.00, 2050000.00, 1660000.00, 790000.00, 6400000.00),
  ('2026-04-30', 11350000.00, 2200000.00, 1780000.00, 820000.00, 6550000.00),
  ('2026-05-31', 11800000.00, 2500000.00, 1800000.00, 870000.00, 6630000.00)
ON CONFLICT (snapshot_date) DO NOTHING;

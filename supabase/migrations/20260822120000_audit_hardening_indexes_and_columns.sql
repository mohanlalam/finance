-- Migration: Audit Hardening - Foreign Key Indexes, Missing Net Worth Columns, and RLS Tightening

-- 1. Foreign Key & Query Performance Indexes
CREATE INDEX IF NOT EXISTS idx_fixed_deposits_portfolio_id ON fixed_deposits(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_gold_holdings_portfolio_id ON gold_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_real_estate_portfolio_id ON real_estate(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_insurances_portfolio_id ON insurances(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_rd_accounts_portfolio_id ON rd_accounts(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_sip_accounts_portfolio_id ON sip_accounts(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_documents_portfolio_id ON documents(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_market_price_cache_updated_at ON market_price_cache(updated_at);

-- 2. Add Missing Asset Class Columns to net_worth_history
ALTER TABLE net_worth_history
  ADD COLUMN IF NOT EXISTS rd_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sip_value numeric NOT NULL DEFAULT 0;

-- 3. Restrict Direct Public Read on net_worth_history (Access via Edge Functions only)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'net_worth_history' AND policyname = 'Public Read Net Worth History'
  ) THEN
    DROP POLICY "Public Read Net Worth History" ON net_worth_history;
  END IF;
END $$;

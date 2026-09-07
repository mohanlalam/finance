-- Migration: Add explicit service_role RLS policies to all tables for documentation and defense-in-depth

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'portfolios',
    'holdings',
    'fixed_deposits',
    'gold_holdings',
    'real_estate',
    'insurances',
    'documents',
    'rd_accounts',
    'sip_accounts',
    'market_price_cache',
    'net_worth_history'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Ensure RLS is enabled
    EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY;', tbl);

    -- Create explicit service_role policy if not exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = tbl AND policyname = 'service_role_full_access'
    ) THEN
      EXECUTE format(
        'CREATE POLICY "service_role_full_access" ON %I TO service_role USING (true) WITH CHECK (true);',
        tbl
      );
    END IF;
  END LOOP;
END $$;

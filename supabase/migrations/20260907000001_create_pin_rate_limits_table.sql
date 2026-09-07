-- Migration: Create pin_rate_limits table for persistent cross-instance edge function rate limiting
CREATE TABLE IF NOT EXISTS pin_rate_limits (
  rate_key text PRIMARY KEY,
  attempt_count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pin_rate_limits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pin_rate_limits' AND policyname = 'service_role_pin_rate_limits'
  ) THEN
    CREATE POLICY "service_role_pin_rate_limits" ON pin_rate_limits
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

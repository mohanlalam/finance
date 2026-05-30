-- Create market price cache table to throttle Yahoo Finance API requests
CREATE TABLE IF NOT EXISTS market_price_cache (
  yahoo_symbol text PRIMARY KEY,
  ltp numeric NOT NULL,
  today_pct numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS to prevent direct client access (only accessed via Edge Function service role)
ALTER TABLE market_price_cache ENABLE ROW LEVEL SECURITY;

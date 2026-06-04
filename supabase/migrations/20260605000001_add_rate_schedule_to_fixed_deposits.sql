-- Add rate_schedule JSONB column to store per-FY rate overrides for SSY accounts
-- Format: [{"fyStartYear": 2026, "rate": 8.5}, ...]
ALTER TABLE fixed_deposits
  ADD COLUMN IF NOT EXISTS rate_schedule JSONB DEFAULT NULL;

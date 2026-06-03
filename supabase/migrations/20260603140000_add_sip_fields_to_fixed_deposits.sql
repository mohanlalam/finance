-- Migration: Add mf_scheme_code and units to fixed_deposits to support automated SIP tracking
ALTER TABLE fixed_deposits ADD COLUMN IF NOT EXISTS mf_scheme_code text DEFAULT NULL;
ALTER TABLE fixed_deposits ADD COLUMN IF NOT EXISTS units numeric DEFAULT NULL;

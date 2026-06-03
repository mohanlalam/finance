-- Migration: Add notes column to all asset tables for free-text remarks
ALTER TABLE fixed_deposits ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;
ALTER TABLE gold_holdings ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;
ALTER TABLE real_estate ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;
ALTER TABLE insurance ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;

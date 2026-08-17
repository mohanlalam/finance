-- Migration: Remove unused week_low_52 and week_high_52 columns from holdings table

ALTER TABLE IF EXISTS holdings 
  DROP COLUMN IF EXISTS week_low_52,
  DROP COLUMN IF EXISTS week_high_52;

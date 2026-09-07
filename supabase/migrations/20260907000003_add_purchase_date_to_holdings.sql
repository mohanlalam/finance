-- Migration: Add purchase_date to holdings table for accurate tax harvesting calculations
ALTER TABLE holdings
  ADD COLUMN IF NOT EXISTS purchase_date date;

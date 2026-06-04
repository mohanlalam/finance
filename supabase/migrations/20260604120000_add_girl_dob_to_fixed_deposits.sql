-- Migration: Add girl_dob column to fixed_deposits for SSY tracking
ALTER TABLE fixed_deposits ADD COLUMN IF NOT EXISTS girl_dob date DEFAULT NULL;

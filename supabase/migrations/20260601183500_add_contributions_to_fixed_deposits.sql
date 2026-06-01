-- Migration: Add contributions JSONB column to fixed_deposits table
ALTER TABLE fixed_deposits ADD COLUMN IF NOT EXISTS contributions jsonb DEFAULT '[]'::jsonb;

-- Migration: Add fd_type column to fixed_deposits to support Sukanya Samriddhi Yojana (SSY)
ALTER TABLE fixed_deposits ADD COLUMN IF NOT EXISTS fd_type text NOT NULL DEFAULT 'regular';

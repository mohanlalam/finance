-- Migration: Add expiry_date column to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS expiry_date date;

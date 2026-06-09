-- Drop ssy_accounts table and ssy-specific columns from fixed_deposits
DROP TABLE IF EXISTS ssy_accounts CASCADE;
ALTER TABLE fixed_deposits DROP COLUMN IF EXISTS girl_dob CASCADE;
ALTER TABLE fixed_deposits DROP COLUMN IF EXISTS rate_schedule CASCADE;

-- Make maturity_date nullable in fixed_deposits table
ALTER TABLE fixed_deposits ALTER COLUMN maturity_date DROP NOT NULL;

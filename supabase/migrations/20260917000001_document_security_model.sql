-- Migration: Document Zero-Trust Single-Family PIN Security Model & RLS Defense-in-Depth
-- Date: 2026-09-17
-- Description:
--   The Family Portfolio Tracker employs a Zero-Trust single-family security architecture:
--   1. Database tables have Row Level Security (RLS) enabled.
--   2. Direct access via public/anon role is completely blocked; all reads and writes
--      must traverse authenticated Supabase Edge Functions (verify-pin, holdings-crud, snapshot-net-worth, market-data).
--   3. Edge Functions authenticate requests using a secure, brute-force rate-limited PIN challenge
--      and sign short-lived HMAC-SHA256 session tokens.
--   4. The 'investment-documents' storage bucket is strictly private (public = false) and only accessible
--      via short-lived signed URLs generated on the server after PIN authentication.
--   5. Document payloads are additionally encrypted client-side (AES-GCM-256) before upload.

COMMENT ON TABLE pin_rate_limits IS 'Persistent brute-force attack mitigation store tracking client IP and composite device attempts.';
COMMENT ON TABLE portfolios IS 'Family member portfolio profiles. Access restricted to Edge Functions via service_role.';
COMMENT ON TABLE holdings IS 'Equity and ETF holdings. Access restricted to Edge Functions via service_role.';
COMMENT ON TABLE fixed_deposits IS 'Fixed deposit contracts with quarterly compounding. Access restricted to Edge Functions via service_role.';
COMMENT ON TABLE gold_holdings IS 'Physical and digital gold bullion holdings. Access restricted to Edge Functions via service_role.';
COMMENT ON TABLE real_estate IS 'Real estate assets and rental yield logs. Access restricted to Edge Functions via service_role.';
COMMENT ON TABLE insurances IS 'Life and health insurance policies. Access restricted to Edge Functions via service_role.';
COMMENT ON TABLE documents IS 'Metadata for Zero-Trust encrypted document vault items.';
COMMENT ON TABLE rd_accounts IS 'Recurring deposit contracts. Access restricted to Edge Functions via service_role.';
COMMENT ON TABLE sip_accounts IS 'Mutual fund systematic investment plans. Access restricted to Edge Functions via service_role.';
COMMENT ON TABLE net_worth_history IS 'Daily historical net worth snapshots across asset categories.';

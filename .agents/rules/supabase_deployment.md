# Supabase Backend Deployment Protocol

Whenever changes are made to Supabase Edge Functions (`supabase/functions/`) or database migrations (`supabase/migrations/`), follow this exact deployment procedure:

## 1. Edge Function Deployment
The local environment is already authenticated and linked to the **Family** project (`fkiqpjvzydmqdsuufdpc`).
Always use `npx supabase@latest` (plain `supabase` without `@latest` can throw a binary resolution error on win32-x64) with `--no-verify-jwt`:

```powershell
# Deploy individual functions (bundled automatically with _shared/auth.ts)
npx supabase@latest functions deploy verify-pin --no-verify-jwt
npx supabase@latest functions deploy holdings-crud --no-verify-jwt
npx supabase@latest functions deploy snapshot-net-worth --no-verify-jwt
npx supabase@latest functions deploy gemini-proxy --no-verify-jwt
npx supabase@latest functions deploy market-data --no-verify-jwt
```

## 2. Database Migration Sync
Whenever new migration files are added to `supabase/migrations/`:
```powershell
npx supabase@latest db push
```

## 3. Deployment Checklist:
- Edge Functions import shared security logic from `../_shared/auth.ts`.
- Deployment requires `--no-verify-jwt` since authentication is enforced via server-side PIN verification and signed HMAC session tokens.
- Deploying directly via CLI ensures live Edge Functions are updated immediately without relying on external CI tokens.

# 🧠 Architectural Memory & Engineering Lessons — Family Portfolio Tracker

**Document Version**: 3.0  
**Purpose**: Persistent engineering memory, incident post-mortems, and architectural decision records (ADRs).  
**Protocol**: After any bug fix, user correction, or major architectural decision, append an entry to prevent regression.  

---

## 1. Architectural Decision Records (ADRs)

### ADR-001: Separation of Liquid Net Worth vs. Illiquid Real Estate
- **Context**: Real estate represents large, illiquid capital valuations that can distort day-to-day liquid wealth management and monthly cash flow metrics.
- **Decision**: Real estate acquisition cost and current market valuation are calculated and reported standalone. Liquid Net Worth strictly tracks liquid and term assets (Stocks, Mutual Funds, Fixed Deposits, Recurring Deposits, and Gold Bullion).
- **Consequence**: Users maintain crystal-clear visibility into both immediate liquidity and overall family balance sheet health.

### ADR-002: 3-Context Split to Eliminate Render Thrashing
- **Context**: Rapid market price ticks from Yahoo Finance and AMFI caused form modals and unrelated registry cards to re-render constantly.
- **Decision**: Split `PortfolioContext` into `PortfolioEntitiesContext` (data payloads), `PortfolioStatusContext` (liveness flags and mutation locks), and `PortfolioActionContext` (dispatch callbacks).
- **Consequence**: Write-only modals consume `usePortfolioActions()` and never re-render during market quote updates.

### ADR-003: Zero-Trust Client-Side Document Encryption
- **Context**: Family insurance policies, title deeds, and tax statements contain sensitive PII that should never be stored in plain text on cloud databases.
- **Decision**: Documents are encrypted in the browser using native Web Crypto (`AES-GCM-256` + `PBKDF2` with 100,000 SHA-256 rounds) before upload. Decryption occurs purely in-memory on demand.
- **Consequence**: Zero cloud database exposure; zero third-party KMS API key costs.

### ADR-004: Server-Side Constant-Time Fail-Closed PIN Challenge
- **Context**: Relying solely on client-side PIN gates leaves Supabase database endpoints vulnerable to direct API requests.
- **Decision**: All Supabase Edge Functions validate the `X-App-Pin` header against server-side `APP_PIN_HASH` using `crypto.subtle` with constant-time comparison (`timingSafeEqual`). If unconfigured, the function fails closed (HTTP 503).
- **Consequence**: Complete backend immunity against API scraping, timing side-channel attacks, and misconfigurations.

### ADR-005: Liquid Glass Suspended Navigation with Concentric Inner Lens
- **Context**: Grounded bottom bars consumed excessive vertical screen height and clashed with modern bezel-less mobile displays.
- **Decision**: Built a suspended floating island dock (`58px` height, `29px` radius, `4px` inset) with an internal `25px` frosted glass capsule matching outer curvatures.
- **Consequence**: Native iOS feel, 65% vertical screen savings, and zero layout thrashing via per-container `WeakMap` scroll tracking.

### ADR-006: Strict Mobile Rhythm & Two-Metric Cap
- **Context**: Mobile views suffered from nested desktop cards, tiny table controls, and dense secondary metric bloat.
- **Decision**: Enforce a strict mobile contract: single plain-language hero question, hard cap of at most 2 secondary metrics via `.slice(0, 2)`, 56px interactive touch rows with trailing chevrons, and tokenized `AppBadge` variants.
- **Consequence**: Clean visual hierarchy, zero text clipping on compact 375×667 viewports (iPhone SE), and zero dock overlap.

---

## 2. Engineering Lessons Learned & Incident Post-Mortems

### 2.1 Supabase Storage: "Unauthorized" on Client-Side File Uploads
- **Mistake**: Direct uploads to Supabase Storage from browser code using the `anon` key failed with `"Unauthorized"`.
- **Root Cause**: Supabase Storage enforces storage RLS independently of the database. The `anon` key has no write access on custom private buckets.
- **Fix**: Routed all file upload and delete operations through the server-side `holdings-crud` Edge Function, which executes with the `SERVICE_ROLE_KEY` and validates the `X-App-Pin` header.
- **Rule**: **Never upload files to Supabase Storage directly from browser client code using the anon key.** Always route file operations through a server-side Edge Function.

### 2.2 Missing React Hook Imports (`useMemo`, `useCallback`)
- **Mistake**: `ReferenceError: useMemo is not defined` occurred at runtime.
- **Root Cause**: Vite with Rolldown does NOT expose React hooks on the global scope; hooks must be explicitly named-imported.
- **Fix**: Added explicit named imports `import { ..., useMemo } from 'react'`.
- **Rule**: **Always explicitly import every React hook used.** Run a full project grep for bare hook calls after any file edit.

### 2.3 Temporal Dead Zone (TDZ) ReferenceError in Component Body
- **Mistake**: `ReferenceError: Cannot access 'visiblePortfolio' before initialization` at runtime.
- **Root Cause**: A `useMemo` hook referenced a variable declared with `const` later in the same component body.
- **Fix**: Moved variable declarations above any hooks that consume them.
- **Rule**: In React component bodies, **always place `useMemo`/`useCallback`/`useEffect` after all variables they reference are declared**.

### 2.4 Pre-Deletion Verification Sweep
- **Mistake**: Deleting multiple files and editing dependent components resulted in cascading compilation errors.
- **Root Cause**: Rushed deletion cascade without checking dependent imports.
- **Fix**: Ran `tsc --noEmit` and `npm run build` between deletions to catch dangling references.
- **Rule**: After deleting any file or function: (1) grep for remaining references, (2) run `tsc --noEmit`, (3) run `npm run build`.

### 2.5 SVG Chart Bottom Text Clipping
- **Mistake**: Chart labels below SVG bars were cut off or invisible.
- **Root Cause**: The SVG `viewBox` height was too tight, failing to account for label heights and bottom padding.
- **Fix**: Calibrated `viewBox` height = drawing height + label heights + padding.
- **Rule**: When creating SVG charts with text labels, **always set `viewBox` height to account for total drawing height plus bottom margins**. Test in both light and dark modes.

### 2.6 Supabase Token Format & Authorization Header
- **Mistake**: Localhost failed with "Unable to connect" while cloud deployment worked.
- **Root Cause**: Code checked if token started with legacy JWT `eyJ`, ignoring newer Supabase publishable tokens (`sb_publishable_...`).
- **Fix**: Unconditionally attach `Authorization: Bearer ${SUPABASE_ANON_KEY}` whenever the key is present regardless of prefix.
- **Rule**: **Never assume a specific token prefix format.** Always pass `Authorization: Bearer` headers uniformly.

### 2.7 Client Browser Storage in Node/Vitest Test Runners
- **Mistake**: Unit tests failed with `ReferenceError: indexedDB is not defined` or `localStorage is not defined`.
- **Root Cause**: Utilities calling browser storage primitives ran in Node.js test environments without browser globals.
- **Fix**: Wrapped all browser storage calls with `typeof indexedDB === 'undefined'` guards and memory fallbacks.
- **Rule**: **Always guard browser-only storage APIs with environment checks and memory fallbacks.**

### 2.8 Design Token Single Source of Truth
- **Mistake**: Token values differed between documentation files and CSS classes.
- **Root Cause**: Multiple markdown documents asserted token values independently.
- **Fix**: Declared `src/index.css` and `Design.md §2` as the authoritative single source of truth for all visual tokens.
- **Rule**: **Never declare arbitrary visual tokens in component code or separate docs without first declaring them in `src/index.css` and `Design.md`.**

### 2.9 iOS PWA Background Freeze & WebAuthn Credential Persistence
- **Mistake**: Standalone iOS PWAs failed to update, and valid FaceID enrollments were wiped on transient errors.
- **Root Cause**: iOS WebKit suspends JS execution when an app is minimized; calling `reload()` inside hidden listeners permanently stalled. Additionally, generic error handlers cleared biometric credentials.
- **Fix**: Restricted biometric auto-clear strictly to `NotAllowedError` with user gesture, and avoided scheduling reloads inside background listeners.
- **Rule**: **Never schedule critical UI reloads inside iOS background listeners. Guard credential resets strictly to user cancellation errors.**

### 2.10 Mandatory Clean-Slate Screenshot Purge
- **Mistake**: Retaining outdated screenshots caused audit confusion and stale file residue.
- **Root Cause**: Taking new screenshots without deleting old versions first.
- **Fix**: Enforced a clean-slate protocol: always purge the destination directory before capturing screenshots.
- **Rule**: **Whenever capturing screenshots, always delete the old files first before generating fresh 2x Retina captures.**

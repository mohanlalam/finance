# 🧠 tasks/lessons.md — Self-Improvement Log

After **any correction** from the user, append a new entry here with the pattern that caused the mistake and the rule to prevent recurrence.

**Review this file at the start of every new session.**

---

### 2026-08-14 — Supabase Storage: "Unauthorized" on Client-Side File Uploads
**Mistake**: Implemented direct client-side uploads to Supabase Storage using the `anon` API key, which failed with `"Unauthorized"` because Storage RLS policies blocked anonymous writes.  
**Root Cause**: Supabase Storage enforces Row Level Security independently of the database. The `anon` key has no write permissions on custom buckets by default — even if database RLS allows the user.  
**Fix**: Routed all `uploadDocumentFile` and `removeDocumentFiles` calls through the existing `holdings-crud` Edge Function, which runs with the `SERVICE_ROLE_KEY` and has full admin storage access. The Edge Function validates the request via the `X-App-Pin` header for security.  
**Rule**: **Never upload files to Supabase Storage directly from the browser client using the anon key.** Always route file operations through a server-side Edge Function using the service_role key. If direct uploads are needed, first configure explicit Storage RLS policies for the bucket.

---

## Lesson Format

```
### [Date] — [Short title]
**Mistake**: What went wrong.
**Root Cause**: Why it happened.
**Fix**: What was done to resolve it.
**Rule**: Never do X again; always do Y instead.
```

---

## Lessons Learned

---

### 2026-08-14 — Missing React hook imports (`useMemo`, `useCallback`)
**Mistake**: `ReferenceError: useMemo is not defined` at runtime.  
**Root Cause**: Vite with `oxc`/`rolldown` bundler does NOT provide React hooks on the global scope — they must be explicitly named-imported. The hook was used inside a component but the import line was missing.  
**Fix**: Added `useMemo` to `import { ..., useMemo } from 'react'` in `usePortfolioData.ts`. Similarly fixed missing `useCallback` in `MobileHomeSummary.tsx`.  
**Rule**: Always explicitly import every React hook used (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`, etc.). Run a full project grep for bare hook calls after any file edit.

---

### 2026-08-14 — Temporal Dead Zone (TDZ) ReferenceError in component body
**Mistake**: `ReferenceError: Cannot access 'visiblePortfolio' before initialization` at runtime.  
**Root Cause**: A `useMemo` hook referenced `visiblePortfolio`, which was declared with `const` *later* in the same component function body. JavaScript's Temporal Dead Zone means the variable cannot be accessed before its `const` declaration is reached at runtime.  
**Fix**: Changed the `useMemo` to reference `activePortfolio` (declared earlier in the component) instead of `visiblePortfolio`.  
**Rule**: In React component bodies, always place `useMemo` / `useEffect` / `useCallback` hooks *after* all variables they reference are declared, OR reference only variables declared before the hook in the component scope.

---

### 2026-08-14 — Deleting features without verifying build first
**Mistake**: Deleting multiple files (workers, utils, components) and editing dependent files without running `tsc --noEmit` between deletions.  
**Root Cause**: Rushed deletion cascade — assumed all references were cleaned up manually.  
**Fix**: After the deletion sweep, ran `npx tsc --noEmit` and `npm run build` to catch all remaining dangling imports and type errors before committing.  
**Rule**: After any deletion of files or functions: (1) grep for remaining imports/references, (2) run `npx tsc --noEmit`, (3) run `npm run build`. Only commit after all three pass clean.

---

### 2026-08-14 — BarChart SVG bottom text clipping
**Mistake**: Member names and percentage pills below the bar chart were clipped/invisible.  
**Root Cause**: The SVG `viewBox` height was too tight — not enough room for the text labels below the bars plus padding.  
**Fix**: Scaled internal SVG height from `180px` to `135px` with a calibrated `viewBox` height of `193px`, adding ample bottom margin and vertical padding.  
**Rule**: When SVG charts have labels below the drawing area, always verify `viewBox` height = draw height + all bottom label heights + bottom padding. Test in both light/dark mode at multiple screen widths.

---

### 2026-08-14 — Supabase Anon Key format and Authorization headers
**Mistake**: Localhost showed "Unable to connect right now" while cloud deployment worked.  
**Root Cause**: `apiClient.ts` only attached the `Authorization: Bearer <KEY>` header if the key started with `eyJ` (legacy JWT). Supabase now uses publishable tokens (`sb_publishable_...`), which caused the `Authorization` header to be omitted, resulting in 401 Unauthorized / network errors on Edge Functions. Additionally, `ensureHashedPin()` returned an empty string if session verification hadn't flagged, dropping the `X-App-Pin` header.  
**Fix**: (1) Always attach `Authorization: Bearer ${SUPABASE_ANON_KEY}` whenever `SUPABASE_ANON_KEY` is present regardless of token prefix. (2) Allowed `ensureHashedPin()` to fallback to `hashPin(APP_PIN)` so all Edge Function calls always carry valid PIN authentication.  
**Rule**: Never assume a specific token prefix format (like `eyJ`) for API keys. Always send `Authorization: Bearer` and guarantee hash fallbacks for all protected Edge Function calls.

---

### 2026-08-14 — Client Browser Storage in Node/Vitest Tests
**Mistake**: Unit tests failed with `ReferenceError: indexedDB is not defined` or `ReferenceError: localStorage is not defined`.  
**Root Cause**: Utilities calling browser storage APIs (`idb-keyval`, `localStorage`, `Notification`) run in Node.js test runner environments where browser globals are absent without browser polyfills.  
**Fix**: Guard browser API access with `typeof indexedDB === 'undefined'` or `typeof localStorage === 'undefined'`, and provide seamless in-memory fallbacks.  
**Rule**: Always wrap browser-only storage primitives (`indexedDB`, `localStorage`, `Notification`) in safety guards with memory fallbacks so code runs deterministically in both browser and test environments.

---

### 2026-08-17 — Design Token Single Source of Truth & Concrete Accessibility Measurement Specs
**Mistake**: Token values differed between `UI.md` and `GEMINI.md` (e.g. slash-separated vs. single Kite-style hexes), and concrete WCAG contrast measurement rules & audit flags were omitted when standardizing the accessibility section. Stale `🆕` tag remained in documentation.  
**Root Cause**: Multiple documents asserted token definitions independently without designating one as the canonical source of truth, and qualitative accessibility guidelines inadvertently superseded quantitative/measurable contrast audit flags.  
**Fix**: Designated `UI.md` (and `src/index.css`) as the authoritative single source of truth for all tokens across documents. Added explicit WCAG 2.1 contrast ratios (4.5:1 text, 3.0:1 UI) and the two measurable audit flags (`--text-tertiary` on `--surface-secondary` in light mode; `--positive`/`--negative` on `-soft` backgrounds in dark mode). Removed stale `🆕` markers.  
**Rule**: Never duplicate token definitions across architectural documents without declaring one canonical source of truth (`UI.md`). Never drop measurable, quantitative acceptance criteria (such as contrast ratios) when cleaning up accessibility specifications.

---

### 2026-08-21 — iOS PWA Background Freeze & WebAuthn Credential Persistence
**Mistake**: Deferring `window.location.reload()` to `document.visibilityState === 'hidden'` completely prevented iOS PWAs from updating, and auto-clearing biometric enrollment on non-`NotAllowedError` exceptions wiped valid FaceID/TouchID enrollments on transient errors (such as background switches or missing user gestures).
**Root Cause**:
1. iOS WebKit immediately suspends/freezes JavaScript execution when a standalone PWA is minimized. Calling `window.location.reload()` inside a hidden/background listener is paused or discarded by WebKit, leaving `pendingReload = true` and permanently stalling updates.
2. WebAuthn throws `SecurityError`, `AbortError`, or `TimeoutError` when auto-prompted without transient user activation on iOS Safari. Treating any non-`NotAllowedError` exception as "credential deleted" caused the app to wipe the user's stored biometric keys on their very first launch.
**Fix**:
1. Handled Service Worker takeover cleanly on `controllerchange` with immediate reload guard, and added active update checks on `visibilitychange` (when app is opened/resumed to `visible`), `window.focus`, and `window.online`.
2. Removed destructive `disableBiometrics()` calls from transient error catch blocks in `biometrics.ts`. Biometric enrollment is now safely preserved across app restarts and device sleep.
3. Added cache-control meta tags (`no-cache, no-store, must-revalidate`) to `index.html`.
**Rule**: Never rely on `visibilitychange === 'hidden'` to execute critical operations like `reload()` on iOS PWAs because iOS suspends background execution. Never delete user biometric enrollment on transient WebAuthn errors (`AbortError`, `SecurityError`, timeout); only clear enrollment on explicit user disable or PIN reset.

---

### 2026-08-17 — Mobile Responsive Bottom Sheets, Dynamic Chart Heights & 24h Rate Caching
**Mistake**: Holding details opened as full-width side drawers on mobile; chart containers forced tall fixed heights (`370px`) causing excessive scrolling; commodity rate sync ran on every mount.  
**Root Cause**: Desktop-first layout defaults (`justify-end`, fixed heights) were applied without dedicated mobile-specific bottom-sheet flex containers and touch drag handles.  
**Fix**: (1) Converted `HoldingDetailDrawer` into an Apple-style bottom sheet (`items-end`, `rounded-t-2xl`, drag handle) on mobile and side drawer on desktop. (2) Set responsive chart heights (`min-h-[320px] sm:min-h-[370px]`) and dynamic skeleton placeholders in `AppShell`. (3) Gated daily commodity sync with a 24-hour timestamp check in `localStorage`.  
**Rule**: For detail drawers and complex forms, always branch layout into slide-up bottom sheets on mobile (`< 768px`) with top drag handles and safe-area padding. Always gate external daily market rate syncs behind 24-hour cache intervals.

---

### 2026-08-21 — Missing `@keyframes` for custom `animate-*` class
**Mistake**: `FamilyTabBar`'s mobile popover used `animate-scale-in` class, but no `@keyframes scaleIn` / `.animate-scale-in` rule existed in `index.css`. Element appeared instantly with no entrance animation — silently degraded.
**Root Cause**: Added an animation class to JSX without defining the corresponding keyframe in `index.css`. Tailwind only knows its own built-in animation utilities (`animate-pulse`, `animate-spin`, etc.); custom `animate-*` classes require explicit `@keyframes` + class definitions in CSS.
**Fix**: Added `@keyframes scaleIn` + `.animate-scale-in { transform-origin: top right; }` to `index.css`.
**Rule**: Whenever you add an `animate-*` class that is NOT a built-in Tailwind animation, immediately define the `@keyframes` + `.animate-*` rule in `index.css`. Tailwind will not warn about missing custom animation classes — verify with `npm run build`.

---

### 2026-08-22 — Full Project 4-Phase Comprehensive Audit Protocol
**Mistake**: Partial or superficial audit stopping after high-level files instead of covering 100% of the repository across all domains.
**Root Cause**: Conducting monolithic or shallow audits without a structured 4-phase decomposition covering all 70+ files in the repository.
**Fix**: Standardized complete codebase audits into a mandatory 4-phase protocol producing 4 distinct audit reports:
1. **Audit 1: Core Architecture, Auth & Security** (`App.tsx`, `main.tsx`, `auth.ts`, `biometrics.ts`, `apiClient.ts`, `usePortfolioData.ts`, `PortfolioContext.tsx`, all Edge Functions, build configs, ESLint & TypeScript verification).
2. **Audit 2: Financial Calculation Engine, Database & NLP** (`performance.ts`, `xirr.worker.ts`, `portfolioCalcs.ts`, `rdUtils.ts`, `mathUtils.ts`, `assistant.ts`, all 16 `supabase/migrations/*.sql` schema files).
3. **Audit 3: Ingestion, Backup, Security Modals & Contexts** (`ExportPanel.tsx`, `SmartImportModal.tsx`, `PinLockScreen.tsx`, `ChangePinModal.tsx`, `AddHoldingModal.tsx`, `aiDocumentExtractor.ts`, `usePortfolioInsights.ts`, `useAlerts.ts`, `useModalState.ts`, contexts).
4. **Audit 4: UI Views, Form Modals, Storage & Interactive Utilities** (`PortfolioTable.tsx`, `DocumentVaultView.tsx`, `TaxHarvestingView.tsx`, `EditStockModal.tsx`, all 6 domain Form Modals, `DocumentAttachmentField.tsx`, `supabaseStorage.ts`, `pdfReport.ts`, interactive touch/swipe hooks, `index.css`).
**Rule**: Whenever the user asks for a complete project audit, ALWAYS execute this 4-phase protocol and generate all 4 audit reports systematically to guarantee 100% file coverage with zero blind spots.

---

### 2026-08-22 — Fail-Closed Edge Function Security, Storage Whitelisting & Backup Field Parity
**Mistake**: Edge functions skipped PIN verification when `APP_PIN_HASH` environment variable was empty/missing; storage handlers trusted client-provided bucket names and unvalidated paths; JSON document export omitted `asset_id`; and alert cleanup purged dismissed alerts on empty initial mount.
**Root Cause**: Missing `else` branch on PIN checks; lack of server-side allowlists for storage operations; missing property in export serialization mapper; and executing state cleanup effects before remote data resolved into memory.
**Fix**: (1) Forced fail-closed 503/401 responses when `APP_PIN_HASH` is missing across all Edge Functions. (2) Strictly whitelisted `investment-documents` bucket and sanitized storage paths against `..` traversal in `holdings-crud`. (3) Added `asset_id: d.asset_id` to document JSON export and preserved custom stock metrics on restore. (4) Guarded alert cleanup to abort if active alerts haven't finished loading.
**Rule**: Always make server-side authentication fail-closed. Always enforce storage bucket allowlists and server-side path sanitization. Verify exact 1-to-1 field parity between export serialization and restore ingestion schemas. Never execute time-based cleanup operations on state references before initial data load completes.

---

### 2026-08-26 — Supabase Storage: Default Public Bucket Exposure & Predictable Paths
**Mistake**: The `investment-documents` bucket was `public = true` with open read policies (`Public Read Documents`), and documents were served via predictable paths (`${familyName}/${category}/${timestamp}_${fileName}`) over static public URLs (`/storage/v1/object/public/...`), allowing anyone to view/download private financial attachments without PIN or biometric authentication.
**Root Cause**: Supabase Storage buckets default to `public = true` if not explicitly configured as private during creation. Client formatting helpers constructed public CDN URLs directly instead of requesting short-lived signed URLs.
**Fix**: (1) Executed migration `20260826100000_make_documents_bucket_private.sql` setting `public = false` on `storage.buckets` and dropping all `Public *` policies on `storage.objects`. (2) Added `get_document_url` action to `holdings-crud` to generate 300s HMAC signed URLs (`createSignedUrl`) behind PIN authentication. (3) Replaced predictable timestamps with `crypto.randomUUID()` path randomization (`generateDocumentStoragePath`). (4) Replaced static `<a>` links across all UI views and modals with `openSecureDocument` (with synchronous tab opening to avoid popup blockers and 4-min client caching).
**Rule**: Never rely on default Supabase bucket visibility. Always explicitly declare `public = false` for sensitive storage buckets, drop public RLS policies on `storage.objects`, randomize object paths with UUIDs, and gate file access through server-authenticated signed URLs.

---

### 2026-08-26 — Client-Spoofable IP Rate Limiting via `X-Forwarded-For` Leftmost Header
**Mistake**: The anti-brute-force rate limiter on PIN verification used `req.headers.get("x-forwarded-for")?.split(",")[0]` as the client IP, which could be trivially bypassed by an attacker sending a new fake `X-Forwarded-For` header on each request.
**Root Cause**: Standard `X-Forwarded-For` syntax is `client, proxy1, proxy2`. The leftmost entry is whatever the original client sends and is fully client-controlled. Upstream reverse proxies (Cloudflare, Supabase Edge runtime) append the actual connection IP to the *right* of the list or provide trusted single-value headers (`cf-connecting-ip`, `x-real-ip`).
**Fix**: Replaced leftmost parsing with a spoof-resistant resolver prioritizing `cf-connecting-ip`, then `x-real-ip`, and falling back to the *rightmost* trimmed token of `x-forwarded-for` (`parts[parts.length - 1]`). Applied this resolver to both `verify-pin` and `holdings-crud` rate limiters.
**Rule**: Never trust the first (leftmost) entry of `X-Forwarded-For` for security-critical rate limiting or access control. Always check trusted proxy headers (`CF-Connecting-IP`, `X-Real-IP`) first, or parse the last (rightmost) entry appended by your platform's trusted ingress hop.

---

### 2026-08-26 — Chrome DevTools Protocol (CDP) Throttling Bypassed by Loopback (`localhost`)
**Mistake**: Performance audit TTFB metrics measured against `http://localhost:5173` under CDP Fast 3G / Slow 3G network throttling reported ~1-2ms responses and were mistaken for throttled network latency.
**Root Cause**: Chromium / Chrome DevTools Protocol network throttling applies emulation layers only to remote socket traffic. Localhost loopback addresses (`127.0.0.1`, `::1`, `localhost`) completely bypass CDP network delay emulation in Chromium, resulting in near-instant loopback timings that do not reflect real-world network latency.
**Fix**: Validated and reported performance numbers explicitly distinguishing local CPU execution / render timings from simulated remote network latency, and tested remote API fetch boundaries independently with actual round-trip delays.
**Rule**: Never assume CDP or DevTools network throttling slows down `localhost` traffic. For accurate cold-cache network measurements, test against remote staging deployments or route local traffic through an external proxy that intercepts loopback sockets.

---

### 2026-08-26 — JavaScript `Map` Insertion Order: True LRU vs. FIFO-with-a-Cap
**Mistake**: The in-memory calculation cache in `returns.ts` (`xirrResultCache`) was documented and assumed to be an LRU cache, but was actually a FIFO cache with a size cap.
**Root Cause**: JavaScript `Map` preserves insertion order. Evicting `map.keys().next().value` drops the oldest *inserted* item (FIFO). When a cache hit occurred on `map.get(key)`, the key was read but not repositioned in the iteration order, so frequently accessed items were evicted prematurely when the 50-item cap was reached.
**Fix**: Implemented `getFromXirrCache` and `setInXirrCache` helper functions that explicitly refresh key recency by deleting and re-setting the key (`map.delete(key); map.set(key, val)`) on every cache hit (`get`) and update (`set`), moving accessed items to the end of the Map.
**Rule**: In JavaScript `Map`-based caches, simply deleting the first key on overflow is FIFO, not LRU. To achieve true $O(1)$ LRU behavior, always `delete()` and re-`set()` the key on every cache access to push it to the end of the insertion order.

---

### 2026-08-29 — Fast Refresh Component Purity (`react-refresh/only-export-components`)
**Mistake**: Exporting static arrays/constants directly from React component files (`StandardFormFields.tsx`, `SIPFormFields.tsx`) triggered ESLint warnings: `"Fast refresh only works when a file only exports components"`.
**Root Cause**: React Fast Refresh requires `.tsx` files exporting UI components to export *only* React components so Vite can safely hot-reload them without full page teardown.
**Fix**: Extracted all shared constants and presets into a dedicated utility file `src/utils/indianFinancialPresets.ts`.
**Rule**: Never export non-component constants or arrays from `.tsx` component files. Always locate shared datasets and constants in `src/utils/` or domain-specific constant files.

---

### 2026-08-29 — Floating-Point Precision & Financial Mathematical Invariants
**Mistake**: JavaScript IEEE 754 float multiplication/subtraction on fractional share prices (e.g. `2450.75 * 15`) can produce minor micro-cent binary anomalies (`36761.25000000001`).
**Root Cause**: Standard JavaScript `Number` uses 64-bit binary floats which cannot represent all base-10 decimals exactly.
**Fix**: Added a pure, high-precision `roundToDecimals(val, decimals)` helper in `src/utils/mathUtils.ts` incorporating `Number.EPSILON` rounding, and validated all invariant relationships (Net Worth sum, P&L delta, Hallmark gold multipliers, FD compound curves, STCG/LTCG taxes) in `financialMathInvariants.test.ts`.
**Rule**: Always wrap derived currency differences and tax calculations in `roundToDecimals` before asserting mathematical equality in tests or presenting final amounts in reports.

---

### 2026-08-29 — Multi-Agent Parallel Audit Strategy for Comprehensive Reviews
**Mistake**: Auditing a full-stack project across security, clean architecture boundaries, dead code, financial math, and database policies sequentially in a single agent context.
**Root Cause**: Full-repository audits span multiple independent domains (Edge Functions & auth security, React state & component tree, math & financial invariants, and database migrations/RLS) that benefit significantly from parallel multi-agent analysis.
**Fix**: Recorded the multi-agent audit strategy in the self-improvement log to ensure parallel subagents are spawned for specialized audit facets in future comprehensive reviews.
**Rule**: For future comprehensive codebase audits, ALWAYS invoke multiple specialized subagents concurrently (e.g., Security Auditor, Architecture & Dead Code Inspector, Financial Math & Invariants Verifier) to maximize audit depth, parallelize search and analysis, and synthesize findings into the final report.

---

### 2026-08-29 — Standard Comprehensive Codebase Audit Protocol (Multi-Agent & 7-Section Architecture)
**Mistake**: Risk of inconsistent audit depth or omitting critical facets (such as dead code trees, circular dependencies, edge function fail-closed security, or floating-point invariants) on future "audit the project" prompts.
**Root Cause**: Need a fixed, standardized comprehensive audit protocol with multi-agent orchestration whenever the user requests a project audit.
**Fix**: Formalized the canonical 7-section audit template and multi-agent workflow:
1. **Verification Pipeline First**: Actual execution of `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and cross-checking documentation claims.
2. **Architecture Layer Violations**: Checking strict Clean Architecture boundaries (UI → Domain Hooks → Domain Services → Repositories → Infrastructure), circular dependency graphs, and repository interface bypasses.
3. **Security Audit**: Edge Function PIN fail-closed HTTP 503 verification, server-side reverse-proxy rate limiting, bundle secret inspection (`VITE_*`), private storage bucket policies & signed URL expiry, and RLS validation across all tables.
4. **Financial Calculation Correctness**: Mathematical invariants, single-pass aggregations, float rounding with `Number.EPSILON`, XIRR worker-to-sync parity, and Indian IT Act FY24-25 STCG/LTCG set-off logic.
---

### 2026-08-30 — Global Mobile Date Input Intrinsic Width Overflow in 2-Column Grids & Cancel Button Border Standardization
**Mistake**: Native date picker inputs (`input[type="date"]`) collided with adjacent fields in 2-column modal layouts on mobile browsers despite having `min-w-0` on inputs, and modal Cancel buttons lacked crisp high-contrast borders.  
**Root Cause**: Mobile browsers (WebKit/iOS Safari and Chromium mobile) assign native date/time inputs an intrinsic minimum content width (`min-content`) that resists shrink-wrapping in CSS grid columns. Without explicit `min-width: 0 !important`, `max-width: 100%`, and `appearance: none` in CSS alongside `overflow-hidden` on parent grid cells, the date picker expands outside its 50% grid column and causes overlap.  
**Fix**: 
1. Added a global CSS reset rule in `src/index.css`:
   ```css
   input[type="date"],
   input[type="datetime-local"],
   input[type="time"],
   input[type="month"],
   input[type="week"] {
     min-width: 0 !important;
     max-width: 100%;
     overflow: hidden;
     appearance: none;
   }
   ```
2. Added `min-w-0 overflow-hidden` to parent column wrapper `<div>`s across all modals (`StandardFormFields.tsx`, `RDFormModal.tsx`, `SIPFormFields.tsx`, `InsuranceFormModal.tsx`).
3. Standardized all form input heights to uniform `h-10` (40px) and added visible, high-contrast borders (`border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200`) across all modal Cancel buttons.  
**Rule**: Always apply global CSS constraints (`min-width: 0 !important; max-width: 100%; appearance: none;`) to all date/time input types and wrap them in `min-w-0 overflow-hidden` containers when used in CSS grid or multi-column layouts to completely prevent mobile browser intrinsic width expansion. Always ensure modal Cancel buttons have distinct high-contrast borders and matching uniform heights.

---

### 2026-08-31 — Mobile Sort Pill Left-Edge Clipping & Tab Transition Ghosting
**Mistake**: The first sort preset pill ("Current Value") was partially clipped ("t Value") on narrow mobile viewports, and during swipe navigation between asset tabs (Stocks / SIP & MF / Deposits), adjacent view content momentarily flashed or bled into view.  
**Root Cause**:
1. The sort preset container used `self-end` inside a `flex flex-col` header layout on mobile, causing the `overflow-x-auto` container to right-align and start its scroll position with the left edge of the active first pill clipped against the parent padding boundaries.
2. The mobile `<main id="main-content">` and asset tab content wrapper lacked `overflow-hidden`, allowing the previous tab's DOM tree to briefly bleed horizontally during React's commit/suspense transition phase before the new tab fully hydrated.  
**Fix**:
1. Removed `self-end` on mobile from the sort container in `PortfolioTable.tsx` (restored `md:self-auto` for desktop) and added `pl-0.5 pr-1` padding so the first pill always has left breathing room at x=0.
2. Added `overflow-hidden` to both the mobile `<main id="main-content">` container and the asset content wrapper `<div>` in `AppShell.tsx`.  
**Rule**: On mobile scrollable pill rows (`overflow-x-auto`), never apply cross-axis alignment (`self-end`/`items-end`) that can force child overflow off the left viewport edge. Always enforce `overflow-hidden` on top-level mobile tab transition containers to prevent momentary bleed or ghosting during navigation gestures.

---

### 2026-08-31 — Mobile Bottom Sheet Solid Opacity & Floating Action Button Z-Index Isolation
**Mistake**: The "More Asset Classes" mobile bottom sheet was translucent with background text/cards bleeding through, and the floating `+` action button (FAB) overlapped the drawer items.  
**Root Cause**:
1. The bottom sheet used `bg-[var(--surface)]` which is `rgba(..., 0.78)` (78% opacity). Without a 100% solid opaque background, underlying page content remained visible through the drawer body.
2. The bottom sheet and backdrop used `z-50`, the same z-index as `FloatingAddMenu`. Because the FAB was rendered downstream in `AppShell`, its button sat on top of the drawer sheet items.  
**Fix**:
1. Replaced `bg-[var(--surface)]` on the More Drawer with `bg-[var(--surface-solid)]` (`#ffffff` in light mode, `#0f172a` in dark mode) for 100% solid opacity.
2. Elevated backdrop to `z-[60]` with `backdrop-blur-sm` and the bottom sheet drawer to `z-[70]`.
3. Connected `onDrawerStateChange` in `MobileBottomNav` to hide the FAB via `isHidden={isAnyModalOpen || isMoreDrawerOpen}` and lock body scroll with `document.body.style.overflow = 'hidden'`.  
**Rule**: Always use `bg-[var(--surface-solid)]` on full-screen and bottom sheet modals to guarantee 100% opacity against underlying page text. Always place modal sheets and backdrops at higher z-index tiers (`z-[60]`/`z-[70]`) than persistent floating controls (`z-50`), and hide floating controls while any sheet is open.

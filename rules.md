# ⚖️ Engineering Rules & "Do Not Regress" Standards — Family Portfolio Tracker

**Document Version**: 3.0  
**Enforcement**: Strict CI/CD pipeline, pre-commit validation, and agent self-correction  
**Scope**: All source code, hooks, domain services, infrastructure, and test suites  

---

## 1. Clean Architecture Boundary Invariants

1. **Zero External Dependencies in Calculation Primitives**:
   - Pure financial math functions ([`mathUtils.ts`](src/utils/mathUtils.ts), [`fdCompounding.ts`](src/domains/assets/fd/calculations/fdCompounding.ts), [`sipValuation.ts`](src/domains/assets/sip/calculations/sipValuation.ts), [`goldValuation.ts`](src/domains/assets/gold/calculations/goldValuation.ts), [`xirr.ts`](src/domains/performance/calculations/xirr.ts)) must have **ZERO** dependencies on React, Supabase, IndexedDB, or DOM APIs.
2. **Domain Isolation**:
   - Business entities in `src/domains/` must never import UI components, React hooks, or infrastructure implementations.
   - Domain services communicate with infrastructure exclusively through abstract repository interfaces (`IPortfolioRepository`, `IDocumentStorageRepository`).
3. **Repository Responsibility**:
   - UI components must never call the Supabase JavaScript client directly. All data reads and mutations must route through domain hooks and domain services.

---

## 2. Mobile Design "Do Not Regress" Rules

1. **Plain-Language Hero Questions**:
   - Every asset registry screen must lead with its canonical plain-language question using `line-clamp-2 leading-tight`.
   - Never use single-line `truncate` on mobile hero questions.
2. **Strict 2-Metric Cap**:
   - Secondary metrics inside [`MobileAssetRegistry.tsx`](src/components/ui/MobileAssetRegistry.tsx) must **never exceed 2 items**. This rule is strictly enforced by `.slice(0, 2)`.
3. **AppBadge Strictness**:
   - Never write one-off badge CSS (`className="rounded-full bg-..."`). All status, profit/loss, urgency, and security pills must use [`AppBadge.tsx`](src/components/ui/AppBadge.tsx) variants (`positive`, `negative`, `warning`, `info`, `encrypted`, `urgency`).
4. **56px Interactive Row Rhythm**:
   - All holding list rows must maintain `min-h-[56px]`, `p-3.5`, rounded icons (`w-9 h-9`), tactile `ios-press` active feedback, and a subtle trailing `ChevronRight` indicator.
5. **Action Priority**:
   - Urgent operational events (insurance renewals within 30 days, overdue deposits, tax-loss harvest opportunities) must visually lead over generic edit/delete controls.
   - On the Tax Harvesting view, the Floating Add Menu (`+`) is hidden to eliminate visual competition with "Harvest" buttons.
6. **Bottom Dock & Safe-Area Clearance**:
   - Content containers must reserve `pb-28` (112px) list padding. The FAB must float at `bottom-[calc(5rem+env(safe-area-inset-bottom,0px))]`, clearing the 58px bottom dock with a 16px safety gap on all devices.

---

## 3. Code Standards & TypeScript Strictness

1. **Explicit React Hook Imports**:
   - Always explicitly import every React hook used (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`). Vite and Rolldown do not expose React hooks globally.
2. **Temporal Dead Zone (TDZ) Avoidance**:
   - In React component bodies, never reference a variable inside `useMemo`, `useCallback`, or `useEffect` before its `const` declaration line is reached.
3. **No Implicit Any**:
   - All function parameters, return types, and interface properties must be strictly typed.
4. **Design Token Integrity**:
   - Never introduce hardcoded hex color codes or arbitrary corner radii. Reference CSS custom properties declared in `src/index.css`.

---

## 4. Security & Privacy Invariants

1. **Server-Side PIN Fail-Closed**:
   - All Edge Functions (`holdings-crud`, `verify-pin`, `snapshot-net-worth`, `gemini-proxy`) must fail closed with **HTTP 503** if the server-side `APP_PIN_HASH` environment variable is unset.
   - Comparison of PIN hashes must use constant-time byte comparison (`timingSafeEqual`) to prevent timing side-channel attacks.
2. **No Client-Side Direct Storage Uploads**:
   - Never upload files to Supabase Storage directly from the browser client using the `anon` key. Storage operations must route through the server-side `holdings-crud` Edge Function using the `SERVICE_ROLE_KEY` after verifying the `X-App-Pin` header.
3. **Automated Credential Redaction**:
   - The application logger ([`logger.ts`](src/infrastructure/logging/logger.ts)) must automatically redact sensitive values (PIN hashes, API tokens, auth headers, private keys) before emitting console output.
4. **Zero-Trust Document Encryption**:
   - All Document Vault records must be encrypted client-side using `AES-GCM-256` before transmission. Keys are derived in-memory and never sent to cloud databases.

---

## 5. Testing & Verification Protocol

1. **Mandatory Pre-Commit Verification**:
   - Prior to any commit or push, run the full verification pipeline:
     ```bash
     npm run verify
     ```
     This command sequentially runs `eslint .`, `tsc --noEmit -p tsconfig.app.json`, `tsc --noEmit -p tsconfig.node.json`, `vitest run`, and `vite build`. All steps must exit with code 0.
2. **100% Test Pass Invariant**:
   - All 55 test suites and 309+ test cases must pass with zero failures.
3. **Environment Isolation for Node/Vitest**:
   - Browser storage APIs (`indexedDB`, `localStorage`, `Notification`) must always be wrapped in safety guards (`typeof indexedDB === 'undefined'`) with in-memory fallbacks so tests execute deterministically in Node.js test runners.
4. **Clean-Slate Screenshot Protocol**:
   - Whenever capturing or updating screenshots, always purge and remove the old files from `screenshots/` before capturing fresh captures. Maintain exact 2x Retina resolution and allow ~1.5s for charts and animations to settle.

# 🧠 tasks/lessons.md — Self-Improvement Log

After **any correction** from the user, append a new entry here with the pattern that caused the mistake and the rule to prevent recurrence.

**Review this file at the start of every new session.**

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

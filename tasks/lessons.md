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

### 2026-08-17 — Mobile Responsive Bottom Sheets, Dynamic Chart Heights & 24h Rate Caching
**Mistake**: Holding details opened as full-width side drawers on mobile; chart containers forced tall fixed heights (`370px`) causing excessive scrolling; commodity rate sync ran on every mount.  
**Root Cause**: Desktop-first layout defaults (`justify-end`, fixed heights) were applied without dedicated mobile-specific bottom-sheet flex containers and touch drag handles.  
**Fix**: (1) Converted `HoldingDetailDrawer` into an Apple-style bottom sheet (`items-end`, `rounded-t-2xl`, drag handle) on mobile and side drawer on desktop. (2) Set responsive chart heights (`min-h-[320px] sm:min-h-[370px]`) and dynamic skeleton placeholders in `AppShell`. (3) Gated daily commodity sync with a 24-hour timestamp check in `localStorage`.  
**Rule**: For detail drawers and complex forms, always branch layout into slide-up bottom sheets on mobile (`< 768px`) with top drag handles and safe-area padding. Always gate external daily market rate syncs behind 24-hour cache intervals.


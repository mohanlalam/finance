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

# Implementation Plan: UI Token Polish & Mobile Visual Refinements

This plan executes the 5 requested polish items:

- [x] **Task 1: PortfolioAssistant.tsx Token Cleanup**
  - Replaced raw Tailwind colors (`bg-slate-100 dark:bg-slate-800/60`, `border-slate-200/60`, `text-slate-400 dark:text-slate-500`, etc.) with design system tokens (`var(--surface-secondary)`, `var(--border-subtle)`, `var(--text-secondary)`, `var(--text-tertiary)`, `var(--accent-blue)`, `var(--accent-blue-soft)`).
- [x] **Task 2: MobileAlertsView.tsx Token Audit & Cleanup**
  - Audited and replaced all raw `slate-*` / hardcoded color classes with design system tokens across alert types, severities, tab switcher, empty state, and modal footer.
- [x] **Task 3: PortfolioTable.tsx Mobile Card Rendering Polish (Lines 377–535)**
  - Polished mobile card view (`isMobile = true`) with resilient flexbox truncation for long tickers and stock names, right-aligned P&L stack, improved tap ergonomics (`sm:w-8 sm:h-8`), and clean token usage.
- [x] **Task 4: ExportPanel.tsx Mobile Responsiveness Polish**
  - Constrained dropdown menu width (`max-w-[calc(100vw-24px)]`), standardized all dropdown menu items, backup category cards, and CSV broker import modal controls with design system tokens and button text truncation.
- [x] **Task 5: NetWorthTimelineChart Header Mobile Layout Polish**
  - Restructured header controls with responsive `flex flex-col sm:flex-row sm:justify-between sm:items-start` layout and horizontal scrolling support on xs viewports so the title, period gain pill, and date range pills never collide or wrap awkwardly.
- [x] **Task 6: Verification & Build**
  - Ran `npm run build` with 0 compilation and TypeScript errors.

# Tasks: Dashboard Mathematical & Logical Inconsistency Fixes

- [x] **Phase 1: Calculation & Allocation Fixes**
  - [x] 1.1 Fix Top Holdings allocation percentage in `src/components/InsightsPanel.tsx` using true portfolio stock total
  - [x] 1.2 Unify Today's Return formula across `src/utils/portfolioCalcs.ts`, `src/components/PortfolioTable.tsx`, and `src/components/HoldingDetailDrawer.tsx`
- [x] **Phase 2: Header Demarcation & Timeline X-Axis Deduplication**
  - [x] 2.1 Clarify Net Worth vs Stock Holdings P&L labels in `src/components/SummaryCards.tsx` and `src/components/PortfolioTable.tsx`
  - [x] 2.2 Deduplicate and refine X-axis date labels in `src/components/NetWorthTimelineChart.tsx`
- [x] **Phase 3: Verification & Git Sync**
  - [x] 3.1 Run `npx tsc --noEmit`
  - [x] 3.2 Run `npm test` (15/15 test suites, 90/90 tests passed)
  - [x] 3.3 Run `npm run build` (PWA generated cleanly)
  - [x] 3.4 Commit and push to `origin/main`

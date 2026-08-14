# Task Tracker: 8 Pending Features & Optimizations

## Phase 1: Architecture & Performance Core
- [x] 1. Fine-Grained 3-Context Split: Split `PortfolioDataContext` into `PortfolioEntitiesContext` and `PortfolioStatusContext` in `PortfolioContext.tsx`
- [x] 2. SWR Dual-State Cleanup: Streamline `usePortfolioData.ts` to rely directly on SWR state
- [x] 3. Viewport Code-Splitting: Lazy-load `DesktopSidebar` (desktop only) and `MobileHomeSummary`/`MobileBottomNav` (mobile only) in `AppShell.tsx`

## Phase 2: UX & Proactive Notifications
- [x] 4. Dedicated Chart & Widget Skeletons: Implement `ChartSkeleton.tsx` in `NetWorthTimelineChart.tsx` and `InsightsPanel.tsx`
- [x] 5. Push & Local Notifications for Maturities: Create `notifications.ts`, wire into `AlertsBanner.tsx` and background interval

## Phase 3: Capabilities & Family Tools
- [x] 6. Broker Statement CSV Auto-Import: Create `statementParser.ts` (Zerodha, Groww, CAMS) and wire import modal
- [x] 7. Family Member Comparison View: Create `FamilyComparisonModal.tsx` with side-by-side breakdown
- [x] 8. Persistent Activity & Audit Log: Create `activityLogger.ts` with IndexedDB storage and `ActivityLogDrawer.tsx`

## Phase 4: Verification & Walkthrough
- [x] 9. Automated Testing & Verification (`tsc`, `vitest`, `build` — 62 tests passing, 0 errors)
- [x] 10. Update `walkthrough.md`

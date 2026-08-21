# Tasks: Mobile View Performance Improvements

- [x] **Phase 1: State & Context Layer**
  - [x] 1.1 Create `src/contexts/MobileContext.tsx` with single-subscriber `MobileProvider` and `useIsMobileContext()`
  - [x] 1.2 Update `src/hooks/useIsMobile.ts` to consume `MobileContext` with fallback
  - [x] 1.3 Wrap root providers in `src/MainApp.tsx` with `MobileProvider`
- [x] **Phase 2: Pull-to-Refresh & Gesture Optimizations**
  - [x] 2.1 Refactor `src/hooks/usePullToRefresh.ts` with `pullDistanceRef` to eliminate closure churn
  - [x] 2.2 Update `src/hooks/useSwipeNavigation.ts` to include `'tax'` in `tabOrder`
  - [x] 2.3 Optimize `src/components/MobileBottomNav.tsx` icon rendering
- [x] **Phase 3: Render Isolation & CSS Containment**
  - [x] 3.1 Create `src/components/MobileStatusBar.tsx` as a memoized status bar
  - [x] 3.2 Update `src/layouts/AppShell.tsx` to use `<MobileStatusBar>` and section containment
  - [x] 3.3 Add `.mobile-section` to `src/index.css`
  - [x] 3.4 Refine `assetList` in `src/components/MobileHomeSummary.tsx` with inline percent and containment class
- [x] **Phase 4: Family Tab Bar Mobile UX**
  - [x] 4.1 Update `src/components/FamilyTabBar.tsx` to horizontal scroll on mobile
  - [x] 4.2 Add mobile accessible action popover ("…") for Rename & Delete
- [x] **Phase 5: Verification & Quality Assurance**
  - [x] 5.1 Run `npx tsc --noEmit` (0 errors)
  - [x] 5.2 Run `npm test` (15/15 test suites passed, 90/90 tests passed)
  - [x] 5.3 Run `npm run build` (Clean production bundle & PWA service worker generated)



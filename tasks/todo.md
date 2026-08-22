# 📋 Performance Optimization Tasks

- [x] **Phase 1: React Runtime & Calculation Performance**
  - [x] `SummaryCards.tsx`: Use precomputed `p.todayPnL` in `memberBreakdowns`
  - [x] `MobileHomeSummary.tsx`: Use precomputed `p.todayPnL` in member breakdown tiles
  - [x] `useAutoLock.ts`: Ref-stabilize `onLock` callback to eliminate global event listener re-binding
  - [x] `useKeyboardShortcuts.ts`: Ref-stabilize `onRefresh` callback
  - [x] `usePullToRefresh.ts`: Add unmount cleanup effect for `rafId`
- [x] **Phase 2: Storage, Network & Bullion/AMFI Caching Engine**
  - [x] `goldPricing.ts`: Add in-memory singleton cache `_memoryGoldSnapshot` to eliminate synchronous `localStorage` stalls
  - [x] `sipUtils.ts`: Implement in-flight request deduplication map and debounced IDB sync for fetched AMFI NAVs
  - [x] `vite.config.ts`: Add `api.gold-api.com` runtime caching and fix `amfi-api-cache` `maxEntries: 100`
  - [x] `index.html`: Add `<link rel="preconnect" href="https://api.gold-api.com" crossorigin />` and preconnect `api.mfapi.in`
  - [x] `usePortfolioData.ts`: Enhance SWR live price key with composite holding count to trigger instant refresh on additions/deletions
- [x] **Phase 3: UI Smoothness, SVG Charts & GPU Acceleration**
  - [x] `NetWorthTimelineChart.tsx`: Clamp `setDimensions` against same-width thrashing
  - [x] `PieChart.tsx`: Use CSS hover scale transitions instead of JS-driven trigonometric path re-stringification on mouse move
  - [x] `index.css`: Add `contain: layout style;` to `.apple-card` for desktop paint isolation
- [x] **Phase 4: Verification & Production Build**
  - [x] Run `npx tsc --noEmit` (Passed with 0 errors)
  - [x] Run `npm run lint` (Passed with 0 errors/warnings)
  - [x] Run `npm test` (All 16 test suites, 93 tests passed)
  - [x] Run `npm run build` (Passed, PWA precache & brotli/gzip assets generated)



# Tasks: Mobile Performance Optimization

- [x] **Phase 1: CSS Rendering & Touch Latency**
  - [x] 1.1 Add `content-visibility: auto` and `contain-intrinsic-size` for `.mobile-asset-card` in `src/index.css`
  - [x] 1.2 Add global `touch-action: manipulation` across interactive elements to remove 300ms mobile tap delays
  - [x] 1.3 Add GPU compositor layer promotion (`transform: translateZ(0)`, `will-change: transform`) for fixed/sticky bars
- [x] **Phase 2: Mobile Asset Card Class Consistency**
  - [x] 2.1 Ensure all asset card components (`PortfolioTable.tsx`, `DepositDetailsCard.tsx`, `RDAccountCard.tsx`, `SIPAccountCard.tsx`, `GoldHoldingCard.tsx`, `RealEstateCard.tsx`, `InsurancePolicyCard.tsx`) use `.mobile-asset-card`
- [x] **Phase 3: Idle Chunk Pre-warming**
  - [x] 3.1 Implement `requestIdleCallback` asset chunk prefetching in `src/layouts/AppShell.tsx` after initial unlock
- [x] **Phase 4: Mobile Home View Render Optimization**
  - [x] 4.1 Optimize `AppShell.tsx` mobile home layout with a Segmented Control toggle (*Overview* vs *Charts & AI*) to eliminate heavy chart DOM mounting on boot
- [x] **Phase 5: Verification & Production Build**
  - [x] 5.1 Run `npx tsc --noEmit` (Passed with 0 errors)
  - [x] 5.2 Run `npm run lint` (Passed with 0 errors/warnings)
  - [x] 5.3 Run `npm test` (Passed all 16 test suites, 93 tests)
  - [x] 5.4 Run `npm run build` (Passed, PWA assets and precache generated)

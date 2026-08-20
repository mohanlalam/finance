# Tasks: Live MCX Gold Price & Bullion Valuation Sync

- [x] **Phase 1: Real-time Gold Pricing Engine**
  - [x] 1.1 Update `src/utils/goldPricing.ts` with `fetchLiveGoldRates`, intraday change calculation, and robust live fallback
  - [x] 1.2 Add/update unit tests in `src/utils/__tests/goldPricing.test.ts`
- [x] **Phase 2: UI & Live Market Ribbon Integration**
  - [x] 2.1 Build Live MCX Bullion Rate Ribbon in `src/components/GoldHoldingView.tsx` with 24K/22K/18K ticker and Sync trigger
  - [x] 2.2 Update `src/components/gold/GoldHoldingCard.tsx` with live valuation badges and total weight summary
- [x] **Phase 3: Verification & Git Sync**
  - [x] 3.1 Run `npx tsc --noEmit`
  - [x] 3.2 Run `npm test` (15/15 test suites, 89/89 tests passed)
  - [x] 3.3 Run `npm run build` (PWA generated cleanly)
  - [x] 3.4 Commit and push to `origin/main`

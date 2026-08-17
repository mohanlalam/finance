# Implementation Plan: Live Gold Spot Rates, Modular Sub-Hooks & Localhost Dev Server

This implementation executes the 3 chosen tasks:
1. **Task 2: Live MCX Gold & Bullion Spot Rate Integration**:
   - Add live gold rate fetching service (24K, 22K per gram in INR) with automatic fallback and caching.
   - Dynamically compute gold holdings valuation using live market rate × weight in grams when active.
   - Display live 24K/22K per gram rate badge in `GoldHoldingView.tsx`.
2. **Task 4: Run Localhost Dev Server**:
   - Start Vite development server at `http://localhost:5173/` and verify connectivity.
3. **Task 5: Modular Sub-Hooks Refactoring**:
   - Extract domain sub-hooks from `usePortfolioData.ts` to reduce monolithic bloat:
     - `src/hooks/useLivePrices.ts`: Encapsulates stock quote polling, Yahoo symbol alias mapping, and AMFI mutual fund NAV fetching.
     - `src/hooks/useLiveGoldPrices.ts`: Encapsulates gold spot rate fetching and valuation calculations.

---

## User Review Required
> [!NOTE]
> Gold valuations will cleanly fallback to user-entered purchase prices/valuations if network is offline or live rate is unavailable.

---

## Proposed Changes

### 1. Gold Price Service & Type Definitions
#### [NEW] [src/utils/goldPricing.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/goldPricing.ts)
- Exposes `fetchLiveGoldRate()` with SWR / local caching.
- Handles 24K and 22K spot rate estimation based on gold price feeds (e.g. IBJA / MCX spot rate or Yahoo `GOLDBEES.NS` / `GC=F` calibrated per gram).

#### [MODIFY] [src/types/portfolio.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/types/portfolio.ts)
- Add optional `liveRatePerGram?: number` and `isLiveValuation?: boolean` to `GoldHolding`.

#### [MODIFY] [src/components/gold/GoldHoldingCard.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/gold/GoldHoldingCard.tsx) & [src/components/GoldHoldingView.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/GoldHoldingView.tsx)
- Show current 24K / 22K live market rate badge in header.
- Display live rate per gram and calculated valuation.

### 2. Refactor & Modularize Domain Hooks
#### [NEW] [src/hooks/useLivePrices.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useLivePrices.ts)
- Extracts stock Yahoo quote resolution and mutual fund AMFI NAV batch fetching from `usePortfolioData.ts`.

#### [NEW] [src/hooks/useLiveGoldPrices.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useLiveGoldPrices.ts)
- Manages gold spot rate polling interval and applies live valuation across gold holdings.

#### [MODIFY] [src/hooks/usePortfolioData.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/usePortfolioData.ts)
- Consumes extracted sub-hooks, trimming ~300 lines of complex pricing logic.

---

## Verification Plan
### Automated Tests
- Create unit tests for gold pricing calculations: `src/utils/__tests/goldPricing.test.ts`.
- Run `npm run typecheck`.
- Run `npm run test`.
- Run `npm run build`.

### Manual Testing
- Check live gold rate display on `http://localhost:5173/` under Gold tab.

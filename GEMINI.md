# 💼 Family Portfolio Tracker — GEMINI.md (Project Architecture)

This document provides a high-level overview of the folder structure, data flow, state management, database mappings, and performance optimizations of the Family Portfolio Tracker application. It is designed to help developers and AI agents navigate the codebase efficiently.

---

## 📁 Key File Structures & Domains

### 1. State Management & API Hooks
* **[PortfolioContext.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/contexts/PortfolioContext.tsx)**
  * Split into `PortfolioDataContext` (containing global asset lists, pricing sync statuses, and last updated timestamps) and `PortfolioActionContext` (consolidated CRUD action triggers: `addAsset`, `updateAsset`, `deleteAsset`, and `refresh`).
  * Exposes optimized `usePortfolioState()` and `usePortfolioActions()` hooks separately. The unified `usePortfolio()` combined hook has been completely removed to prevent form modals and write-only components from re-rendering during data/price ticks.
  * Sets up a background price refresh polling interval (15 minutes). The tab visibility refresh gate and resume cooldown are offloaded to `usePortfolioData.ts` to prevent redundant fetches.
* **[usePortfolioData.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/usePortfolioData.ts)**
  * Source of truth for portfolio assets, net worth snapshots, and database transactions.
  * Integrated **SWR caching** and automatic IndexedDB caching (`idb-keyval`) to implement stale-while-revalidate instant loads.
  * Configures SWR with `dedupingInterval: 300_000` (5 minutes) to avoid duplicate network fetches within a short timeframe, and `errorRetryCount: 2` to prevent rapid retry storms on unstable mobile networks.
  * Clears IndexedDB cache via `invalidateIDBCache()` on asset/portfolio mutations to prevent state synchronization issues.
  * Listens to document `visibilitychange` events to trigger background SWR reloads and price refreshes on window focus/resume.
  * Implements a `recalcPortfolioTotals` performance guard that skips recalculation tasks if the underlying asset details haven't changed.
  * Guarantees race-free state transitions by processing queries/mutations through a serialized promise queue (`runMutation`) with debounced mutation coalescing.
  * Implements a resolver registry callback queue (`refreshResolversRef`) in `refreshSnapshot` to prevent hanging promises when debounce triggers are cancelled.
  * Sorts family portfolios dynamically in a data-driven way, pinning the primary `'personal'` portfolio to the top and sorting custom/other portfolios chronologically via database creation dates (`created_at`).
  * Connects to Supabase Edge Functions via [apiClient.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/apiClient.ts). Now implements session-level in-memory caching of the computed SHA-256 PIN hash (`_cachedPinHash`) to eliminate encryption overhead on every API call. This cache is automatically cleared if a 401 Unauthorized response is received.
  * Manages stock price caching (15-minute TTL) and live polling.
* **[supabaseClient.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/supabaseClient.ts)**
  * Dynmically initializes the Supabase JS SDK. Refactored to dynamically import `@supabase/supabase-js` only when `getSupabase()` is executed, preventing the large client library (~117 kB) from loading inside the initial auth bundle.
* **[useRDData.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useRDData.ts)**
  * Thin hook wrapper pulling Recurring Deposit state and operations directly from `PortfolioContext`.
* **[useSIPData.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useSIPData.ts)**
  * Thin hook wrapper pulling Mutual Fund SIP state and operations from `PortfolioContext`.
* **[usePortfolioInsights.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/usePortfolioInsights.ts)**
  * Evaluates aggregate portfolio insights, top holdings by value, top daily gainers and losers, and the **top 3 biggest movers** by absolute daily return.
  * Calculates asset allocation drift, concentration alerts, fixed deposit upcoming maturities (30 days), and insurance renewal warnings (60 days) to construct the complete portfolio health analytics view.
* **[ToastContext.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/contexts/ToastContext.tsx)**
  * Exposes global toast/snackbar notifications state (`useToast`) and auto-dismissals, entirely replacing raw browser `alert()` popups across the app.


### 2. App Shell & Navigation Router
* **[App.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/App.tsx)**
  * Serves as a lightweight, zero-dependency entry gate component. If the access PIN is not verified, it immediately renders `PinLockScreen` from a clean, provider-free chunk. Once unlocked, it dynamically imports and mounts `MainApp` using `React.lazy`.
* **[MainApp.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/MainApp.tsx)**
  * Hosts all context providers (`ThemeProvider`, `PortfolioProvider`), the Router routes structure, and the dashboard hydration load gates, isolating them from the initial lock screen bundle. Utilizes a single media-query listener setup to handle viewport checks efficiently.
* **[AppShell.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/layouts/AppShell.tsx)**
  * Serves as the core layout manager. Optimizes first paint speed by using `React.lazy` to defer loading the `InsightsPanel` and `SearchBar` components (minimizing bundle weight by ~17 KB for search alone). Uses `window.matchMedia` query listeners rather than `window.innerWidth` resize event handlers to run responsive layout adaptations (`isMobile`) without causing scroll lag or layout thrashing.
* **[useSwipeNavigation.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useSwipeNavigation.ts)**
  * Touch swipe gesture listeners and navigation routing between active asset tabs.
* **[useKeyboardShortcuts.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useKeyboardShortcuts.ts)**
  * Custom hook that isolates window keyboard keydown event listeners (e.g. `Ctrl+Shift+R` to sync stock prices).
* **[useAlerts.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useAlerts.ts)**
  * Evaluates warnings (expiring documents, upcoming due dates, stock 52-week highs/lows, and portfolio swing alerts) and handles dismissals.
* **[PinLockScreen.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/PinLockScreen.tsx)**
  * Restricts app access via a secure numerical pin-pad gate with keyboard support and session-based verification.
* **[ErrorBoundary.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/ErrorBoundary.tsx)**
  * Catches rendering errors defensively across major views (like lazy components and AppShell) to display user-friendly fallbacks rather than crashing the interface.

### 3. Registry Component Routing
* **[AssetTabContent.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/AssetTabContent.tsx)**
  * Orchestrator component rendering the active asset registry view.
  * Integrates **dynamic lazy loading** (`React.lazy` and `React.Suspense`) for ALL heavy registry views and tables: `FixedDepositView`, `RDView`, `SIPView`, `GoldHoldingView`, `RealEstateView`, `InsuranceView`, `DocumentVaultView`, and `PortfolioTable` using [AssetCardSkeleton.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/AssetCardSkeleton.tsx) as the loading fallback.


### 4. Modular UI Components
Component folders are isolated by asset domain to ensure clean separation of concerns:
* **[src/components/fd/](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/fd/)**: Standard Fixed Deposit cards (`DepositDetailsCard.tsx`) and form controls (`StandardFormFields.tsx`).
* **[src/components/rd/](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/rd/)**: Recurring Deposit lists (`RDView.tsx`, `RDAccountCard.tsx`), modals (`RDFormModal.tsx`), and monthly contributions trackers (`RDInstallmentSchedule.tsx`).
* **[src/components/sip/](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/sip/)**: Mutual Fund SIP views (`SIPView.tsx`, `SIPAccountCard.tsx`), modals (`SIPFormModal.tsx`), and live schema lookup fields (`SIPFormFields.tsx`).

* **Visual Dashboard & Widget Components**:
  * **[NetWorthTimelineChart.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/NetWorthTimelineChart.tsx)**: Responsive SVG line & area chart showing compound net worth valuation timeline. Custom date-range filtering is supported (1M, 3M, 6M, 1Y, ALL).
  * **[WhatIfCalculator.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/WhatIfCalculator.tsx)**: Premium glassmorphic calculator projecting compound returns and investment totals. Houses HSL-themed range inputs, metrics panels, and a dual-curve SVG area growth chart with interactive hover tooltips.
  * **[PortfolioAssistant.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/PortfolioAssistant.tsx)**: Conversational multi-turn NLP chat assistant. Features inline markdown formatting, automated auto-scroll logs, typing indicators, dynamic suggestion buttons, and keyboard shortcuts.
  * **[DashboardWidgets.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/DashboardWidgets.tsx)**: Capacitor WebView widget page with Net Worth, Today's Gain, and upcoming FD indicators. Uses a clean fallback string "No upcoming maturities" under all zero-matured situations.
  * **[InsightsPanel.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/InsightsPanel.tsx)**: Displays the main portfolio health breakdown, today's top 3 biggest movers, top holdings list, best/worst performance indicators per member, top gainers/losers list, asset allocation drift, and alert notifications. Supports filtering insights by asset domain (All, Stocks, FDs, Insurance, High Risk, Due Soon).
* **App Icon System & Mobile Summary Optimizations**:
  * **[AppIcons.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/icons/AppIcons.tsx)**: Custom inline SVG icon library containing 35 optimized icon definitions. By replacing all external `lucide-react` icons in critical rendering paths, it prevents the main application bundle from loading the large `lucide-react` module, resulting in dramatic bundle-weight savings.
  * **[MobileHomeSummary.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/MobileHomeSummary.tsx)**: Displays the mobile dashboard overview. Wrapped with `React.memo` to prevent re-renders on price/data ticks when parent states change, and optimized to run a single-pass `useMemo` for-loop instead of 9 separate `reduce()` calculations.

---

## ⚡ Performance Optimizations & Web Workers

The application implements a series of high-performance strategies to guarantee fluid 60FPS animations, instant transitions, and negligible main-thread blocking:

### 1. Web Worker Offloading
* CPU-heavy financial and scoring calculations are offloaded to asynchronous background Web Workers in the `src/workers/` folder. If a worker fails to instantiate (common on iOS WebViews or Capacitor environments) or triggers an execution error, the task falls back to the synchronous main-thread solver while throwing detailed warnings (`console.warn`) for debugging diagnostics:
  * **[xirr.worker.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/workers/xirr.worker.ts)**: Handles Newton-Raphson cash flow solvers.
  * **[healthScore.worker.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/workers/healthScore.worker.ts)**: Performs portfolio health evaluations.
  * **[rebalancing.worker.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/workers/rebalancing.worker.ts)**: Generates buy/sell allocation drift advice.

### 2. Render Memoization & Virtualization
* **List Virtualization**: Accounts views utilize `react-window` to virtualize accounts when lists exceed 8 items, binding rows to unique asset IDs (`itemKey`) to optimize DOM recycling and prevent rendering glitches during list mutations.
* **Card Memoization**: Asset card components use `React.memo` with strict equality functions comparing primary metrics to prevent redundant child re-renders.
* **SVG Coordinate Memoization**: Grid and path builders in `NetWorthTimelineChart.tsx` wrap layout and coordinate calculations in `useMemo` blocks, avoiding recalculation unless data or sizes change.
* **Lazy Rendering Viewports**: Heavy SVG/D3 charts (`NetWorthTimelineChart.tsx`) inside `AppShell.tsx` are wrapped in a type-safe `LazyChartWrapper` utilizing `IntersectionObserver`. This completely defers dynamic import bundle fetching and `React.lazy` evaluation until the chart placeholder scrolls into view, avoiding startup main-thread bloat.


### 3. Caching & Network Coalescing
* **SWR Hook & Mutation Coalescing**: Wraps remote assets data with cache revalidation. Coordinates remote calls to prevent double fetching, ensuring initial load live prices and NAV updates are handled smoothly by SWR keys.
* **Persistent IndexedDB NAV Caching**: Live AMFI Mutual Fund NAV scheme requests inside `sipUtils.ts` are cached and written asynchronously to IndexedDB (`idb-keyval`) to prevent synchronous main-thread jank. The NAV cache is initialized asynchronously (fire-and-forget) on app start using `initNAVCache()` during the hook mount sequence, preventing it from blocking the retrieval of cached portfolio data from IndexedDB.
* **IndexedDB Cache Storage**: Local caching of full portfolio datasets is strictly offloaded to IndexedDB (`idb-keyval`) to avoid browser `localStorage` size limits (keeping `localStorage` only for lightweight metadata like execution timestamps). It includes active `isMounted` guard patterns to prevent memory leak state updates.
* **Reload Gating on Resume**: Implements a 5-minute (300,000 ms) elapsed time gate inside the `visibilitychange` listener of `usePortfolioData.ts` to prevent redundant, concurrent network sync operations on mobile app focus resumes.

### 4. Bundler & Build Optimizations
* **Rollup manualChunks Splitting**: Configures a dynamic module path filter for manual chunks in [vite.config.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/vite.config.ts) to explicitly split heavy modules (`@supabase/supabase-js`, `swr`, `idb-keyval`, and `react-window`) into separate vendor chunks. This keeps the initial paint payload for the PIN Lock screen exceptionally light.
* **Target and Compression Settings**: Configures compiler target as `es2020` in [vite.config.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/vite.config.ts), enabling modern ES features and reducing output bundle size by ~10-15%. Minimizes CSS via `cssMinify: true`, and disables `reportCompressedSize` to accelerate build pipelines.
* **PWA Chunks Offline Caching**: Updates workbox caching patterns within the Vite PWA plugin to cache all compiled assets (`assets/*.js` and `assets/*.css`). This guarantees that all lazily-loaded sub-route chunks and CSS files are pre-cached and fully available offline on first load.

---

## 💾 Database Schema & Table Mappings

Every deposit registry maps to its own separate database table. This guarantees clean migrations and isolation of relational data:

| Asset Tab / UI Mode | Supabase PostgreSQL Table | Core Compounding / Valuation Rule |
| :--- | :--- | :--- |
| **Fixed Deposit (FD)** | `fixed_deposits` | Half-yearly compounding (FD interest rates) |
| **Recurring Deposit (RD)** | `rd_accounts` | Quarterly compounding + Contribution dates array |

| **SIP Mutual Fund (SIP)** | `sip_accounts` | Live AMFI NAV scheme price multiplication, no compounding |

---

## 🧮 Calculations & Formatters
* **[portfolioCalcs.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/portfolioCalcs.ts)**: Handles asset allocation aggregations, performance monitoring, and drift offsets. Completely decoupled from specific asset utilities (`formatters.ts`, `rdUtils.ts`, `sipUtils.ts`) by relying on pre-calculated asset totals on the `Portfolio` object.
* **[mathUtils.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/mathUtils.ts)**: Implements standard math helper utilities, exporting the shared `compoundValue` engine to break circular dependencies.
* **[performance.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/performance.ts)**: Implements solvers for XIRR, CAGR calculations, and weighted holding age. Guarded against same-sign cashflows and Newton-Raphson divergence via a robust bisection fallback. Evaluates stock holdings' weighted age using the database `created_at` timestamp rather than a hardcoded 1.0 year fallback.
* **[healthScore.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/healthScore.ts)**: Evaluates a 0-100 health score based on diversification, active SIPs, emergency buffers, equity concentration, and insurance status. Caps Emergency Fund Buffer at 20 points and Insurance Cover at 15 points.
* **[rebalancing.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/rebalancing.ts)**: Asset rebalancing engine calculating specific buy/sell recommendations from target drift. Recommends rebalancing purely when the absolute difference exceeds an explicit threshold `MIN_ACTION = 5000`, removing drift percentage dependencies.
* **[assistant.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/assistant.ts)**: Features an intent-based classification system (`detectIntent`) routing natural language queries with synonym normalization. Supports new family member wealth breakdown and next SIP date queries with high-priority matching to prevent keyword overlaps.
* **[formatters.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/formatters.ts)**: Implements Indian currency formats (`₹` INR) and standard FD compounding (compounded semi-annually).
* **[rdUtils.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/rdUtils.ts)**: Computes elapsed month contributions and quarterly compounding leveraging the shared engine.
* **[sipUtils.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/sipUtils.ts)**: Calculates monthly contributions elapsed and retrieves live NAV evaluations, automatically respecting `account.liveNav` parameters.


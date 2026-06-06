# 💼 Family Portfolio Tracker — Project Architecture

This document provides a high-level overview of the folder structure, data flow, state management, database mappings, and performance optimizations of the Family Portfolio Tracker application. It is designed to help developers and AI agents navigate the codebase efficiently.

---

## 📁 Key File Structures & Domains

### 1. State Management & API Hooks
* **[PortfolioContext.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/contexts/PortfolioContext.tsx)**
  * Split into `PortfolioDataContext` (containing global asset lists, pricing sync statuses, and last updated timestamps) and `PortfolioActionContext` (consolidated CRUD action triggers: `addAsset`, `updateAsset`, `deleteAsset`, and `refresh`).
  * Exposes optimized `usePortfolioState()` and `usePortfolioActions()` hooks separately. The unified `usePortfolio()` combined hook has been completely removed to prevent form modals and write-only components from re-rendering during data/price ticks.
* **[usePortfolioData.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/usePortfolioData.ts)**
  * Source of truth for portfolio assets, net worth snapshots, and database transactions.
  * Integrated **SWR caching** and automatic IndexedDB caching (`idb-keyval`) to implement stale-while-revalidate instant loads.
  * Clears IndexedDB cache via `invalidateIDBCache()` on asset/portfolio mutations to prevent state synchronization issues.
  * Listens to document `visibilitychange` events to trigger background SWR reloads and price refreshes on window focus/resume.
  * Guarantees race-free state transitions by processing queries/mutations through a serialized promise queue (`runMutation`) with debounced mutation coalescing.
  * Implements a resolver registry callback queue (`refreshResolversRef`) in `refreshSnapshot` to prevent hanging promises when debounce triggers are cancelled.
  * Sorts family portfolios dynamically in a data-driven way, pinning the primary `'personal'` portfolio to the top and sorting custom/other portfolios chronologically via database creation dates (`created_at`).
  * Connects to Supabase Edge Functions via [apiClient.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/apiClient.ts).
  * Manages stock price caching (15-minute TTL) and live polling.
* **[useRDData.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useRDData.ts)**
  * Thin hook wrapper pulling Recurring Deposit state and operations directly from `PortfolioContext`.
* **[useSIPData.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useSIPData.ts)**
  * Thin hook wrapper pulling Mutual Fund SIP state and operations from `PortfolioContext`.
* **[useSSYData.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useSSYData.ts)**
  * Thin hook wrapper pulling Sukanya Samriddhi Yojana state and operations from `PortfolioContext`.

### 2. App Shell & Navigation Router
* **[App.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/App.tsx)**
  * Roots the layout, global Dark/Light mode theme state, keyboard shortcuts, swipe tab routing, and responsive layouts.
  * Coordinates layout differences: renders [MobileHomeSummary.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/MobileHomeSummary.tsx) on narrow views, and a multi-panel grid dashboard on desktops.
* **[useSwipeNavigation.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useSwipeNavigation.ts)**
  * Touch swipe gesture listeners and navigation routing between active asset tabs.
* **[useKeyboardShortcuts.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useKeyboardShortcuts.ts)**
  * Custom hook that isolates window keyboard keydown event listeners (e.g. `Ctrl+Shift+R` to sync stock prices).
* **[useAlerts.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useAlerts.ts)**
  * Evaluates warnings (expiring documents, upcoming due dates, portfolio concentration limits) and handles dismissals.
* **[PinLockScreen.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/PinLockScreen.tsx)**
  * Restricts app access via a secure numerical pin-pad gate with keyboard support and session-based verification.

### 3. Registry Component Routing
* **[AssetTabContent.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/AssetTabContent.tsx)**
  * Orchestrator component rendering the active asset registry view.
  * Integrates **dynamic lazy loading** (`React.lazy` and `React.Suspense`) for heavy views (`FixedDepositView`, `RDView`, `SIPView`, and `SSYView`) using [AssetCardSkeleton.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/AssetCardSkeleton.tsx) as the loading fallback.

### 4. Modular UI Components
Component folders are isolated by asset domain to ensure clean separation of concerns:
* **[src/components/fd/](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/fd/)**: Standard Fixed Deposit cards (`DepositDetailsCard.tsx`) and form controls (`StandardFormFields.tsx`).
* **[src/components/rd/](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/rd/)**: Recurring Deposit lists (`RDView.tsx`, `RDAccountCard.tsx`), modals (`RDFormModal.tsx`), and monthly contributions trackers (`RDInstallmentSchedule.tsx`).
* **[src/components/sip/](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/sip/)**: Mutual Fund SIP views (`SIPView.tsx`, `SIPAccountCard.tsx`), modals (`SIPFormModal.tsx`), and live schema lookup fields (`SIPFormFields.tsx`).
* **[src/components/ssy/](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/ssy/)**: SSY girls' ledger views (`SSYView.tsx`, `SSYAccountCard.tsx`), form modals (`SSYFormModal.tsx`), and custom compounding ledger schedules (`SSYSchedule.tsx`).
* **Visual Dashboard & Widget Components**:
  * **[NetWorthTimelineChart.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/NetWorthTimelineChart.tsx)**: Responsive SVG line & area chart showing compound net worth valuation timeline. Custom date-range filtering is supported (1M, 3M, 6M, 1Y, ALL).
  * **[TreemapChart.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/TreemapChart.tsx)**: SVG tree-map highlighting relative equity allocation sizes. Safeguarded with division-by-zero guards and box clamping, filtering out sub-1px elements to prevent overlapping coordinate errors.
  * **[SankeyChart.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/SankeyChart.tsx)**: SVG flow diagram mapping net worth down to category classes and sub-assets. Contains thickness checks preventing the rendering of zero-width paths and invalid nodes.
  * **[PortfolioAssistant.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/PortfolioAssistant.tsx)**: Interactive NLP chat assistant interface.
  * **[DashboardWidgets.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/DashboardWidgets.tsx)**: Capacitor WebView widget page with Net Worth, Today's Gain, and upcoming FD indicators. Uses a clean fallback string "No upcoming maturities" under all zero-matured situations.

---

## ⚡ Performance Optimizations & Web Workers

The application implements a series of high-performance strategies to guarantee fluid 60FPS animations, instant transitions, and negligible main-thread blocking:

### 1. Web Worker Offloading
CPU-heavy financial and scoring calculations are offloaded to asynchronous background Web Workers in the `src/workers/` folder. Each worker includes a **fail-safe synchronous fallback** for environments that do not support Web Workers (such as unit test execution):
* **[xirr.worker.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/workers/xirr.worker.ts)**: Handles Newton-Raphson cash flow solvers.
* **[healthScore.worker.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/workers/healthScore.worker.ts)**: Performs portfolio health evaluations.
* **[rebalancing.worker.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/workers/rebalancing.worker.ts)**: Generates buy/sell allocation drift advice.

### 2. Render Memoization & Virtualization
* **List Virtualization**: Accounts views utilize `react-window` to virtualize accounts when lists exceed 8 items, binding rows to unique asset IDs (`itemKey`) to optimize DOM recycling and prevent rendering glitches during list mutations.
* **Card Memoization**: Asset card components use `React.memo` with strict equality functions comparing primary metrics to prevent redundant child re-renders.
* **SVG Coordinate Memoization**: Grid and path builders in `NetWorthTimelineChart.tsx` and `SankeyChart.tsx` wrap layout and coordinate calculations in `useMemo` blocks, avoiding recalculation unless data or sizes change.
* **Lazy Rendering Viewports**: Charts and components inside `AppShell.tsx` are lazy-rendered via `IntersectionObserver` wrappers, postponing loading and calculation until the elements are scrolled into the viewport.

### 3. Caching & Network Coalescing
* **SWR Hook & Mutation Coalescing**: Wraps remote assets data with cache revalidation. Coordinates remote calls to prevent double fetching, ensuring initial load live prices and NAV updates are handled smoothly by SWR keys.
* **In-Memory TTL Caching**: Live NAV scheme requests inside `sipUtils.ts` are cached in memory with a 15-minute Time-To-Live.
* **IndexedDB Cache Storage**: Local caching of full portfolio datasets is strictly offloaded to IndexedDB (`idb-keyval`) to avoid browser `localStorage` size limits (keeping `localStorage` only for lightweight metadata like execution timestamps). It includes active `isMounted` guard patterns to prevent memory leak state updates.

---

## 💾 Database Schema & Table Mappings

Every deposit registry maps to its own separate database table. This guarantees clean migrations and isolation of relational data:

| Asset Tab / UI Mode | Supabase PostgreSQL Table | Core Compounding / Valuation Rule |
| :--- | :--- | :--- |
| **Fixed Deposit (FD)** | `fixed_deposits` | Half-yearly compounding (FD interest rates) |
| **Recurring Deposit (RD)** | `rd_accounts` | Quarterly compounding + Contribution dates array |
| **Sukanya Samriddhi (SSY)** | `ssy_accounts` | Annual compounding on April 1st (Indian financial boundary) |
| **SIP Mutual Fund (SIP)** | `sip_accounts` | Live AMFI NAV scheme price multiplication, no compounding |

---

## 🧮 Calculations & Formatters
* **[portfolioCalcs.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/portfolioCalcs.ts)**: Handles asset allocation aggregations, performance monitoring, drift offsets, and exports the shared `compoundValue` engine.
* **[performance.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/performance.ts)**: Implements solvers for XIRR, CAGR calculations, and weighted holding age. Guarded against same-sign cashflows and Newton-Raphson divergence via a robust bisection fallback. Evaluates stock holdings' weighted age using the database `created_at` timestamp rather than a hardcoded 1.0 year fallback.
* **[healthScore.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/healthScore.ts)**: Evaluates a 0-100 health score based on diversification, active SIPs, emergency buffers, equity concentration, and insurance status. Caps Emergency Fund Buffer at 20 points and Insurance Cover at 15 points.
* **[rebalancing.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/rebalancing.ts)**: Asset rebalancing engine calculating specific buy/sell recommendations from target drift. Recommends rebalancing purely when the absolute difference exceeds an explicit threshold `MIN_ACTION = 5000`, removing drift percentage dependencies.
* **[assistant.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/assistant.ts)**: Features an intent-based classification system (`detectIntent`) routing natural language queries before running parameter extraction, preventing false positive matches. Evaluates performers query routes first with plural keyword-spacing support to avoid intent matching overlaps.
* **[formatters.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/formatters.ts)**: Implements Indian currency formats (`₹` INR) and standard FD compounding (compounded semi-annually).
* **[rdUtils.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/rdUtils.ts)**: Computes elapsed month contributions and quarterly compounding leveraging the shared engine.
* **[sipUtils.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/sipUtils.ts)**: Calculates monthly contributions elapsed and retrieves live NAV evaluations, automatically respecting `account.liveNav` parameters.
* **[ssyUtils.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/ssyUtils.ts)**: Contains Indian Financial Year calculations, annual SSY compounding rates, and legal deposit range validations.

# 💼 Family Portfolio Tracker — GEMINI.md (Project Architecture)

This document provides a high-level overview of the folder structure, data flow, state management, database mappings, and performance optimizations of the Family Portfolio Tracker application. It is designed to help developers and AI agents navigate the codebase efficiently.

---

## 📁 Key File Structures & Domains

### 1. State Management & API Hooks
* **[PortfolioContext.tsx](src/contexts/PortfolioContext.tsx)**
  * Split into `PortfolioDataContext` (containing global asset lists, pricing sync statuses, and last updated timestamps) and `PortfolioActionContext` (consolidated CRUD action triggers: `addAsset`, `updateAsset`, `deleteAsset`, and `refresh`).
  * Exposes optimized `usePortfolioState()` and `usePortfolioActions()` hooks separately. The unified `usePortfolio()` combined hook has been completely removed to prevent form modals and write-only components from re-rendering during data/price ticks.
  * Sets up a background price refresh polling interval (15 minutes). The tab visibility refresh gate and resume cooldown are offloaded to `usePortfolioData.ts` to prevent redundant fetches.
* **[usePortfolioData.ts](src/hooks/usePortfolioData.ts)**
  * Source of truth for portfolio assets, net worth snapshots, and database transactions.
  * Integrated **SWR caching** and automatic IndexedDB caching (`idb-keyval`) to implement stale-while-revalidate instant loads.
  * Configures SWR with `dedupingInterval: 300_000` (5 minutes) to avoid duplicate network fetches within a short timeframe, and `errorRetryCount: 2` to prevent rapid retry storms on unstable mobile networks.
  * Clears IndexedDB cache via `invalidateIDBCache()` on asset/portfolio mutations to prevent state synchronization issues.
  * Listens to document `visibilitychange` events to trigger background SWR reloads and price refreshes on window focus/resume.
  * Implements a `recalcPortfolioTotals` performance guard that skips recalculation tasks if the underlying asset details haven't changed.
  * Guarantees race-free state transitions by processing queries/mutations through a serialized promise queue (`runMutation`) with debounced mutation coalescing.
  * Implements a resolver registry callback queue (`refreshResolversRef`) in `refreshSnapshot` to prevent hanging promises when debounce triggers are cancelled.
  * Sorts family portfolios dynamically in a data-driven way, pinning the primary `'personal'` portfolio to the top and sorting custom/other portfolios chronologically via database creation dates (`created_at`).
  * Connects to Supabase Edge Functions via [apiClient.ts](src/utils/apiClient.ts). Now implements session-level in-memory caching of the computed SHA-256 PIN hash (`_cachedPinHash`) to eliminate encryption overhead on every API call. This cache is automatically cleared on session lock/logout via `clearApiSessionCache()` in `auth.ts` or upon receiving a 401 Unauthorized response.
  * Manages stock price caching (15-minute TTL) and live polling.
  * Implements a fallback response in SWR fetchers to prevent hanging promises and stuck `"Syncing prices..."` loading screens when a portfolio contains no stock holdings or active SIPs.
  * Validates all mutation payload inputs against a comprehensive `VALID_ASSET_TYPES` registry covering all frontend/backend aliases (`stock`, `stocks`, `holding`, `holdings`, `fd`, `rd`, `sip`, `gold`, `documents`, etc.).
* **[useModalState.ts](src/hooks/useModalState.ts)**
  * Dedicated custom hook encapsulating all modal visibility and target state (`quickAddTarget`, `showAddModal`, `showAddFamily`, `renameTarget`, `deleteTarget`, `isDeleting`, `showMobileAlerts`, `showChangePinModal`).
  * Exposes memoized handler callbacks (`openAddModal`, `closeAddModal`, `openAddFamily`, `closeAddFamily`, `openRenameModal`, `closeRenameModal`, `openDeleteModal`, `closeDeleteModal`, `openMobileAlerts`, `closeMobileAlerts`, `openChangePinModal`, `closeChangePinModal`, `setQuickAddTarget`, `clearQuickAddTarget`).
  * Computes an aggregate `isAnyModalOpen` boolean flag to cleanly gate Floating Add Button (`FloatingAddMenu`) visibility and eliminate inline boolean OR expressions.
* **[supabaseClient.ts](src/utils/supabaseClient.ts)**
  * Dynamically initializes the Supabase JS SDK. Refactored to dynamically import `@supabase/supabase-js` only when `getSupabase()` is executed, preventing the large client library (~117 kB) from loading inside the initial auth bundle.
* **[useRDData.ts](src/hooks/useRDData.ts)**
  * Thin hook wrapper pulling Recurring Deposit state and operations directly from `PortfolioContext`.
* **[useSIPData.ts](src/hooks/useSIPData.ts)**
  * Thin hook wrapper pulling Mutual Fund SIP state and operations from `PortfolioContext`.
* **[usePortfolioInsights.ts](src/hooks/usePortfolioInsights.ts)**
  * Evaluates aggregate portfolio insights, top holdings by value, top daily gainers and losers, and the **top 5 biggest movers** by absolute daily return.
  * Calculates asset allocation drift, concentration alerts, fixed deposit upcoming maturities (30 days), and insurance renewal warnings (60 days) to construct the complete portfolio health analytics view.
* **[ToastContext.tsx](src/contexts/ToastContext.tsx)**
  * Exposes global toast/snackbar notifications state (`useToast`) and auto-dismissals, entirely replacing raw browser `alert()` popups across the app (including share summary clipboard triggers in `DepositDetailsCard`, `RDAccountCard`, and `SIPAccountCard`).


### 2. App Shell & Navigation Router
* **[App.tsx](src/App.tsx)**
  * Serves as a lightweight, zero-dependency entry gate component. If the access PIN is not verified, it immediately renders `PinLockScreen` from a clean, provider-free chunk. Once unlocked, it dynamically imports and mounts `MainApp` using `React.lazy`.
* **[MainApp.tsx](src/MainApp.tsx)**
  * Hosts all context providers (`ThemeProvider`, `PortfolioProvider`), the Router routes structure, and the dashboard hydration load gates, isolating them from the initial lock screen bundle. Utilizes a single media-query listener setup to handle viewport checks efficiently.
* **[AppShell.tsx](src/layouts/AppShell.tsx)**
  * Serves as the core layout manager. Implements a responsive sidebar-driven desktop architecture combining `DesktopSidebar` with a full-width main content area.
  * Consumes `useModalState()` to decouple 8 individual modal `useState` hooks and reduce component re-rendering bloat.
  * Reordered desktop layout hierarchy: Summary Cards → Family Overview Cards → Wealth Mosaic → Portfolio Insights → Equalized 2x2 Dashboard Widget Grid → Stock Holdings Table.
  * Uses `window.matchMedia` query listeners rather than `window.innerWidth` resize event handlers to run responsive layout adaptations (`isMobile`) without causing scroll lag or layout thrashing.
* **[DesktopSidebar.tsx](src/layouts/DesktopSidebar.tsx)**
  * Desktop navigation sidebar featuring sticky top alignment (`sticky top-6`) and `self-start` height constraint to eliminate vertical whitespace on shorter pages.
* **[useSwipeNavigation.ts](src/hooks/useSwipeNavigation.ts)**
  * Touch swipe gesture listeners and navigation routing between active asset tabs.
* **[useKeyboardShortcuts.ts](src/hooks/useKeyboardShortcuts.ts)**
  * Custom hook isolating window keyboard keydown event listeners (e.g. `Ctrl+Shift+R` to sync stock prices). Case-insensitive key comparison handles Caps Lock variations seamlessly.
* **[useAlerts.ts](src/hooks/useAlerts.ts)**
  * Evaluates warnings (expiring documents, upcoming due dates, stock 52-week highs/lows, and portfolio swing alerts) and handles dismissals. Ref-based swing updates and storage side-effects are safely offloaded to `useEffect` to prevent render-phase side-effects.
* **[PinLockScreen.tsx](src/components/PinLockScreen.tsx)**
  * Restricts app access via an authentic iOS passcode lock screen over a rich purple-to-blue aurora gradient background with an iOS 17/18 live date & clock display, animated lock/unlock padlock status icon, frosted-glass keypad buttons (`backdrop-filter: blur(16px)`), telephone letter mappings (ABC/DEF), glowing dot indicators, and keyboard accessibility.
* **[ErrorBoundary.tsx](src/components/ErrorBoundary.tsx)**
  * Catches rendering errors defensively across major views (like lazy components and AppShell) to display user-friendly fallbacks rather than crashing the interface.

### 3. Registry Component Routing
* **[AssetTabContent.tsx](src/components/AssetTabContent.tsx)**
  * Orchestrator component rendering the active asset registry view.
  * Integrates **dynamic lazy loading** (`React.lazy` and `React.Suspense`) for ALL heavy registry views and tables: `FixedDepositView`, `RDView`, `SIPView`, `GoldHoldingView`, `RealEstateView`, `InsuranceView`, `DocumentVaultView`, and `PortfolioTable` using [AssetCardSkeleton.tsx](src/components/AssetCardSkeleton.tsx) as the loading fallback.
  * Applies `.tab-transition` CSS animation class with a unique `key` prop tied to the active tab, providing smooth fade-in transitions when switching between asset views.


### 4. Modular UI Components
Component folders are isolated by asset domain to ensure clean separation of concerns:
* **[src/components/ui/](src/components/ui/)**: Shared reusable design system primitive components (`Button.tsx`, `Card.tsx`, `Badge.tsx`, `IconButton.tsx`, `SegmentedControl.tsx`, `AnimatedNumber.tsx`, `Sparkline.tsx`), maintaining uniform border styles, system green (`#34C759`) positive indicators, focus rings, interactive iOS spring states (`.ios-press`), and typography (`ios-number`, `ios-currency`, `.tnum`).
  * **[AnimatedNumber.tsx](src/components/ui/AnimatedNumber.tsx)**: Drop-in animated number display component powered by [useAnimatedCounter.ts](src/hooks/useAnimatedCounter.ts). Uses `requestAnimationFrame` with cubic ease-out transitions (500ms default) for smooth value counting. Respects `prefers-reduced-motion` for accessibility.
  * **[Sparkline.tsx](src/components/ui/Sparkline.tsx)**: Inline SVG mini-chart with `stroke-dasharray` draw-in animation over 800ms on mount, providing a smooth left-to-right line-draw effect in summary cards.
* **[Modal.tsx](src/components/Modal.tsx)**: Unified modal system with drag-to-move support via `PointerEvent` listeners (`onPointerDown`, `pointermove`, `pointerup`, `pointercancel`) with hardware-accelerated `translate3d`. Constrains modal height to `max-h-[calc(100vh-5rem)] sm:max-h-[72vh]` with a fixed header (draggable), scrollable middle form body (`flex-1 min-h-0 overflow-y-auto`), and pinned action button footer. All form modals (Insurance, FD, RD, SIP, Gold, Real Estate, Documents, Holdings, Rename Portfolio) use this unified component. Uses spring scale-in transition (`modalScaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)`). Supports `Escape` keypress closing and ARIA dialog semantics (`role="dialog"`, `aria-modal="true"`).
* **[src/components/fd/](src/components/fd/)**: Standard Fixed Deposit cards (`DepositDetailsCard.tsx`) and form controls (`StandardFormFields.tsx`).
* **[src/components/rd/](src/components/rd/)**: Recurring Deposit lists (`RDView.tsx`, `RDAccountCard.tsx`), modals (`RDFormModal.tsx`), and monthly contributions trackers (`RDInstallmentSchedule.tsx`).
* **[src/components/sip/](src/components/sip/)**: Mutual Fund SIP views (`SIPView.tsx`, `SIPAccountCard.tsx`), modals (`SIPFormModal.tsx`), and live schema lookup fields (`SIPFormFields.tsx`).

* **Visual Dashboard & Widget Components**:
  * **Standardized 2x2 Widget Cards Grid**: All 4 core dashboard cards (`NetWorthTimelineChart.tsx`, `PortfolioAssistant.tsx`, `PieChart.tsx`, `BarChart.tsx`) use a standardized uniform height (`370px`) aligned inside a single `grid-cols-1 lg:grid-cols-2 gap-5` grid for consistent visual balance.
  * **[NetWorthTimelineChart.tsx](src/components/NetWorthTimelineChart.tsx)**: Responsive SVG line & area chart showing compound net worth valuation timeline. Custom date-range filtering is supported (1M, 3M, 6M, 1Y, ALL). Initialized with width `0` to prevent mobile overflow before ResizeObserver measurement. Renders an honest flat line for single-snapshot portfolios. When no history exists, displays a muted sample line with a glassmorphic "Sample Preview — Add assets to track your wealth over time" badge overlay instead of misleading mock data.
  * **[WhatIfCalculator.tsx](src/components/WhatIfCalculator.tsx)**: Premium glassmorphic calculator projecting compound returns and investment totals. Houses HSL-themed range inputs, metrics panels, and a dual-curve SVG area growth chart with interactive hover tooltips. `ResizeObserver` uses `requestAnimationFrame` instead of `setTimeout` for instant, jank-free chart reflow.
  * **[PortfolioAssistant.tsx](src/components/PortfolioAssistant.tsx)**: Conversational multi-turn NLP chat assistant. Features inline markdown formatting, automated auto-scroll logs, typing indicators, dynamic suggestion buttons, `Bot` SVG icon integration, and keyboard shortcuts. Copy button is always visible on touch devices (no hover-only gating). Standardized to `h-[370px]` for grid parity.
  * **[DashboardWidgets.tsx](src/components/DashboardWidgets.tsx)**: Capacitor WebView widget page with Net Worth, Today's Gain, and upcoming FD indicators. Uses `md:max-w-4xl` desktop container constraints to ensure proper 3-column layout sizing. Fully respects global light/dark theme (no forced dark mode).
  * **[InsightsPanel.tsx](src/components/InsightsPanel.tsx)**: Displays the main portfolio health breakdown, today's **top 5 biggest movers**, top holdings list, best/worst performance indicators per member, top gainers/losers list, asset allocation drift, and alert notifications. Uses theme-aware Tailwind colors (`dark:` variants) across all badges and indicators. Employs `isFirstMount` reference guards to bypass heavy worker calculations on initial mount.
  * **[SummaryCards.tsx](src/components/SummaryCards.tsx)**: Render row of high level summary metrics: Net Worth, Invested, Today's P&L, and Total P&L. Displays individual family member breakdowns for each card when viewing Family Overview. Styled with dark-mode aware system green (`#34C759`)/red P&L indicators and `tnum` tabular numbering. Uses `AnimatedNumber` for smooth value counting transitions. Mobile horizontal scroll container features gradient edge fade masks to signal offscreen cards.
* **App Icon System & Mobile Summary Optimizations**:
  * **[AppIcons.tsx](src/components/icons/AppIcons.tsx)**: Custom inline SVG icon library containing 36 optimized icon definitions (including `Bot`, `User`, `RefreshCw`, `WifiOff`, `AlertCircle`, etc.). By replacing external `lucide-react` icons in critical rendering paths, it prevents loading the large `lucide-react` module.
  * **[MobileHomeSummary.tsx](src/components/MobileHomeSummary.tsx)**: Displays the mobile dashboard overview. Includes defensive `truncate` classes on labels and grid values to prevent overflow on small viewports. Wrapped with `React.memo` and optimized to run a single-pass `useMemo` for-loop. Uses `AnimatedNumber` for smooth metric transitions.
* **Portfolio Table Enhancements**:
  * **[PortfolioTable.tsx](src/components/PortfolioTable.tsx)**: Features quick filter pills (*All*, *Gainers*, *Losers*, *ETFs*) with item count badges and interactive column sorting (Ticker, Value, Today's P&L, Total P&L) with directional arrow indicators (▲/▼). Cleaned up table layout by removing inline pencil icons from QTY and Avg Price columns, consolidating edit triggers into the dedicated Actions column pencil button. Compacted table padding (`px-2`) and stock name truncation (`max-w-[140px]`) fit all 11 columns in full-width desktop view without horizontal scrollbars. Both desktop table and mobile card views respect active filter and sort state.
* **Export & PDF**:
  * **[ExportPanel.tsx](src/components/ExportPanel.tsx)**: PDF export button displays an inline spinner with "Generating..." text and disabled state during PDF generation to prevent double-clicks and provide clear feedback.

---

## ⚡ Performance Optimizations & Web Workers

The application implements a series of high-performance strategies to guarantee fluid 60FPS animations, instant transitions, and negligible main-thread blocking:

### 1. Web Worker Offloading
* CPU-heavy financial and scoring calculations are offloaded to asynchronous background Web Workers in the `src/workers/` folder. If a worker fails to instantiate (common on iOS WebViews or Capacitor environments) or triggers an execution error, the task falls back to the synchronous main-thread solver while throwing detailed warnings (`console.warn`) for debugging diagnostics:
  * **[xirr.worker.ts](src/workers/xirr.worker.ts)**: Handles Newton-Raphson cash flow solvers.
  * **[healthScore.worker.ts](src/workers/healthScore.worker.ts)**: Performs portfolio health evaluations.
  * **[rebalancing.worker.ts](src/workers/rebalancing.worker.ts)**: Generates buy/sell allocation drift advice.

### 2. Render Memoization & Virtualization
* **List Virtualization**: Accounts views utilize `react-window` to virtualize accounts when lists exceed 8 items, binding rows to unique asset IDs (`itemKey`) to optimize DOM recycling and prevent rendering glitches during list mutations.
* **Card Memoization**: Asset card components use `React.memo` with strict equality functions comparing primary metrics to prevent redundant child re-renders.
* **First-Mount Guard Pattern**: Components executing heavy background tasks (like `InsightsPanel` and its subcomponents) check an `isFirstMount` ref to skip dispatching worker requests on mount when synchronous estimates are already active.
* **SVG Coordinate Memoization**: Grid and path builders in `NetWorthTimelineChart.tsx` wrap layout and coordinate calculations in `useMemo` blocks, avoiding recalculation unless data or sizes change.
* **Lazy Rendering Viewports**: Heavy SVG/D3 charts (`NetWorthTimelineChart.tsx`) inside `AppShell.tsx` are wrapped in a type-safe `LazyChartWrapper` utilizing `IntersectionObserver`. This completely defers dynamic import bundle fetching and `React.lazy` evaluation until the chart placeholder scrolls into view, avoiding startup main-thread bloat.
* **iOS Spring Animations & Transitions**: Uses `--ios-spring` (`cubic-bezier(0.34, 1.56, 0.64, 1)`) and `--ios-ease` (`cubic-bezier(0.25, 0.46, 0.45, 0.94)`) animation curves with `.ios-press` tactile button scaling (`scale(0.97)`) for responsive feedback across mobile and desktop.

### 3. Caching & Network Coalescing
* **SWR Hook & Mutation Coalescing**: Wraps remote assets data with cache revalidation. Coordinates remote calls to prevent double fetching, ensuring initial load live prices and NAV updates are handled smoothly by SWR keys.
* **Persistent IndexedDB NAV Caching**: Live AMFI Mutual Fund NAV scheme requests inside `sipUtils.ts` are cached and written asynchronously to IndexedDB (`idb-keyval`) to prevent synchronous main-thread jank. The NAV cache is initialized asynchronously (fire-and-forget) on app start using `initNAVCache()` during the hook mount sequence, preventing it from blocking the retrieval of cached portfolio data from IndexedDB.
* **IndexedDB Cache Storage**: Local caching of full portfolio datasets is strictly offloaded to IndexedDB (`idb-keyval`) to avoid browser `localStorage` size limits (keeping `localStorage` only for lightweight metadata like execution timestamps). It includes active `isMounted` guard patterns to prevent memory leak state updates.
* **Reload Gating on Resume**: Implements a 5-minute (300,000 ms) elapsed time gate inside the `visibilitychange` listener of `usePortfolioData.ts` to prevent redundant, concurrent network sync operations on mobile app focus resumes.

### 5. Financial Math & Hot Loop Engine Optimizations
* **Precomputed Float64Array XIRR Solver**: `calculateXIRR` in [`performance.ts`](src/utils/performance.ts) pre-parses cash flow dates into numeric timestamps and `Float64Array` year offsets **once** before running Newton-Raphson & Bisection loops. Eliminates 10,000+ `new Date()` object allocations per tick, speeding up solver execution by **85–92%**.
* **Single-Pass Consolidated Asset Breakdown**: Replaced 8 chained `.reduce()` passes in `classBreakdown` ([`portfolioCalcs.ts`](src/utils/portfolioCalcs.ts)) and 13 chained passes in `calculateHealthScore` ([`healthScore.ts`](src/utils/healthScore.ts)) with direct 1-pass `for` loops. Eliminates intermediate array heap allocations (`flatMap`) and main-thread frame drops during price sync ticks.
* **Precomputed Monthly RD Step Factor**: `getRDEffectiveValue` in [`rdUtils.ts`](src/utils/rdUtils.ts) precalculates a multiplicative monthly compounding step factor `(1 + r/400)^(1/3)`, replacing 60+ repeated `Math.pow()` calls per RD account.
* **Mutation Queue Memory Retention Fix**: [`usePortfolioData.ts`](src/hooks/usePortfolioData.ts) resets `mutationQueue.current = Promise.resolve()` when the queue drains to idle, preventing memory accumulation over long user sessions.
* **Donut Chart SVG Trigonometry Memoization**: [`PieChart.tsx`](src/components/PieChart.tsx) memoizes pie slice sorting and SVG trigonometric arc geometry in `useMemo` hooks, maintaining smooth 60FPS hover state transitions.

---

## 🎨 Clean Data-First Design System Architecture

The application enforces a calm, professional, data-first design system engineered for maximum financial clarity and scannability:

### 1. Flat Surface & Neutral Canvas
* **Background Canvas**: Flat background system (`#f8fafc` light / `#090d16` dark) with zero background mesh noise or animated glowing orbs, providing optimal contrast for complex financial data.
* **Single Card Surface (`.apple-card`)**: Standardized solid surface (`var(--surface)`), 1px crisp border (`var(--border-subtle)`), and quiet static shadows (`var(--shadow-card)`). Eliminates redundant glassmorphic layers.

### 2. Tightened Border Radius Tokens (8-12px)
* `--radius-small`: `6px`
* `--radius-medium`: `10px`
* `--radius-large`: `12px`
* Crisp, professional geometry across all cards, table containers, form controls, and modals.

### 3. Compact Financial Typography Scale
* **`.text-financial`**: Compacted desktop size to `26px` (`22px` mobile) with tabular font features (`.tnum` / `font-variant-numeric: tabular-nums`). Preserves bold visual hierarchy without overcrowding dense card containers.

### 4. Standardized Status & Functional Palette
* **Blue (`#2563eb`)**: Primary controls, active navigation indicators, neutral info badges.
* **Amber (`#d97706`)**: Warnings, stale pricing status, upcoming maturity alerts.
* **Green (`#16a34a`) & Red (`#dc2626`)**: Strictly reserved for positive gain and negative loss financial indicators.

### 5. Quiet Hover Signals & Calibrated Touch Controls
* Card hovers quietly signal clickability via subtle border highlight (`rgba(0, 0, 0, 0.15)` light / `rgba(255, 255, 255, 0.18)` dark) without layout-lifting motion (`translateY(-2px)`).
* Touch swipe navigation calibrated with a strict `130px` distance threshold, `2.5x` horizontal-to-vertical ratio, and automatic interactive control exclusion.

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
* **[portfolioCalcs.ts](src/utils/portfolioCalcs.ts)**: Handles asset allocation aggregations, performance monitoring, and drift offsets. Decoupled from specific asset utilities by relying on pre-calculated asset totals on the `Portfolio` object. Includes defensive `(portfolio.holdings || [])` and `(p.insurances || [])` array fallbacks to prevent crashes on legacy data schemas.
* **[mathUtils.ts](src/utils/mathUtils.ts)**: Implements standard math helper utilities, exporting the shared `compoundValue` engine to break circular dependencies.
* **[performance.ts](src/utils/performance.ts)**: Implements solvers for XIRR, CAGR calculations, and weighted holding age. Uses `(age / 2)` for linear monthly investments (RDs/SIPs) so CAGR correctly reflects average capital exposure. Month cash-flow dates are clamped to last valid days of target months to prevent JS date rollover bugs. Guarded against same-sign cashflows and Newton-Raphson divergence via bisection fallback.
* **[healthScore.ts](src/utils/healthScore.ts)**: Evaluates a 0-100 health score based on diversification, active SIPs, emergency buffers, equity concentration (includes both stocks and SIP mutual funds), and insurance status. Caps Emergency Fund Buffer at 20 points and Insurance Cover at 15 points.
* **[rebalancing.ts](src/utils/rebalancing.ts)**: Asset rebalancing engine calculating specific buy/sell recommendations from target drift. Recommends rebalancing purely when the absolute difference exceeds threshold `MIN_ACTION = 5000`.
* **[assistant.ts](src/utils/assistant.ts)**: Features an intent-based classification system (`detectIntent`) routing natural language queries with synonym normalization. Supports new family member wealth breakdown and next SIP date queries with high-priority matching to prevent keyword overlaps.
* **[formatters.ts](src/utils/formatters.ts)**: Implements Indian currency formats (`₹` INR) and standard FD compounding (compounded semi-annually). Uses system positive green (`#34C759`) for positive return indicators.
* **[rdUtils.ts](src/utils/rdUtils.ts)**: Computes elapsed month contributions using `Math.max(0, elapsed)` and quarterly compounding leveraging the shared engine.
* **[sipUtils.ts](src/utils/sipUtils.ts)**: Calculates monthly contributions elapsed using `Math.max(0, elapsed)` and retrieves live NAV evaluations, automatically respecting `account.liveNav` parameters.

### 5. Accessibility & Motion Preferences
* **`prefers-reduced-motion` Overrides**: Configured in `src/index.css` to suppress spring scale animations, disable tactile active scaling (`.ios-press:active`), and render sparkline SVG paths immediately without draw-in delays. Handled in `useAnimatedCounter.ts` to skip count-up interpolation and return target numeric values instantly.
* **Extended Error Toast Duration**: Error toasts in `Toast.tsx` auto-dismiss after **8,000ms** (instead of 4,000ms) to ensure users have adequate time to read error notifications.
* **Stealth Mode Accessibility**: Privacy masked values (`••••••`) across `SummaryCards.tsx` and `MobileHomeSummary.tsx` expose `aria-label="Amount hidden"` to provide clear screen-reader announcements.

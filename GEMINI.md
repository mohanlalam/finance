# 💼 Family Portfolio Tracker — GEMINI.md (Project Architecture)

This document provides a high-level overview of the folder structure, data flow, state management, database mappings, and performance optimizations of the Family Portfolio Tracker application. It is designed to help developers and AI agents navigate the codebase efficiently.

---

## 📁 Key File Structures & Domains

### 1. State Management & Shared Custom Hooks
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
  * Connects to Supabase Edge Functions via [apiClient.ts](src/utils/apiClient.ts) with SHA-256 PIN hash caching (`_cachedPinHash`).
* **[useIsMobile.ts](src/hooks/useIsMobile.ts)**
  * Centralized reactive hook for mobile viewport checking (`window.matchMedia('(max-width: 767px)')`). Prevents layout thrashing by eliminating repeated `window.innerWidth` reads across components.
* **[useAssetModal.ts](src/hooks/useAssetModal.ts)**
  * Generic reusable hook encapsulating modal visibility, editing item state (`editingItem`), delete confirmation target (`confirmDeleteItem`), and auto-open quick-add triggers. Used across Gold, Real Estate, Insurance, and FD views to eliminate ~30 lines of boilerplate per view.
* **[useAssetFilterSort.ts](src/hooks/useAssetFilterSort.ts)**
  * Standardized client-side filtering and multi-field sorting hook for asset registries. Supports query search matching and sort directions.
* **[useModalState.ts](src/hooks/useModalState.ts)**
  * Dedicated custom hook encapsulating all modal visibility and target state (`quickAddTarget`, `showAddModal`, `showAddFamily`, `renameTarget`, `deleteTarget`, `isDeleting`, `showMobileAlerts`, `showChangePinModal`).
  * Computes aggregate `isAnyModalOpen` boolean flag to gate Floating Add Button (`FloatingAddMenu`) visibility.
* **[ToastContext.tsx](src/contexts/ToastContext.tsx)**
  * Exposes global toast/snackbar notifications state (`useToast`) and auto-dismissals, entirely replacing raw browser `alert()` popups across the app.


### 2. App Shell & Navigation Router
* **[App.tsx](src/App.tsx)**
  * Lightweight entry gate. Renders `PinLockScreen` from a clean, provider-free chunk. Once unlocked, dynamically imports and mounts `MainApp` using `React.lazy`.
* **[MainApp.tsx](src/MainApp.tsx)**
  * Hosts context providers (`ThemeProvider`, `PortfolioProvider`), Router structure, and dashboard load gates.
* **[AppShell.tsx](src/layouts/AppShell.tsx)**
  * Core responsive layout manager combining `DesktopSidebar` with main content area.
  * Consumes `useIsMobile()` for viewport checks and `useModalState()` to decouple modal visibility state.
  * Lazy-loads heavy action modals (`AddHoldingModal`, `AddFamilyModal`, `RenamePortfolioModal`, `ChangePinModal`) with `React.lazy` and `Suspense`, shrinking initial entry bundle size.
* **[DesktopSidebar.tsx](src/layouts/DesktopSidebar.tsx)**
  * Desktop navigation sidebar featuring sticky top alignment (`sticky top-6`) and `self-start` height constraint.
* **[PinLockScreen.tsx](src/components/PinLockScreen.tsx)**
  * Restricts app access via passcode lock screen over purple-to-blue aurora gradient background with live clock display and frosted glass buttons.


### 3. Registry Component Routing & Modular Views
* **[AssetTabContent.tsx](src/components/AssetTabContent.tsx)**
  * Orchestrator component rendering the active asset registry view.
  * Integrates **dynamic lazy loading** (`React.lazy` and `React.Suspense`) for ALL registry views and tables: `FixedDepositView`, `RDView`, `SIPView`, `GoldHoldingView`, `RealEstateView`, `InsuranceView`, `DocumentVaultView`, and `PortfolioTable` using [AssetCardSkeleton.tsx](src/components/AssetCardSkeleton.tsx) as the loading fallback.
  * Applies `.tab-transition` CSS animation class with a unique `key` prop tied to the active tab.

* **Modular Domain Components**:
  * **[src/components/ui/AssetRegistryContainer.tsx](src/components/ui/AssetRegistryContainer.tsx)**: Standardized shell for asset registry headers, add buttons, `<AssetCardSkeleton>` loading fallbacks, and `<EmptyState>` placeholders.
  * **[src/components/gold/](src/components/gold/)**: Standalone `GoldHoldingCard.tsx` and `GoldFormModal.tsx`.
  * **[src/components/realestate/](src/components/realestate/)**: Standalone `RealEstateCard.tsx` and `RealEstateFormModal.tsx`.
  * **[src/components/insurance/](src/components/insurance/)**: Standalone `InsurancePolicyCard.tsx` and `InsuranceFormModal.tsx`.
  * **[src/components/fd/](src/components/fd/)**: Standalone `DepositDetailsCard.tsx`, `FDFormModal.tsx`, and `StandardFormFields.tsx`.
  * **[src/components/rd/](src/components/rd/)**: `RDView.tsx`, `RDAccountCard.tsx`, `RDFormModal.tsx`, and `RDInstallmentSchedule.tsx`.
  * **[src/components/sip/](src/components/sip/)**: `SIPView.tsx`, `SIPAccountCard.tsx`, `SIPFormModal.tsx`, and `SIPFormFields.tsx`.


### 4. UI Dashboard & Widget Performance
* **Single-Pass Responsive Table**:
  * **[PortfolioTable.tsx](src/components/PortfolioTable.tsx)**: Replaced parallel dual-layout DOM rendering (`md:hidden` vs `hidden md:block`) with single-pass conditional view rendering (`isMobile ? ... : ...`) using `useIsMobile()`, cutting mounted DOM node count by 50%.
* **Quick Access Navigation Bar**:
  * **[QuickAccessShortcuts.tsx](src/components/ui/QuickAccessShortcuts.tsx)**: Inline navigation panel containing quick jump shortcuts for all 10 asset categories and calculators, directly linked to offset-controlled anchor scrolling.
* **Visual Dashboard Grid**:
  * **Standardized 2x2 Widget Cards Grid**: Core dashboard cards (`NetWorthTimelineChart.tsx`, `PortfolioAssistant.tsx`, `PieChart.tsx`, `BarChart.tsx`) use a uniform height (`370px`) inside a `grid-cols-1 lg:grid-cols-2 gap-5` grid.
  * **[NetWorthTimelineChart.tsx](src/components/NetWorthTimelineChart.tsx)**: Responsive SVG area chart with date-range filtering (1M, 3M, 6M, 1Y, ALL). Uses `requestAnimationFrame` inside `ResizeObserver` for instant, jank-free chart reflow.
  * **[PortfolioAssistant.tsx](src/components/PortfolioAssistant.tsx)**: Conversational NLP assistant with memoized `ChatMessageItem` component to stop user query typing from re-parsing markdown across chat transcript history.
  * **[InsightsPanel.tsx](src/components/InsightsPanel.tsx)**: Displays top 5 movers, top holdings by value, best/worst performance indicators, top gainers/losers, and upcoming deposit maturities & insurance renewal notifications.

---

## ⚡ Performance Optimizations & Web Workers

The application implements a series of high-performance strategies to guarantee fluid 60FPS animations, instant transitions, and minimal main-thread blocking:

### 1. Persistent Web Worker Singletons
* CPU-heavy financial calculations are offloaded to Vite-compatible background Web Workers using persistent lazy singletons. Eliminates 15–40ms thread instantiation overhead per calculation tick:
  * **[xirr.worker.ts](src/workers/xirr.worker.ts)**: Handles Newton-Raphson cash flow solvers (`runXIRRAsync` in [`performance.ts`](src/utils/performance.ts)).

### 2. Render Memoization & Virtualization
* **List Virtualization**: Registry views (`FixedDepositView`, `GoldHoldingView`, `RealEstateView`, `InsuranceView`) utilize `react-window` to virtualize accounts when lists grow, binding rows to unique asset IDs to optimize DOM recycling.
* **Card Memoization**: Asset card components (`GoldHoldingCard`, `RealEstateCard`, `InsurancePolicyCard`, `DepositDetailsCard`, `ChatMessageItem`) use `React.memo` with strict equality functions comparing primary metrics to prevent redundant child re-renders.
* **Single-Pass Viewport Selection**: Components condition layout branches using `useIsMobile()` to avoid creating hidden desktop/mobile duplicate DOM subtrees.

---

## 🎨 Clean Data-First Design System Architecture (Zerodha Kite & Apple Hybrid)

* **Flat Neutral Canvas**: Standardized `#f8fafc` light / `#090d16` dark background system.
* **Zerodha Kite Signature Palette**: Non-glaring, professional financial tokens: Kite Blue (`#387ed1`), clean profit green (`#00b074`), and clean loss red (`#df514c`).
* **High-Density Holdings Ribbon**: Horizontal overview strip (*Holdings count, Total inv., Current val., Overall P&L, Day's P&L*) above asset tables.
* **Hover-Activated Action Dock**: Row action buttons quietly hidden at rest and revealed on desktop hover (`group-hover:opacity-100`) for zero visual distraction.
* **Single Card Surface (`.apple-card`)**: Solid surface (`var(--surface)`), 1px crisp border (`var(--border-subtle)`), and quiet static shadows (`var(--shadow-card)`).
* **Tactile Spring Feedback**: Unified `.ios-press` tactile transition scaling triggers (`active:scale(0.97)`).
* **Color System Extension**: Soft-tint variable tokens (`--positive-soft`, `--negative-soft`, `--warning-soft`, `--accent-blue-soft`, and `--backdrop-overlay` backdrop filters) mapped dynamically for dark mode.
* **Tightened Border Radius Tokens**: `--radius-small` (`6px`), `--radius-medium` (`10px`), `--radius-large` (`12px`).
* **Compact Financial Typography**: `.text-financial` with tabular font features (`.tnum`).

---

## 💾 Database Schema & Table Mappings

Every deposit registry maps to its own separate database table:

| Asset Tab / UI Mode | Supabase PostgreSQL Table | Core Compounding / Valuation Rule |
| :--- | :--- | :--- |
| **Fixed Deposit (FD)** | `fixed_deposits` | Half-yearly compounding (FD interest rates) |
| **Recurring Deposit (RD)** | `rd_accounts` | Quarterly compounding + Contribution dates array |
| **SIP Mutual Fund (SIP)** | `sip_accounts` | Live AMFI NAV scheme price multiplication |
| **Gold Holding** | `gold_holdings` | Gram weight × purchase/live gold rate |
| **Real Estate** | `real_estate` | Current valuation + rental income yield |
| **Insurance** | `insurances` | Sum assured + premium renewal warning tracking |
| **Document Vault** | `documents` | Expiry tracking + asset reference linking |

---

## 🧮 Calculations & Formatters
* **[portfolioCalcs.ts](src/utils/portfolioCalcs.ts)**: Single-pass `for` loop portfolio totals aggregator.
* **[performance.ts](src/utils/performance.ts)**: Newton-Raphson XIRR solver with `Float64Array` year offsets and persistent Web Worker singleton.
* **[assistant.ts](src/utils/assistant.ts)**: Intent-based NLP query classification system.
* **[formatters.ts](src/utils/formatters.ts)**: Indian currency formatters (`formatINR`) and date helpers.

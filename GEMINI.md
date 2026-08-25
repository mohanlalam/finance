# 💼 Family Portfolio Tracker — GEMINI.md (Project Architecture)

This document provides a high-level overview of the folder structure, clean architecture boundaries, domain/infrastructure data flow, state management, database mappings, and performance optimizations of the Family Portfolio Tracker application. It is designed to help developers and AI agents navigate the codebase efficiently.

> ⚠️ **Design Token Rule**: [`UI.md`](UI.md) is the single authoritative source of truth for all visual tokens. Never introduce a new color hex, corner radius, shadow, or typography token in code or docs without first declaring it in `UI.md §2` and `src/index.css`.

---

## 🏛️ Clean Architecture & Dependency Direction

The codebase follows strict Dependency Inversion and Domain-Driven design boundaries:

```text
UI Layer (Components / Views / Cards / Modals)
  ↓
Domain Hooks & Controllers (usePortfolioQuery, usePortfolioMutation, usePortfolioRefresh, usePortfolioSync)
  ↓
Domain Services & Calculations (portfolioService, portfolioCalculationService, Pure Financial Math)
  ↓
Repository Interfaces (IPortfolioRepository, IFDRepository, IRDRepository, ISIPRepository, etc.)
  ↓
Infrastructure Implementations (Supabase, SWR, IndexedDB, Web Workers, Market Data Providers)
  ↓
External APIs & Databases (PostgreSQL, Supabase Functions, Yahoo Finance, AMFI, MCX Bullion)
```

### Strict Boundary Rules:
1. **`src/shared/`**: Common utilities, error hierarchy (`AppError`), constants, and design primitives. Has ZERO dependencies on domain logic or infrastructure.
2. **`src/domains/`**: Business entities, pure financial calculations, repository contracts, and domain services. Pure calculation functions have zero dependencies on React, Supabase, IndexedDB, or DOM APIs.
3. **`src/infrastructure/`**: Concrete implementations of repository interfaces (Supabase, IndexedDB offline cache, SWR, Web Workers, Market Data providers).
4. **`src/app/` / UI**: Presentation layer consuming domain state through domain hooks and triggering actions via domain services.

---

## 📁 Key File Structures & Domains

### 1. State Management, Domain Services & Shared Custom Hooks
* **[src/contexts/PortfolioContext.tsx](src/contexts/PortfolioContext.tsx)**
  * Fine-grained Context split: `PortfolioEntitiesContext` (portfolios, active tabs, net worth history), `PortfolioStatusContext` (load/price statuses, cached timestamps, staleness flags, mutation lock), and `PortfolioActionContext` (CRUD action triggers).
  * Exposes `usePortfolioEntities()`, `usePortfolioStatus()`, `usePortfolioState()`, and `usePortfolioActions()` hooks separately to prevent form modals and write-only components from re-rendering during data/price ticks.
* **Domain Hooks (`src/domains/portfolio/hooks/`)**:
  * **[usePortfolioQuery.ts](src/domains/portfolio/hooks/usePortfolioQuery.ts)**: SWR data loading + instant IndexedDB cache hydration.
  * **[usePortfolioMutation.ts](src/domains/portfolio/hooks/usePortfolioMutation.ts)**: Serialized CRUD mutations with automatic cache invalidation and error propagation.
  * **[usePortfolioRefresh.ts](src/domains/portfolio/hooks/usePortfolioRefresh.ts)**: Live quote polling and document `visibilitychange` resume triggers.
  * **[usePortfolioSync.ts](src/domains/portfolio/hooks/usePortfolioSync.ts)**: Mutex-based concurrency guard preventing UI collisions during rapid user inputs.
  * **[usePortfolioState.ts](src/domains/portfolio/hooks/usePortfolioState.ts)**: Composite domain hook uniting query, mutation, refresh, and sync.
  * **[usePortfolioData.ts](src/hooks/usePortfolioData.ts)**: Backward-compatible facade delegating directly to `usePortfolioState.ts`.
* **Domain Services (`src/domains/portfolio/services/`)**:
  * **[portfolioService.ts](src/domains/portfolio/services/portfolioService.ts)**: Handles high-level portfolio lifecycle, repository interactions, and offline cache synchronization.
  * **[portfolioCalculationService.ts](src/domains/portfolio/services/portfolioCalculationService.ts)**: Memoized recalculation of asset totals, live equity price updates, and AMFI mutual fund NAV ticks.
  * **[portfolioSyncService.ts](src/domains/portfolio/services/portfolioSyncService.ts)**: Serialized mutation queue mutex.
* **Shared Interactive Hooks**:
  * **[useIsMobile.ts](src/hooks/useIsMobile.ts)**: Centralized reactive hook for mobile viewport checking (`window.matchMedia('(max-width: 767px)')`). Prevents layout thrashing by eliminating repeated `window.innerWidth` reads across components.
  * **[useAssetModal.ts](src/hooks/useAssetModal.ts)**: Generic reusable hook encapsulating modal visibility, editing item state (`editingItem`), delete confirmation target (`confirmDeleteItem`), and auto-open quick-add triggers.
  * **[useAssetFilterSort.ts](src/hooks/useAssetFilterSort.ts)**: Standardized client-side filtering and multi-field sorting hook for asset registries.
  * **[useModalState.ts](src/hooks/useModalState.ts)**: Custom hook encapsulating modal visibility state (`quickAddTarget`, `showAddModal`, `showAddFamily`, `renameTarget`, `deleteTarget`, etc.) and computing `isAnyModalOpen` to control floating action buttons.
  * **[useLongPress.ts](src/hooks/useLongPress.ts)**, **[useSwipeNavigation.ts](src/hooks/useSwipeNavigation.ts)**, **[usePullToRefresh.ts](src/hooks/usePullToRefresh.ts)**: Mobile gesture and tactile interaction suite.

---

### 2. Infrastructure & Repository Layer

* **Supabase Repositories (`src/infrastructure/supabase/repositories/`)**:
  * **[SupabasePortfolioRepository.ts](src/infrastructure/supabase/repositories/SupabasePortfolioRepository.ts)**: Implements `IPortfolioRepository` for complete family portfolio data retrieval and CRUD mutations via Edge Functions.
  * Concrete repositories for FD, RD, SIP, Gold, Real Estate, Insurance, and Documents.
* **Cache Infrastructure (`src/infrastructure/cache/`)**:
  * **[indexedDbCache.ts](src/infrastructure/cache/indexedDbCache.ts)**: Safe IndexedDB wrapper (`idb-keyval`) with memory fallback for non-browser/test environments.
  * **[portfolioCache.ts](src/infrastructure/cache/portfolioCache.ts)**: Offline portfolio payload cache persistence and cache invalidation.
  * **[swrConfig.ts](src/infrastructure/cache/swrConfig.ts)**: Global SWR deduplication and retry configurations.
* **Market Data Infrastructure (`src/infrastructure/market-data/`)**:
  * **[marketDataService.ts](src/infrastructure/market-data/marketDataService.ts)**: Unified facade coordinating multi-provider quote lookups, caching, and fallback resolution.
  * **[providers/yahooProvider.ts](src/infrastructure/market-data/providers/yahooProvider.ts)**: Yahoo Finance equity quote fetcher via Edge Function.
  * **[providers/amfiProvider.ts](src/infrastructure/market-data/providers/amfiProvider.ts)**: AMFI India mutual fund daily NAV fetcher.
  * **[providers/mcxProvider.ts](src/infrastructure/market-data/providers/mcxProvider.ts)**: Real-time MCX & IBJA bullion spot rate provider.
  * **[marketDataCache.ts](src/infrastructure/market-data/marketDataCache.ts)**: High-speed TTL in-memory market quote cache.
* **Workers & Storage**:
  * **[src/infrastructure/workers/](src/infrastructure/workers/)**: `WorkerPool.ts` and `xirr.worker.ts` for off-thread Newton-Raphson cash flow calculations.
  * **[src/infrastructure/storage/](src/infrastructure/storage/)**: Supabase Document Storage with client-side path traversal protection and secure Edge Function routing.
  * **[src/infrastructure/logging/logger.ts](src/infrastructure/logging/logger.ts)**: Lightweight logger with automatic redaction of sensitive credentials (PINs, API keys, tokens).

---

### 3. Pure Calculation Modules

All core financial calculations are pure functions with zero UI or database dependencies:

* **[src/domains/portfolio/calculations/](src/domains/portfolio/calculations/)**:
  * `portfolioTotals.ts`: Single-pass portfolio totals aggregation and Method-B intraday delta calculations.
  * `allocation.ts`: Asset class distribution and percentage breakdowns for visual widgets.
  * `netWorth.ts`: Snapshot formatting and net worth timeline aggregations.
* **[src/domains/performance/calculations/](src/domains/performance/calculations/)**:
  * `xirr.ts`: Pure Newton-Raphson XIRR solver with TypedArray cash flows and bisection fallback.
  * `cagr.ts`: Period-bounded Compound Annual Growth Rate calculator.
  * `returns.ts`: Weighted-age portfolio annualized returns and cash flow extraction.
  * `benchmark.ts`: Nifty 50, Nifty 500, and S&P 500 reference returns.
* **[src/domains/taxation/calculations/](src/domains/taxation/calculations/)**:
  * `taxHarvesting.ts`: Real-time tax loss harvesting opportunity finder distinguishing equity STCG (20%) / LTCG (12.5% over ₹1.25L) from slab-rate debt and gold bullion assets.
  * `capitalGains.ts`: Indian Income Tax FY24-25 capital gains calculations.
  * `financialYear.ts`: Indian fiscal year (Apr 1 - Mar 31) date classification.
* **[src/domains/assets/](src/domains/assets/)**:
  * `fd/calculations/fdCompounding.ts`: Half-yearly / quarterly compound interest maturity solver.
  * `rd/calculations/rdCompounding.ts`: Indian Banking standard quarterly compounding RD valuation.
  * `sip/calculations/sipValuation.ts`: Live AMFI NAV scheme price multiplication and accrued valuations.
  * `gold/calculations/goldValuation.ts`: Bullion weight × 24K spot rate × hallmark purity multiplier (24K, 22K/916, 18K/750, 14K/585).

---

### 4. Supporting Domains (AI, Data Quality, Backup/Restore)

* **[src/domains/data-quality/](src/domains/data-quality/)**:
  * `healthScore.ts`: Health scoring rules engine auditing missing maturity dates, zero valuations, overdue insurance renewals, and missing attachments.
* **[src/domains/ai/](src/domains/ai/)**:
  * `assistant/intentClassifier.ts`: Deterministic intent classification across financial queries.
  * `tools/`: Deterministic domain tools (`portfolioTool`, `performanceTool`, `taxTool`) ensuring financial calculations are strictly reproducible and never hallucinated.
* **[src/domains/portfolio/backup/](src/domains/portfolio/backup/)**:
  * `backupSchema.ts` & `backupValidator.ts`: Schema-enforcing backup and restore diagnostic engine with envelope validation and collision detection.

---

### 5. App Shell, Security Gate & Navigation Router
* **[App.tsx](src/App.tsx)**: Lightweight entry gate. Renders `PinLockScreen` from a clean, provider-free chunk. Once unlocked, dynamically imports and mounts `MainApp` using `React.lazy`. Prefetches `MainApp` during device idle time.
* **[MainApp.tsx](src/MainApp.tsx)**: Hosts context providers (`ThemeProvider`, `PrivacyContext`, `ToastProvider`, `PortfolioProvider`), Router structure, and dashboard load gates.
* **[AppShell.tsx](src/layouts/AppShell.tsx)**: Core responsive layout manager combining `DesktopSidebar` with main content area, idle prefetching, and segmented mobile views (*"📊 Summary & Assets"* vs *"📈 Charts & AI"*).
* **[PinLockScreen.tsx](src/components/PinLockScreen.tsx)** & **[biometrics.ts](src/utils/biometrics.ts)**: Aurora gradient passcode screen with 1-second FaceID / TouchID / Windows Hello platform unlocking and 4-digit PIN fallback with brute-force rate limiting.

---

### 6. Registry Component Routing & Modular Views
* **[AssetTabContent.tsx](src/components/AssetTabContent.tsx)**: Orchestrator component rendering the active asset registry view with dynamic lazy loading (`React.lazy` and `React.Suspense`) for ALL registry views and tables (`FixedDepositView`, `RDView`, `SIPView`, `GoldHoldingView`, `RealEstateView`, `InsuranceView`, `DocumentVaultView`, `TaxHarvestingView`, `PortfolioTable`).
* **Modular Domain Components**:
  * `src/components/ui/AssetRegistryContainer.tsx`: Standardized shell for asset registry headers, add buttons, and loading fallbacks.
  * `src/components/ui/DocumentAttachmentField.tsx`: Document uploader supporting taxonomy tags (`fd_advice`, `policy_schedule`, `title_deed`, `tax_receipt`, `invoice`, `gold_hallmark`, `account_statement`, `general`) with 10MB bounds.
  * `src/components/ExportPanel.tsx`: Unified data export panel (JSON/CSV), schema-validated full restore engine, and print-optimized `@media print` A4 PDF statement generator.
  * `src/components/gold/`: `GoldHoldingView.tsx`, `GoldHoldingCard.tsx`, and `GoldFormModal.tsx`.
  * `src/components/realestate/`: `RealEstateView.tsx`, `RealEstateCard.tsx`, and `RealEstateFormModal.tsx`.
  * `src/components/insurance/`: `InsuranceView.tsx`, `InsurancePolicyCard.tsx`, and `InsuranceFormModal.tsx`.
  * `src/components/fd/`: `FixedDepositView.tsx`, `DepositDetailsCard.tsx`, and `FDFormModal.tsx`.
  * `src/components/rd/`: `RDView.tsx`, `RDAccountCard.tsx`, and `RDFormModal.tsx`.
  * `src/components/sip/`: `SIPView.tsx`, `SIPAccountCard.tsx`, and `SIPFormModal.tsx`.

---

## ⚡ Performance Optimizations & Web Workers

1. **Mobile Offscreen Containment (`content-visibility: auto`)**: Mobile holding cards (`.mobile-asset-card`) apply `content-visibility: auto; contain-intrinsic-size: 0 100px; contain: layout style;` to skip layout and style computation until scrolled into the viewport.
2. **Zero-Latency Touch & GPU Layer Promotion**: Global `touch-action: manipulation` eliminates the 300ms mobile tap delay. Fixed bars (`.mobile-bottom-nav`, `.mobile-status-bar`) promote to GPU compositor layers (`transform: translateZ(0)`).
3. **Idle Chunk Pre-warming**: `requestIdleCallback` pre-warms the top 4 heaviest asset view chunks (`PortfolioTable`, `FixedDepositView`, `SIPView`, `GoldHoldingView`) during device idle time for zero-skeleton tab switching.
4. **Persistent Web Worker Singletons**: `WorkerPool.ts` and `xirr.worker.ts` maintain persistent background worker singletons for instant async Newton-Raphson solvers.
5. **Render Memoization & Virtualization**: Registry tables utilize `react-window` virtualization and `React.memo` with strict equality comparators on card components.
6. **PWA Auto-Update**: Workbox instant takeover (`skipWaiting: true`, `clientsClaim: true`) and document `visibilitychange` update listeners.

---

## 🎨 Clean Data-First Design System Architecture (Zerodha Kite & Apple Hybrid)

> **Single Source of Truth**: All design tokens, canonical hex values, typography scales, and accessibility requirements are authoritatively governed by [`UI.md`](UI.md) (specifically `UI.md §2` and `UI.md §11`) and implemented in `src/index.css`.

* **Flat Neutral Canvas**: Standardized `#f8fafc` light / `#080c14` dark canvas background system.
* **Zerodha Kite Signature Palette**: Canonical financial tokens: Kite Blue (`#387ed1`), clean profit green (`#00b074`), and clean loss red (`#df514c`).
* **High-Density Holdings Ribbon**: Horizontal overview strip (*Holdings count, Total inv., Current val., Overall P&L, Day's P&L*) above asset tables.
* **Hover-Activated Action Dock**: Row action buttons quietly hidden at rest and revealed on desktop hover (`group-hover:opacity-100`).
* **Single Card Surface (`.apple-card`)**: Solid surface (`var(--surface)`), 1px crisp border (`var(--border-subtle)`), and quiet static shadows (`var(--shadow-card)`).
* **Tactile Spring Feedback**: Unified `.ios-press` tactile transition scaling triggers (`active:scale(0.97)`).
* **Accessibility & Measurement Standards**: Enforces WCAG 2.1 contrast ratios (4.5:1 text, 3.0:1 UI) per `UI.md §11`.

---

## 💾 Database Schema & Table Mappings

| Asset Tab / UI Mode | Supabase PostgreSQL Table | Core Compounding / Valuation Rule |
| :--- | :--- | :--- |
| **Fixed Deposit (FD)** | `fixed_deposits` | Half-yearly compounding (FD interest rates) |
| **Recurring Deposit (RD)** | `rd_accounts` | Quarterly compounding + Contribution dates array |
| **SIP Mutual Fund (SIP)** | `sip_accounts` | Live AMFI NAV scheme price multiplication |
| **Gold Holding** | `gold_holdings` | Gram weight × purchase/live MCX gold rate |
| **Real Estate** | `real_estate` | Current valuation + rental income yield |
| **Insurance** | `insurances` | Sum assured + premium renewal warning tracking |
| **Document Vault** | `documents` | Expiry tracking + asset reference linking |
| **Net Worth Snapshot** | `net_worth_history` | Historical daily total and asset-class breakdown |
| **Market Cache** | `market_price_cache` | 2-minute cached Yahoo Finance stock quotes |

---

## 🤖 Workflow Orchestration Rules

1. **Plan Node Default**: Enter plan mode for non-trivial tasks (3+ steps or architectural decisions).
2. **Subagent Strategy**: Offload research and parallel analysis to subagents.
3. **Self-Improvement Loop**: Update `tasks/lessons.md` after any user correction and review at session start.
4. **Verification Before Done**: Run `npm run verify` (`eslint`, `typecheck`, `build`) and `vitest run` before completing tasks.
5. **Demand Elegance**: Avoid hacky fixes; ensure clean boundary adherence and type safety.

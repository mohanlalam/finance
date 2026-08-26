# 💼 Family Portfolio Tracker — GEMINI.md (Project Architecture)

_Last updated: 2026-08-25 — Architecture v2.0 (Clean Architecture & Modular Domains)_

This document provides a high-level overview of the folder structure, clean architecture boundaries, domain/infrastructure data flow, state management, database mappings, error handling, testing strategies, and performance optimizations of the Family Portfolio Tracker application. It is designed to help developers and AI agents navigate the codebase efficiently.

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
Repository Interfaces (IPortfolioRepository)
  ↓
Infrastructure Implementations (Supabase, SWR, IndexedDB, Web Workers, Market Data Providers)
  ↓
External APIs & Databases (PostgreSQL, Supabase Functions, Yahoo Finance, AMFI, MCX Bullion)
```

### Strict Boundary Rules
1. **`src/shared/` & `src/utils/` (Pure Primitives)**: Common utilities, pure financial helpers ([`mathUtils.ts`](src/utils/mathUtils.ts), [`dateUtils.ts`](src/utils/dateUtils.ts)), error hierarchy ([`AppError.ts`](src/shared/errors/AppError.ts)), constants, and design primitives. Pure calculation helpers have ZERO dependencies on React, Supabase, or DOM APIs.
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
  * **[usePortfolioSync.ts](src/domains/portfolio/hooks/usePortfolioSync.ts)**: Reactive React state subscriber hook reading mutex mutation state.
  * **[usePortfolioState.ts](src/domains/portfolio/hooks/usePortfolioState.ts)**: Composite domain hook uniting query, mutation, refresh, and sync.
  * **[usePortfolioData.ts](src/hooks/usePortfolioData.ts)**: Backward-compatible facade delegating directly to `usePortfolioState.ts`.
* **Domain Services (`src/domains/portfolio/services/`)**:
  * **[portfolioService.ts](src/domains/portfolio/services/portfolioService.ts)**: Handles high-level portfolio lifecycle, repository interactions, and offline cache synchronization.
  * **[portfolioCalculationService.ts](src/domains/portfolio/services/portfolioCalculationService.ts)**: Memoized recalculation of asset totals, live equity price updates, and AMFI mutual fund NAV ticks.
  * **[portfolioSyncService.ts](src/domains/portfolio/services/portfolioSyncService.ts)**: Serialized mutation queue mutex preventing concurrency collisions during rapid user inputs.
* **Shared Interactive Hooks**:
  * **[useIsMobile.ts](src/hooks/useIsMobile.ts)**: Centralized reactive hook for mobile viewport checking (`window.matchMedia('(max-width: 767px)')`). Prevents layout thrashing by eliminating repeated `window.innerWidth` reads across components.
  * **[useAssetModal.ts](src/hooks/useAssetModal.ts)**: Generic reusable hook encapsulating modal visibility, editing item state (`editingItem`), delete confirmation target (`confirmDeleteItem`), and auto-open quick-add triggers.
  * **[useAssetFilterSort.ts](src/hooks/useAssetFilterSort.ts)**: Standardized client-side filtering and multi-field sorting hook for asset registries.
  * **[useModalState.ts](src/hooks/useModalState.ts)**: Custom hook encapsulating modal visibility state (`quickAddTarget`, `showAddModal`, `showAddFamily`, `renameTarget`, `deleteTarget`, etc.) and computing `isAnyModalOpen` to control floating action buttons.
  * **[useLongPress.ts](src/hooks/useLongPress.ts)**, **[useSwipeNavigation.ts](src/hooks/useSwipeNavigation.ts)**, **[usePullToRefresh.ts](src/hooks/usePullToRefresh.ts)**: Mobile gesture and tactile interaction suite.

---

### 2. Infrastructure & Repository Layer

* **Repository Interfaces (`src/domains/portfolio/repositories/`)**:
  * **[IPortfolioRepository.ts](src/domains/portfolio/repositories/IPortfolioRepository.ts)**: Port contract for family portfolios, all multi-asset categories (Stocks, FDs, RDs, SIPs, Gold, Real Estate, Insurances, Documents), and net worth history persistence.
* **Supabase Repositories (`src/infrastructure/supabase/repositories/`)**:
  * **[SupabasePortfolioRepository.ts](src/infrastructure/supabase/repositories/SupabasePortfolioRepository.ts)**: Implements `IPortfolioRepository` for complete family portfolio data retrieval and CRUD mutations via Edge Functions.
* **Cache Infrastructure (`src/infrastructure/cache/`)**:
  * **[indexedDbCache.ts](src/infrastructure/cache/indexedDbCache.ts)**: Safe IndexedDB wrapper (`idb-keyval`) with memory fallback for non-browser/test environments.
  * **[portfolioCache.ts](src/infrastructure/cache/portfolioCache.ts)**: Offline portfolio payload cache persistence and cache invalidation.
  * **[swrConfig.ts](src/infrastructure/cache/swrConfig.ts)**: Global SWR deduplication and retry configurations.
* **Market Data Infrastructure (`src/infrastructure/market-data/`)**:
  * **[marketDataService.ts](src/infrastructure/market-data/marketDataService.ts)**: Unified facade coordinating multi-provider quote lookups, in-flight deduplication, caching, and fallback resolution.
  * **[providers/yahooProvider.ts](src/infrastructure/market-data/providers/yahooProvider.ts)**: Yahoo Finance equity quote fetcher via Edge Function.
  * **[providers/amfiProvider.ts](src/infrastructure/market-data/providers/amfiProvider.ts)**: AMFI India mutual fund daily NAV fetcher.
  * **[providers/mcxProvider.ts](src/infrastructure/market-data/providers/mcxProvider.ts)**: Real-time MCX & IBJA bullion spot rate provider.
  * **[marketDataCache.ts](src/infrastructure/market-data/marketDataCache.ts)**: High-speed TTL in-memory market quote cache.
  * **Market Quote Fallback Priority Chain**:
    ```text
    1. Active Live Request (Yahoo / AMFI / MCX)
       ↓ (if in-flight request exists, reuse Promise)
    2. In-Memory TTL Cache (marketDataCache.ts — 2 min TTL)
       ↓ (if network fails / rate limited)
    3. Last-Known Stale Quote / Snapshot from Database/IndexedDB
    ```
* **Workers & Storage**:
  * **[xirr.worker.ts](src/workers/xirr.worker.ts)**: Background Web Worker infrastructure for off-thread Newton-Raphson cash flow calculations (not wired into the synchronous calculation call path; standard UI portfolio returns compute synchronously via pure math modules with memoization).
  * **[supabaseStorage.ts](src/utils/supabaseStorage.ts)**: Supabase Document Storage with client-side path traversal protection, PIN-authenticated signed URL generation (private bucket), UUID path randomization, and secure Edge Function routing.
  * **[logger.ts](src/infrastructure/logging/logger.ts)**: Lightweight logger with automated regex-based redaction of sensitive credentials (PINs, API keys, tokens, auth headers).

---

### 3. Pure Calculation Modules

All core financial calculations are pure functions with zero UI, React, or database dependencies:

* **Portfolio Calculations (`src/domains/portfolio/calculations/`)**:
  * **[portfolioTotals.ts](src/domains/portfolio/calculations/portfolioTotals.ts)**: Single-pass portfolio totals aggregation and Method-B intraday delta calculations.
  * **[allocation.ts](src/domains/portfolio/calculations/allocation.ts)**: Asset class distribution and percentage breakdowns for visual widgets.
  * **[netWorth.ts](src/domains/portfolio/calculations/netWorth.ts)**: Snapshot formatting and net worth timeline aggregations.
* **Performance Calculations (`src/domains/performance/calculations/`)**:
  * **[xirr.ts](src/domains/performance/calculations/xirr.ts)**: Pure Newton-Raphson XIRR solver with TypedArray cash flows and bisection fallback.
  * **[cagr.ts](src/domains/performance/calculations/cagr.ts)**: Period-bounded Compound Annual Growth Rate calculator.
  * **[returns.ts](src/domains/performance/calculations/returns.ts)**: Weighted-age portfolio annualized returns and cash flow extraction.
  * **[benchmark.ts](src/domains/performance/calculations/benchmark.ts)**: Nifty 50, Nifty 500, and S&P 500 reference returns.
* **Taxation Calculations (`src/domains/taxation/calculations/`)**:
  * **[taxHarvesting.ts](src/domains/taxation/calculations/taxHarvesting.ts)**: Real-time tax loss harvesting opportunity finder distinguishing equity STCG (20%) / LTCG (12.5% over ₹1.25L) from slab-rate debt and gold bullion assets.
  * **[capitalGains.ts](src/domains/taxation/calculations/capitalGains.ts)**: Indian Income Tax FY24-25 capital gains calculations.
  * **[financialYear.ts](src/domains/taxation/calculations/financialYear.ts)**: Indian fiscal year (Apr 1 - Mar 31) date classification.
* **Asset Specific Calculations (`src/domains/assets/`)**:
  * **[fdCompounding.ts](src/domains/assets/fd/calculations/fdCompounding.ts)**: Half-yearly / quarterly compound interest maturity solver.
  * **[rdCompounding.ts](src/domains/assets/rd/calculations/rdCompounding.ts)**: Indian Banking standard quarterly compounding RD valuation.
  * **[sipValuation.ts](src/domains/assets/sip/calculations/sipValuation.ts)**: Live AMFI NAV scheme price multiplication and accrued valuations.
  * **[goldValuation.ts](src/domains/assets/gold/calculations/goldValuation.ts)**: Bullion weight × 24K spot rate × hallmark purity multiplier (24K, 22K/916, 18K/750, 14K/585).

---

### 4. Supporting Domains (AI, Data Quality, Backup/Restore)

* **Data Quality Domain (`src/domains/data-quality/`)**:
  * **[healthScore.ts](src/domains/data-quality/healthScore.ts)**: Health scoring rules engine auditing missing maturity dates, zero valuations, overdue insurance renewals, and missing attachments.
  * **[types.ts](src/domains/data-quality/types.ts)**: Standardized issue types with severity tiers (`info`, `warning`, `critical`).
* **AI Assistant Domain (`src/domains/ai/`)**:
  * **[assistantEngine.ts](src/domains/ai/assistant/assistantEngine.ts)** & **[index.ts](src/domains/ai/index.ts)**: Deterministic client-side NLP assistant engine parsing and evaluating 17 financial intents (`NET_WORTH`, `PERFORMERS`, `MATURITY_TIMELINE`, `ALLOCATION_SPLIT`, `SPECIFIC_GOLD`, `SPECIFIC_MUTUAL_FUNDS`, `SPECIFIC_STOCKS`, `SPECIFIC_FDS`, `INSURANCE_REMINDERS`, `FAMILY_BREAKDOWN`, `NEXT_SIP_DATE`, `EMERGENCY_FUND`, `RENTAL_YIELD`, `EXPIRED_DOCUMENTS`, `COMPREHENSIVE_SEARCH`, `UNKNOWN`, `HELP`) with matched asset badges and zero hallucinated numbers.
* **Backup & Restore Domain (`src/domains/portfolio/backup/`)**:
  * **[backupSchema.ts](src/domains/portfolio/backup/backupSchema.ts)** & **[backupValidator.ts](src/domains/portfolio/backup/backupValidator.ts)**: Schema-enforcing backup and restore diagnostic engine with envelope validation and collision detection.

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
  * **[AssetRegistryContainer.tsx](src/components/ui/AssetRegistryContainer.tsx)**: Standardized shell for asset registry headers, add buttons, and loading fallbacks.
  * **[DocumentAttachmentField.tsx](src/components/ui/DocumentAttachmentField.tsx)**: Document uploader supporting taxonomy tags (`fd_advice`, `policy_schedule`, `title_deed`, `tax_receipt`, `invoice`, `gold_hallmark`, `account_statement`, `general`) with 10MB bounds.
  * **[ExportPanel.tsx](src/components/ExportPanel.tsx)**: Unified data export panel (JSON/CSV), schema-validated full restore engine, and print-optimized `@media print` A4 PDF statement generator.
  * **[GoldHoldingView.tsx](src/components/gold/GoldHoldingView.tsx)**, **[GoldHoldingCard.tsx](src/components/gold/GoldHoldingCard.tsx)**, and **[GoldFormModal.tsx](src/components/gold/GoldFormModal.tsx)**.
  * **[RealEstateView.tsx](src/components/realestate/RealEstateView.tsx)**, **[RealEstateCard.tsx](src/components/realestate/RealEstateCard.tsx)**, and **[RealEstateFormModal.tsx](src/components/realestate/RealEstateFormModal.tsx)**.
  * **[InsuranceView.tsx](src/components/insurance/InsuranceView.tsx)**, **[InsurancePolicyCard.tsx](src/components/insurance/InsurancePolicyCard.tsx)**, and **[InsuranceFormModal.tsx](src/components/insurance/InsuranceFormModal.tsx)**.
  * **[FixedDepositView.tsx](src/components/FixedDepositView.tsx)**, **[DepositDetailsCard.tsx](src/components/fd/DepositDetailsCard.tsx)**, and **[FDFormModal.tsx](src/components/fd/FDFormModal.tsx)**.
  * **[RDView.tsx](src/components/rd/RDView.tsx)**, **[RDAccountCard.tsx](src/components/rd/RDAccountCard.tsx)**, and **[RDFormModal.tsx](src/components/rd/RDFormModal.tsx)**.
  * **[SIPView.tsx](src/components/sip/SIPView.tsx)**, **[SIPAccountCard.tsx](src/components/sip/SIPAccountCard.tsx)**, and **[SIPFormModal.tsx](src/components/sip/SIPFormModal.tsx)**.

---

### 7. Testing Strategy
* **Test Conventions & Locations**:
  * Unit and pure calculation tests: located under `src/domains/__tests__/` (e.g., `portfolioTotals.test.ts`, `taxHarvesting.test.ts`, `goldValuation.test.ts`, `dataQuality.test.ts`, `backupValidator.test.ts`).
  * Component & formatter tests: located under `src/utils/__tests__/` and `src/hooks/__tests__/`.
* **Mocking & Environment Isolation**:
  * Browser storage (`indexedDB`, `localStorage`, `Notification`) and Web Worker APIs are wrapped in memory fallbacks and environment guards so tests execute cleanly in standard Node/JSDOM runners without mock leaks.
* **Verification Pipeline**:
  * `npm run verify` orchestrates lint (`eslint .`), strict TypeScript checking (`tsc --noEmit`), and Vite bundle building (`vite build`).
  * `npm test` (`vitest run`) executes the complete test suite across 28 test files and 140+ unit/integration test cases.

---

### 8. Error Handling & Observability
* **Standardized Error Hierarchy (`src/shared/errors/AppError.ts`)**:
  * `AppError`: Base application error with `code`, `severity` (`info`, `warning`, `error`, `critical`), and user-facing message mapping.
  * `ValidationError`: Emitted when form inputs, payloads, or asset IDs fail schema constraints.
  * `RepositoryError`: Emitted on database or network transport failures.
  * `SyncError`: Emitted during concurrency mutex collisions or broker sync discrepancies.
  * `MarketDataError`: Emitted when quote providers fail, automatically triggering fallback cache resolution.
  * `AuthenticationError`: Emitted when PIN or session challenges fail.
* **User-Facing Error Resolution**:
  * Handled uniformly via `toUserErrorMessage(error)`, mapping technical stack traces into friendly, actionable notifications.
* **UI Error Surfacing (Three-Tier Layered Architecture)**:
  * **Root Shell Barrier** ([`ErrorBoundary.tsx`](src/components/ErrorBoundary.tsx)): Outermost fail-safe mounted in `src/main.tsx` catching early DOM mounting / initialization failures before context hydration.
  * **Authenticated App Barrier** ([`AppErrorBoundary.tsx`](src/components/AppErrorBoundary.tsx)): Catches full-page application crashes inside `src/MainApp.tsx` with friendly retry actions and state recovery.
  * **Isolated Widget Barrier** ([`SectionErrorBoundary.tsx`](src/components/SectionErrorBoundary.tsx)): Localized boundary isolating registry and widget crashes so an error in one card/tab never crashes sibling components.
  * **Transient Mutation & Network Alerts**: Dispatched non-blockingly via [ToastContext.tsx](src/contexts/ToastContext.tsx).
* **Observability & Logging (`src/infrastructure/logging/logger.ts`)**:
  * Structured logging with level filtering (`debug`, `info`, `warn`, `error`).
  * Automatic redaction of sensitive credentials (PINs, tokens, auth headers, secret keys).

---

## ⚡ Performance Optimizations & Web Workers

1. **Mobile Offscreen Containment (`content-visibility: auto`)**: Mobile holding cards (`.mobile-asset-card`) apply `content-visibility: auto; contain-intrinsic-size: 0 100px; contain: layout style;` to skip layout and style computation until scrolled into the viewport.
2. **Zero-Latency Touch & GPU Layer Promotion**: Global `touch-action: manipulation` eliminates the 300ms mobile tap delay. Fixed bars (`.mobile-bottom-nav`, `.mobile-status-bar`) promote to GPU compositor layers (`transform: translateZ(0)`).
3. **Idle Chunk Pre-warming**: `requestIdleCallback` pre-warms the top 4 heaviest asset view chunks (`PortfolioTable`, `FixedDepositView`, `SIPView`, `GoldHoldingView`) during device idle time for zero-skeleton tab switching.
4. **Off-Thread Worker Infrastructure (`xirr.worker.ts`)**: Background Web Worker infrastructure prepared for off-main-thread async Newton-Raphson cash flow calculations during large batch workloads (not actively wired into the synchronous render loop; live calculations use synchronous TypedArray iterations with in-memory LRU caching).
5. **Render Memoization & Virtualization**: Registry tables utilize `react-window` virtualization and `React.memo` with strict equality comparators on card components.
6. **PWA Auto-Update**: Workbox instant takeover (`skipWaiting: true`, `clientsClaim: true`) and document `visibilitychange` update listeners.

---

## 🎨 Clean Data-First Design System Architecture (Zerodha Kite & Apple Hybrid)

> **Single Source of Truth**: All design tokens, canonical hex values, typography scales, and accessibility requirements are authoritatively governed by [`UI.md`](UI.md) (specifically `UI.md §2` and `UI.md §11`) and implemented via CSS custom properties in `src/index.css` alongside Tailwind CSS utility classes.

* **Hybrid Styling Stack**: Tailwind CSS utility framework (`tailwind.config.js`) mapped to semantic CSS custom variables (`var(--surface)`, `var(--border-subtle)`, etc.) declared in `src/index.css`.
* **Flat Neutral Canvas**: Standardized `#f8fafc` light / `#080c14` dark canvas background system.
* **Zerodha Kite Signature Palette**: Canonical financial tokens: Kite Blue (`#387ed1`), clean profit green (`#00b074`), and clean loss red (`#df514c`).
* **High-Density Holdings Ribbon**: Horizontal overview strip (*Holdings count, Total inv., Current val., Overall P&L, Day's P&L*) above asset tables.
* **Hover-Activated Action Dock**: Row action buttons quietly hidden at rest and revealed on desktop hover (`group-hover:opacity-100`).
* **Single Card Surface (`.apple-card`)**: Solid surface (`var(--surface)`), 1px crisp border (`var(--border-subtle)`), and quiet static shadows (`var(--shadow-card)`).
* **Tactile Spring Feedback**: Unified `.ios-press` tactile transition scaling triggers (`active:scale(0.97)`).
* **Accessibility & Measurement Standards**: Enforces WCAG 2.1 contrast ratios (4.5:1 text, 3.0:1 UI) per `UI.md §11`.

---

## 💾 Database Schema & Table Mappings

> *Note: Dedicated tabular mapping is maintained intentionally for high-density architectural scannability.*

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
3. **Self-Improvement Loop**: Update [`tasks/lessons.md`](tasks/lessons.md) after any user correction and review at session start.
4. **Verification Before Done**: Run `npm run verify` (`eslint`, `typecheck`, `build`) and `vitest run` before completing tasks.
5. **Demand Elegance**: Avoid hacky fixes; ensure clean boundary adherence and type safety.

---

## 📜 Architecture Changelog

| Date | Version | Key Changes & Milestones |
| :--- | :--- | :--- |
| **2026-08-25** | `v2.0` | Clean Architecture refactor: modularized `usePortfolioData.ts`, extracted pure calculation modules, introduced domain repository port contracts, added multi-provider market data service, standardized `AppError` hierarchy, and enhanced test suites. |
| **2026-08-22** | `v1.5` | Fail-closed Edge Function security hardening, strict storage path allowlists, full-phase audit protocols. |
| **2026-08-21** | `v1.4` | PWA background lifecycle update listeners and WebAuthn credential persistence safeguards. |
| **2026-08-17** | `v1.3` | Mobile bottom sheet detail drawers, responsive chart height scaling, and design system unification with `UI.md`. |

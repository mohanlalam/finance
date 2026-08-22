# 💼 Family Portfolio Tracker — GEMINI.md (Project Architecture)

This document provides a high-level overview of the folder structure, data flow, state management, database mappings, and performance optimizations of the Family Portfolio Tracker application. It is designed to help developers and AI agents navigate the codebase efficiently.

> ⚠️ **Design Token Rule**: [`UI.md`](UI.md) is the single authoritative source of truth for all visual tokens. Never introduce a new color hex, corner radius, shadow, or typography token in code or docs without first declaring it in `UI.md §2` and `src/index.css`.

---

## 📁 Key File Structures & Domains

### 1. State Management & Shared Custom Hooks
* **[PortfolioContext.tsx](src/contexts/PortfolioContext.tsx)**
  * Split into `PortfolioEntitiesContext` (portfolios, active tabs, net worth history), `PortfolioStatusContext` (load/price statuses, cached timestamps, staleness flags, mutation lock), and `PortfolioActionContext` (consolidated CRUD action triggers: `addAsset`, `updateAsset`, `deleteAsset`, `addPortfolio`, `renamePortfolio`, `deletePortfolio`, `load`, `refreshSnapshot`, `refreshPrices`).
  * Exposes fine-grained `usePortfolioEntities()`, `usePortfolioStatus()`, `usePortfolioState()`, and `usePortfolioActions()` hooks separately to prevent form modals and write-only components from re-rendering during data/price ticks.
  * Sets up background price refresh polling interval (15 minutes). The tab visibility refresh gate and resume cooldown are offloaded to `usePortfolioData.ts` to prevent redundant fetches.
* **[usePortfolioData.ts](src/hooks/usePortfolioData.ts)**
  * Source of truth for portfolio assets, net worth snapshots, and database transactions.
  * Integrated **SWR caching** and automatic IndexedDB caching (`idb-keyval`) to implement stale-while-revalidate instant loads.
  * Configures SWR with `dedupingInterval: 300_000` (5 minutes) to avoid duplicate network fetches within a short timeframe, and `errorRetryCount: 2` to prevent rapid retry storms on unstable mobile networks.
  * Clears IndexedDB cache via `invalidateIDBCache()` on asset/portfolio mutations to prevent state synchronization issues.
  * Listens to document `visibilitychange` events to trigger background SWR reloads and price refreshes on window focus/resume.
  * Implements a `recalcPortfolioTotals` performance guard that skips recalculation tasks if the underlying asset details haven't changed.
  * Guarantees race-free state transitions by processing queries/mutations through a serialized promise queue (`runMutation`) with debounced mutation coalescing.
  * Connects to Supabase Edge Functions via [apiClient.ts](src/utils/apiClient.ts) with SHA-256 PIN hash caching (`_cachedPinHash`) and in-flight request deduplication.
* **[useIsMobile.ts](src/hooks/useIsMobile.ts)**
  * Centralized reactive hook for mobile viewport checking (`window.matchMedia('(max-width: 767px)')`). Prevents layout thrashing by eliminating repeated `window.innerWidth` reads across components.
* **[useAssetModal.ts](src/hooks/useAssetModal.ts)**
  * Generic reusable hook encapsulating modal visibility, editing item state (`editingItem`), delete confirmation target (`confirmDeleteItem`), and auto-open quick-add triggers. Used across Gold, Real Estate, Insurance, and FD views to eliminate boilerplate per view.
* **[useAssetFilterSort.ts](src/hooks/useAssetFilterSort.ts)**
  * Standardized client-side filtering and multi-field sorting hook for asset registries. Supports query search matching and sort directions.
* **[useModalState.ts](src/hooks/useModalState.ts)**
  * Dedicated custom hook encapsulating all modal visibility and target state (`quickAddTarget`, `showAddModal`, `showAddFamily`, `renameTarget`, `deleteTarget`, `isDeleting`, `showMobileAlerts`, `showChangePinModal`).
  * Cleans up `quickAddTarget` on `closeModal` to ensure floating add buttons never get orphaned.
  * Computes aggregate `isAnyModalOpen` boolean flag to gate Floating Add Button (`FloatingAddMenu`) visibility.
* **[useLongPress.ts](src/hooks/useLongPress.ts)**, **[useSwipeNavigation.ts](src/hooks/useSwipeNavigation.ts)**, **[usePullToRefresh.ts](src/hooks/usePullToRefresh.ts)**
  * Mobile gesture and tactile interaction suite tailored for PWA gesture navigation without interfering with native scroll boundaries.
* **[biometrics.ts](src/utils/biometrics.ts)**
  * Native WebAuthn Platform Authenticator integration (FaceID, TouchID, Windows Hello, Android Biometrics).
  * Manages hardware capability detection (`isUserVerifyingPlatformAuthenticatorAvailable()`), platform credential generation (`navigator.credentials.create`), credential challenge assertions (`navigator.credentials.get`), and biometric PIN hash synchronization.
  * Preserves biometric credentials during transient iOS Safari gesture timeouts, only unbinding credentials on explicit PIN resets.
* **[goldPricing.ts](src/utils/goldPricing.ts)**
  * Real-time MCX & NSE Gold Bullion pricing engine with 15-minute polling intervals.
  * Dynamically computes 24K (99.9% fine), 22K (91.6% standard hallmark), and 18K (75.0% fine) rates per gram and per 10g (Tola).
  * Tracks intraday price movements (₹/g delta and % change) against previous market close.
  * Supports custom jeweler rate overrides with single-click reset to live MCX rates.
* **[ToastContext.tsx](src/contexts/ToastContext.tsx)**
  * Exposes global toast/snackbar notifications state (`useToast`, `useToastActions`) and auto-dismissals, entirely replacing raw browser `alert()` popups across the app.
* **[backupValidation.ts](src/utils/backupValidation.ts)**
  * Schema-enforcing backup and restore diagnostic engine.
  * Validates JSON schema envelopes, item counts per asset domain, active duplicate collisions, and unlinked file references prior to data mutations.
* **[dataQuality.ts](src/utils/dataQuality.ts)**
  * Rules engine for portfolio data integrity (missing maturity dates, zero valuations, missing document attachments, and stale prices).
  * Manages 30-entry rolling snapshot persistence in `localStorage` for historical score trends and monthly resolution metrics.
* **[aiDocumentExtractor.ts](src/utils/aiDocumentExtractor.ts)**
  * Gemini-powered multi-format financial document extractor (PDF, JPEG, PNG, WEBP).
  * Employs session-scoped API key persistence (`sessionStorage`) with strict numerical field clamping and bounds validation.


### 2. App Shell, Security Gate & Navigation Router
* **[App.tsx](src/App.tsx)**
  * Lightweight entry gate. Renders `PinLockScreen` from a clean, provider-free chunk. Once unlocked, dynamically imports and mounts `MainApp` using `React.lazy`. Prefetches `MainApp` during device idle time.
* **[MainApp.tsx](src/MainApp.tsx)**
  * Hosts context providers (`ThemeProvider`, `PrivacyContext`, `ToastProvider`, `PortfolioProvider`), Router structure, and dashboard load gates.
* **[AppShell.tsx](src/layouts/AppShell.tsx)**
  * Core responsive layout manager combining `DesktopSidebar` with main content area.
  * Consumes `useIsMobile()` for viewport checks and `useModalState()` to decouple modal visibility state.
  * Features **Idle Chunk Pre-warming** via `requestIdleCallback` to prefetch `PortfolioTable`, `FixedDepositView`, `SIPView`, and `GoldHoldingView` during device idle time for zero-skeleton tab switching.
  * Implements **Segmented Mobile Home View** (*"📊 Summary & Assets"* vs *"📈 Charts & AI"*), eliminating DOM nodes and concurrent SVG chart renders on initial mobile unlock.
  * Lazy-loads heavy action modals (`AddHoldingModal`, `AddFamilyModal`, `RenamePortfolioModal`, `ChangePinModal`, `DataQualityHealthModal`, `SmartImportModal`, `ExportPanel`) with `React.lazy` and `Suspense`.
* **[DesktopSidebar.tsx](src/layouts/DesktopSidebar.tsx)**
  * Desktop navigation sidebar featuring sticky top alignment (`sticky top-6`) and `self-start` height constraint.
* **[MobileBottomNav.tsx](src/components/MobileBottomNav.tsx)**
  * High-density mobile bottom navigation bar (Google Stitch UI standard) featuring 5 core navigation tabs: *Home*, *Stocks*, *SIP & MF* (`Wallet`), *Deposits* (`Landmark`), and *More* (`Menu`). Promoted to GPU compositor layer.
* **[SearchBar.tsx](src/components/SearchBar.tsx)**
  * Omni-search palette (`Cmd/Ctrl + K`) providing instant client-side indexing and navigation across all family portfolios, assets, and vault documents with category filtering.
* **[PinLockScreen.tsx](src/components/PinLockScreen.tsx)**
  * Restricts app access via passcode lock screen over purple-to-blue aurora gradient background with live clock display and frosted glass buttons.
  * Features integrated **Biometric Keypad Button** and auto-prompt on mount for instant 1-second FaceID / TouchID / Fingerprint unlocking with 4-digit PIN fallback.
  * Includes **Brute-Force Rate Limiting** (5 failed attempts trigger exponential cooldown timer with persistent countdown) and 2-step confirmation for PIN resets.
* **[ChangePinModal.tsx](src/components/ChangePinModal.tsx)**
  * Security modal managing PIN changes and dedicated **Biometric Unlock Switch** toggle.


### 3. Registry Component Routing & Modular Views
* **[AssetTabContent.tsx](src/components/AssetTabContent.tsx)**
  * Orchestrator component rendering the active asset registry view.
  * Integrates **dynamic lazy loading** (`React.lazy` and `React.Suspense`) for ALL registry views and tables: `FixedDepositView`, `RDView`, `SIPView`, `GoldHoldingView`, `RealEstateView`, `InsuranceView`, `DocumentVaultView`, `TaxHarvestingView`, and `PortfolioTable` using [AssetCardSkeleton.tsx](src/components/AssetCardSkeleton.tsx) as the loading fallback.
  * Applies `.tab-transition` CSS animation class with a unique `key` prop tied to the active tab.

* **Modular Domain Components**:
  * **[src/components/ui/AssetRegistryContainer.tsx](src/components/ui/AssetRegistryContainer.tsx)**: Standardized shell for asset registry headers, add buttons, `<AssetCardSkeleton>` loading fallbacks, and `<EmptyState>` placeholders.
  * **[src/components/ui/DocumentAttachmentField.tsx](src/components/ui/DocumentAttachmentField.tsx)**: Hardened document uploader with document taxonomy selectors (`fd_advice`, `policy_schedule`, `title_deed`, `tax_receipt`, `invoice`, `gold_hallmark`, `account_statement`, `general`), 10MB limits, and contextual guidance.
  * **[src/components/ui/QuickAccessShortcuts.tsx](src/components/ui/QuickAccessShortcuts.tsx)**: Quick access cheat-sheet overlay documenting all global keyboard shortcuts.
  * **[src/components/ExportPanel.tsx](src/components/ExportPanel.tsx)**: Unified data export panel (JSON/CSV), schema-validated full restore engine, and print-optimized `@media print` A4 PDF statement generator.
  * **[src/components/gold/](src/components/gold/)**: `GoldHoldingView.tsx` (with Live MCX Bullion Ribbon, 24K/22K/18K ticker, manual sync, and aggregate portfolio weight/valuation strip), `GoldHoldingCard.tsx` (with buy price/g vs live rate/g, hallmark attachment badges, and `.mobile-asset-card` containment), and `GoldFormModal.tsx`.
  * **[src/components/realestate/](src/components/realestate/)**: Standalone `RealEstateCard.tsx` (with title deed badges and `.mobile-asset-card` containment) and `RealEstateFormModal.tsx`.
  * **[src/components/insurance/](src/components/insurance/)**: Standalone `InsurancePolicyCard.tsx` (with policy bond badges, overdue renewal indicators, and `.mobile-asset-card` containment) and `InsuranceFormModal.tsx`.
  * **[src/components/fd/](src/components/fd/)**: Standalone `DepositDetailsCard.tsx` (with FD advice badges and `.mobile-asset-card` containment), `FDFormModal.tsx`, and `StandardFormFields.tsx`.
  * **[src/components/rd/](src/components/rd/)**: `RDView.tsx`, `RDAccountCard.tsx` (with `.mobile-asset-card` containment), `RDFormModal.tsx`, and `RDInstallmentSchedule.tsx`.
  * **[src/components/sip/](src/components/sip/)**: `SIPView.tsx`, `SIPAccountCard.tsx` (with `.mobile-asset-card` containment), `SIPFormModal.tsx`, and `SIPFormFields.tsx`.
  * **[src/components/TaxHarvestingView.tsx](src/components/TaxHarvestingView.tsx)**: Real-time tax loss harvesting opportunity finder, separating equity LTCG/STCG from slab-rate debt and gold holdings.
  * **[src/components/HoldingDetailDrawer.tsx](src/components/HoldingDetailDrawer.tsx)**: Apple-style responsive holding detail view (slide-up bottom sheet on mobile, clean drawer on desktop).


### 4. UI Dashboard & Widget Performance
* **Single-Pass Responsive Table**:
  * **[PortfolioTable.tsx](src/components/PortfolioTable.tsx)**: Single-pass conditional view rendering (`isMobile ? ... : ...`) using `useIsMobile()`, cutting mounted DOM node count by 50%.
* **Unified Summary Overview Card**:
  * **[SummaryCards.tsx](src/components/SummaryCards.tsx)**: Merged 4-column unified overview card (*Net Worth, Invested, Total Return, Today's Return*) with family breakdown tiles beneath each metric.
* **Mobile Home Summary**:
  * **[MobileHomeSummary.tsx](src/components/MobileHomeSummary.tsx)**: Unified clean top card displaying live Net Worth, Sparkline trajectory, Today's Gain/Loss badge, Invested Capital, and Total Overall Return without duplication or visual crowding.
* **Visual Dashboard Grid**:
  * **Standardized 2x2 Responsive Widget Cards Grid**: Core dashboard cards (`NetWorthTimelineChart.tsx`, `PortfolioAssistant.tsx`, `PieChart.tsx`, `BarChart.tsx`) use a minimum height (`min-h-[370px]`) inside a responsive `grid-cols-1 lg:grid-cols-2 gap-5` grid.
  * **[NetWorthTimelineChart.tsx](src/components/NetWorthTimelineChart.tsx)**: Responsive SVG area chart with date-range filtering (1M, 3M, 6M, 1Y, ALL) and multi-series selection (Total, Stocks vs FDs, Stocks, FDs).
  * **[PieChart.tsx](src/components/PieChart.tsx)**: Responsive asset class donut visualization with dynamic center HUD and progress proportion bars.
  * **[PortfolioAssistant.tsx](src/components/PortfolioAssistant.tsx)**: Conversational NLP assistant with 17 discrete intents and memoized `ChatMessageItem` component to prevent chat transcript re-rendering.
  * **[DataQualityHealthModal.tsx](src/components/DataQualityHealthModal.tsx)**: Modal auditing data completeness, tracking monthly resolved issues and score progression over time.
  * **[InsightsPanel.tsx](src/components/InsightsPanel.tsx)**: Displays top 5 movers, top holdings by value, best/worst performance indicators, top gainers/losers, and upcoming deposit maturities & insurance renewal notifications.

---

## ⚡ Performance Optimizations & Web Workers

The application implements a series of high-performance strategies to guarantee fluid 60FPS animations, instant transitions, and minimal main-thread blocking:

### 1. Mobile Offscreen Render Containment (`content-visibility: auto`)
* Mobile holding cards (`.mobile-asset-card`) apply `content-visibility: auto; contain-intrinsic-size: 0 100px; contain: layout style;`. Off-screen cards skip CSS layout, style calculations, and paint passes until scrolled into the viewport, reducing initial mobile paint times by **~40–50%**.

### 2. Zero-Latency Touch & GPU Layer Promotion
* Global `touch-action: manipulation` applied to all buttons, inputs, links, and card surfaces, eliminating the 300ms mobile double-tap gesture delay on iOS Safari and Android Chrome.
* Hardware compositor layer promotion (`transform: translateZ(0); will-change: transform; backface-visibility: hidden;`) assigned to fixed and sticky bars (`.mobile-bottom-nav`, `.mobile-status-bar`, `.floating-action-menu`).

### 3. Idle Chunk Pre-warming
* On shell mount, `requestIdleCallback` (with fallback) pre-warms the top 4 heaviest asset view chunks (`PortfolioTable`, `FixedDepositView`, `SIPView`, `GoldHoldingView`) during browser idle periods, providing instant tab switching with zero loading skeleton flashes.

### 4. Persistent Web Worker Singletons
* CPU-heavy financial calculations are offloaded to Vite-compatible background Web Workers using persistent lazy singletons. Eliminates 15–40ms thread instantiation overhead per calculation tick:
  * **[WorkerPool.ts](src/services/WorkerPool.ts)**: Generic persistent worker singleton manager.
  * **[xirr.worker.ts](src/workers/xirr.worker.ts)**: Handles Newton-Raphson cash flow solvers (`runXIRRAsync` in [`performance.ts`](src/utils/performance.ts)).

### 5. Render Memoization & Virtualization
* **List Virtualization**: Registry views (`FixedDepositView`, `GoldHoldingView`, `RealEstateView`, `InsuranceView`) utilize `react-window` to virtualize accounts when lists grow, binding rows to unique asset IDs to optimize DOM recycling.
* **Card Memoization**: Asset card components (`GoldHoldingCard`, `RealEstateCard`, `InsurancePolicyCard`, `DepositDetailsCard`, `ChatMessageItem`) use `React.memo` with strict equality functions comparing primary metrics to prevent redundant child re-renders.
* **Single-Pass Viewport Selection**: Components condition layout branches using `useIsMobile()` to avoid creating hidden desktop/mobile duplicate DOM subtrees.

### 6. PWA Auto-Update & iOS Standalone Lifecycle
* **Workbox Instant Takeover**: Configured `skipWaiting: true`, `clientsClaim: true`, and `cleanupOutdatedCaches: true` in [`vite.config.ts`](vite.config.ts) to prevent service worker waiting traps.
* **App Resume & Focus Polling**: [`main.tsx`](src/main.tsx) monitors document `visibilitychange` events and checks `registration.update()` every time an iOS Home Screen shortcut resumes from sleep, reloading smoothly via `controllerchange` listener.

---

## 🎨 Clean Data-First Design System Architecture (Zerodha Kite & Apple Hybrid)

> **Single Source of Truth**: All design tokens, canonical hex values, typography scales, and accessibility requirements are authoritatively governed by [`UI.md`](UI.md) (specifically `UI.md §2` and `UI.md §11`) and implemented in `src/index.css`. All components and documentation must strictly reference `UI.md` to prevent token drift.

* **Flat Neutral Canvas**: Standardized `#f8fafc` light / `#080c14` dark canvas background system.
* **Zerodha Kite Signature Palette**: Canonical financial tokens: Kite Blue (`#387ed1`), clean profit green (`#00b074`), and clean loss red (`#df514c`).
* **High-Density Holdings Ribbon**: Horizontal overview strip (*Holdings count, Total inv., Current val., Overall P&L, Day's P&L*) above asset tables.
* **Hover-Activated Action Dock**: Row action buttons quietly hidden at rest and revealed on desktop hover (`group-hover:opacity-100`) for zero visual distraction.
* **Single Card Surface (`.apple-card`)**: Solid surface (`var(--surface)`), 1px crisp border (`var(--border-subtle)`), and quiet static shadows (`var(--shadow-card)`).
* **Tactile Spring Feedback**: Unified `.ios-press` tactile transition scaling triggers (`active:scale(0.97)`).
* **Color System Extension**: Soft-tint variable tokens (`--positive-soft`, `--negative-soft`, `--warning-soft`, `--accent-blue-soft`, and `--backdrop-overlay` backdrop filters) mapped dynamically for dark mode.
* **Tightened Border Radius Tokens**: `--radius-small` (`6px`), `--radius-medium` (`10px`), `--radius-large` (`14px`), `--radius-pill` (`999px`).
* **Compact Financial Typography**: `.text-financial` with tabular font features (`.tnum`).
* **Accessibility & Measurement Standards**: Enforces WCAG 2.1 contrast ratios (4.5:1 text, 3.0:1 UI) and specific measurement audits for light-mode tertiary text and dark-mode positive/negative soft badges per `UI.md §11`.

---

## 💾 Database Schema & Table Mappings

Every deposit registry maps to its own separate database table:

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

## 🧮 Calculations & Formatters
* **[portfolioCalcs.ts](src/utils/portfolioCalcs.ts)**: Single-pass `for` loop portfolio totals aggregator and Method-B daily delta calculator.
* **[performance.ts](src/utils/performance.ts)**: Newton-Raphson XIRR solver with `Float64Array` year offsets, monotonic task ID counter, and persistent Web Worker singleton.
* **[rdUtils.ts](src/utils/rdUtils.ts)**: Indian Banking standard quarterly compounding RD valuation and closed-form maturity solver.
* **[taxUtils.ts](src/utils/taxUtils.ts)**: Financial year tax loss harvesting calculator distinguishing equity STCG (20%) / LTCG (12.5% over ₹1.25L) from slab-rate debt and gold bullion assets.
* **[supabaseStorage.ts](src/utils/supabaseStorage.ts)**: Path-sanitizing document storage client with directory traversal (`..`) protection and Edge Function admin routing.
* **[assistant.ts](src/utils/assistant.ts)**: Intent-based NLP query classification system across 17 financial intents.
* **[backupValidation.ts](src/utils/backupValidation.ts)**: JSON envelope validation, duplicate detection, and schema verification.
* **[dataQuality.ts](src/utils/dataQuality.ts)**: Health scoring, discrepancy diagnostics, and history tracking.
* **[formatters.ts](src/utils/formatters.ts)**: Indian currency formatters (`formatINR`), compact values, and date helpers.
* **[biometrics.ts](src/utils/biometrics.ts)**: WebAuthn public key credential helper and hardware authenticator verifier.
* **[goldPricing.ts](src/utils/goldPricing.ts)**: MCX / NSE live bullion feed parser and hallmark rate calculator.

---

## 🚀 Future Enhancements Roadmap (Queued)

1. **Broker Integration & Automation (Free Daily Sync)**:
   - **Padmavathi**: Fyers API v3 (free app registration, automated daily morning sync of equity holdings).
   - **Ram Mohan & Sai Laxmi**: Automated NSDL/CDSL Consolidated Account Statement (CAS) e-CAS parser or Zerodha Kite Connect/Account Aggregator.
2. **Multi-User Security & Row-Level Tenancy (RLS)**:
   - Transition from master PIN to Supabase Auth (`auth.users`) with per-user RLS policies across all tables and storage buckets (`investment-documents/{user_id}/*`).
3. **Advanced Asset Analytics**:
   - Capital Gains Realization & Tax Harvesting Planner.
   - Maturity Timeline & Cash Flow Forecast Calendar.

---

## 🤖 Workflow Orchestration Rules

These rules govern how AI coding agents (Antigravity, Claude, etc.) must behave when working on this project. They apply to every session automatically.

---

### 1. Plan Node Default
- Enter **plan mode** for ANY non-trivial task (3+ steps or architectural decisions).
- If something goes sideways, **STOP and re-plan immediately** — don't keep pushing.
- Use plan mode for **verification steps**, not just building.
- Write detailed specs upfront to reduce ambiguity.

### 2. Subagent Strategy
- Use subagents **liberally** to keep the main context window clean.
- **Offload** research, exploration, and parallel analysis to subagents.
- For complex problems, throw more compute at it via subagents.
- One task per subagent for focused execution.

### 3. Self-Improvement Loop
- After **ANY correction** from the user: update `tasks/lessons.md` with the pattern.
- Write rules that **prevent the same mistake** from recurring.
- Ruthlessly iterate on these lessons until the mistake rate drops.
- **Review `tasks/lessons.md` at the start of every session** for relevant context.

### 4. Verification Before Done
- **Never mark a task complete** without proving it works.
- Diff behavior between `main` and your changes when relevant.
- Ask yourself: *"Would a staff engineer approve this?"*
- Run `npx tsc --noEmit` and `npm run build`, check logs, **demonstrate correctness**.

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask *"is there a more elegant way?"*
- If a fix feels hacky: *"Knowing everything I know now, implement the elegant solution."*
- Skip this for simple, obvious fixes — **don't over-engineer**.
- Challenge your own work before presenting it.

### 6. Autonomous Bug Fixing
- When given a bug report: **just fix it**. Don't ask for hand-holding.
- Point at logs, errors, failing tests — then resolve them.
- **Zero context switching** required from the user.
- Go fix failing CI tests without being told how.

---

## 📋 Task Management Protocol

Every non-trivial task must follow this workflow:

1. **Plan First** — Write plan to `tasks/todo.md` with checkable items.
2. **Verify Plan** — Check in before starting implementation.
3. **Track Progress** — Mark items complete as you go (`[ ]` → `[/]` → `[x]`).
4. **Explain Changes** — High-level summary at each step.
5. **Document Results** — Add review section to `tasks/todo.md`.
6. **Capture Lessons** — Update `tasks/lessons.md` after any corrections.

### Checklist Notation
```
- [ ]  Uncompleted task
- [/]  In-progress task
- [x]  Completed task
```

---

## ⚙️ Core Principles

- **Single Design Source of Truth** — Never introduce a new color, radius, shadow, or typography token. If it is not in `UI.md §2`, declare it in `UI.md §2` first, then implement and reference it.
- **Simplicity First** — Make every change as simple as possible. Impact minimal code.
- **No Laziness** — Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact** — Changes should only touch what's necessary. Avoid introducing bugs.


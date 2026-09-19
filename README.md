# 🌌 Family Portfolio Vault

A high-performance, privacy-first multi-asset portfolio tracker designed to manage consolidated family wealth. Elevated with the **Antigravity Cyber-Zen Design Aesthetic** (weightless suspension, deep cosmic obsidian canvas `#040711`, frosted glassmorphism `backdrop-blur-2xl`, glowing neon metrics, and floating dock navigation), Clean Architecture v3.0, zero-dependency SVG iconography, sub-second instant loads, and multi-provider market quote integration.

---

## ✨ Key Features

### 🌌 Antigravity Cyber-Zen UI & Visual Experience
- **Weightless Suspension & Zero-G Atmosphere** — Replaces grounded footers with atmospheric suspension over a deep cosmic void (`#040711`) layered with multi-point ambient radial nebula meshes (cyan `#06b6d4`, celestial violet `#a855f7`, and emerald aura `#10b981`).
- **Glassmorphic Floating Surfaces** — Translucent cards with `backdrop-blur-2xl`, 1px luminous edge highlights, and zero-G hover ascension.
- **Liquid Glass Floating Island Navigation** — Elevated floating pill tab bar (`blur(20px) saturate(1.8)`, `max-width: 440px`, height `60px`, `border-radius: 30px`) lifted off the screen bottom with scroll-reactive minimization, featuring clean Apple SF Symbol selection states without heavy capsules, and a calm functional Liquid Glass More drawer.

### 📊 Financial Analytics & Visualizations
- **Consolidated Financial Net Worth Timeline** — Responsive SVG area chart with interactive hover cards plotting liquid/deposit historical wealth appreciation across Stocks, Fixed Deposits, RDs, and Mutual Funds.
- **Asset Allocation Donut** — Multi-category distribution chart across Stocks, Fixed Deposits, RDs, Mutual Funds, Gold Bullion, and Real Estate.
- **Live Market Data Hub** — Multi-provider quotes coordinator with automated background polling, in-memory TTL caching, and offline fallback (Yahoo Finance for equities, AMFI India for Mutual Fund NAVs, and MCX/IBJA for bullion).
- **Tax Loss Harvesting Opportunity Finder** — Indian Income Tax FY24-25 analyzer distinguishing equity STCG (20%) / LTCG (12.5% over ₹1.25L) from debt and gold slab rates.
- **Portfolio Comparison Bar Chart** — Side-by-side family member bar chart with animated value transitions.
- **Member Returns Widget** — Per-member annualized return comparisons with XIRR/CAGR computations.

### 💼 Multi-Asset Registry Suite (Unified Single-Banner Architecture)
- **Unified Single-Banner Architecture** — All non-stock asset classes render exactly ONE top banner aggregating all family holdings with domain-essential metrics and interactive 1-click member filters (`Rammohan`, `Padmavathi`, `Sai Laxmi`), followed by holdings grouped cleanly by family member below.
- **Ultra-Compact Mobile Layout** — Tuned for mobile screens (`< 768px`) with a side-by-side 3-column member breakdown (`grid-cols-3 gap-1`), high-density 2x2 metric ribbons (`p-1.5`), and 50/50 balanced top badges (`flex-1 sm:flex-initial`), saving **~65% vertical screen space**.
- **Stocks & ETFs** — Live market data with Yahoo Finance quotes, intraday P&L tracking, allocation percentages, and multi-field sortable tables with virtualized rendering.
- **Fixed Deposits (FD)** — Compounded interest calculations (strictly Indian banking half-yearly compounding $n=2$), auto-suggestions for all major Indian banks, maturity date timeline progress bars, and linked deposit receipts.
- **Recurring Deposits (RD)** — Multi-month installment tracking with Indian bank datalists, paid vs. overdue status tracking, and one-click installment recording.
- **Mutual Fund SIPs** — Real-time scheme tracking via AMFI India NAV automation, top Indian scheme presets (Parag Parikh, Quant, Mirae, etc.), and unit holdings valuation.
- **Gold Holdings & Bullion (Real-Time Live Valuation)** — Two-way Buy Rate / gram ↔ Total Purchase Cost calculator, hallmark purity multipliers (24K, 22K/916, 18K/750, 14K/585, 999, 995), real-time auto-computed Current Market Valuation on weight and purity changes, live MCX spot rate appreciation, 5 summary metrics including canonical **Weight in Tola ($1\text{ tola} = 11.6638\text{ g}$)**, and standalone Total Investment & Value as of date metrics.
- **Real Estate (Standalone Valuation)** — Property acquisition cost basis, current valuations as of date, and annual rental income yield percentages tracked independently from liquid family net worth.
- **Insurances** — Term, health, life, and motor policy registries with premium renewal timers and overdue status warnings.
- **Document Vault** — Secure attachment manager linked by asset class with expiry date tracking and upcoming deadline alerts.

### 🤖 AI Document Import & Assistant
- **Smart AI Import (Quarantine & Review Workflow)** — Zero silent database writes. Scans broker statements, gold invoices, FD certificates, or insurance receipts using multi-model Gemini Vision through a secure server-side proxy (`gemini-proxy` Edge Function) into a quarantined side-by-side verification modal with inline field editing, instant non-blocking saves, and document vault linking. Includes duplicate detection, financial validation, and entity disambiguation services.
- **Deterministic Intent Classifier** — Modularized client-side NLP engine parsing 17 financial intents (`NET_WORTH`, `PERFORMERS`, `MATURITY_TIMELINE`, `ALLOCATION_SPLIT`, `SPECIFIC_GOLD`, `SPECIFIC_FDS`, `INSURANCE_REMINDERS`, `FAMILY_BREAKDOWN`, etc.) with matched asset badge tags and zero hallucinated numbers. Intent evaluation is split into focused domain modules (`wealthIntents`, `assetIntents`, `timelineIntents`, `performanceIntents`).
- **Multi-Agent Wealth Strategist** — Conversational Wealth Strategist decomposing compound multi-clause financial reasoning queries into deterministic pure math domain tool calls (`findTaxHarvestingOpportunities`, `checkInsuranceCommitments`, `auditFixedDepositLock`, `cashFlowDeltaSolver`) with verified executive advisory reports and interactive simulation action chips.
- **Secure Gemini Proxy** — `gemini-proxy` Supabase Edge Function proxies all Gemini API calls server-side, protecting the API key from client exposure with IP-based sliding-window rate limiting (20 req/min), PIN validation, and graceful client fallback for offline/unconfigured environments.

### 🔍 Search & Navigation
- **Fuzzy Global Search Palette** — `Cmd/Ctrl + K` activated search palette with fuzzy matching across all assets, family members, and holdings.
- **Keyboard Shortcuts** — Global hotkeys for quick asset navigation, search, and actions.
- **Liquid Glass Floating Dock** — Suspended floating pill navigation with natural diffusion frosted glass, Apple SF Symbol selection states, scroll-aware collapse, and slide-up More drawer with categorized glass tiles and Smart Import quick trigger.

---

## 🖼️ Screenshots

The project maintains a comprehensive screenshot gallery under `screenshots/` organized by platform and theme:

```text
screenshots/
├── web/
│   ├── dark/       # 10 full-page captures (1920×1080 @ 2x Retina)
│   └── light/      # 10 full-page captures (1920×1080 @ 2x Retina)
└── mobile/
    ├── dark/        # 10 full-page captures (390×844 @ 2x Retina)
    └── light/       # 10 full-page captures (390×844 @ 2x Retina)
```

**Views captured**: Family Overview, Stocks & ETFs, Fixed Deposits, Recurring Deposits, SIP Mutual Funds, Gold Holdings, Real Estate, Insurance Cover, Document Vault, and Tax Harvesting — in both Dark and Light modes.

---

## 🛡️ Security Architecture & Threat Model

1. **Server-Side PIN Authentication (Fail-Closed)**:
   - Client-side PIN entries are hashed with SHA-256 (`crypto.subtle.digest`) and sent via the `X-App-Pin` header.
   - Supabase Edge Functions (`holdings-crud`, `verify-pin`, `snapshot-net-worth`, `market-data`, and `gemini-proxy`) validate this header directly against the server-side `APP_PIN_HASH` environment secret.
   - If the server PIN secret is missing or unconfigured, functions **Fail Closed (HTTP 503)** immediately.
   - Constant-time byte comparison (`timingSafeEqual`) across all PIN-validating Edge Functions prevents timing side-channel attacks.
2. **Brute-Force & CGNAT Rate-Limiting Protection**:
   - Composite IP and client device sliding window rate limiter (`MAX_FAILED_ATTEMPTS = 5`, `RATE_WINDOW_MS = 5 min`) protects all PIN-locked endpoints. Keying on `IP + Device Identifier` ensures individual failed attempts never lock out family members sharing the same mobile carrier CGNAT gateway (e.g., Jio, Airtel).
   - Exceeding attempts returns **HTTP 429 (Too Many Requests)** with standard `Retry-After` headers.
3. **Private Document Storage with Time-Limited Signed URLs**:
   - The `investment-documents` bucket is strictly **private (`public = false`)** with all direct public read/write policies dropped.
   - Attachments are accessed via short-lived signed URLs issued by PIN-authenticated Edge Functions (the client requests 60 seconds; the backend supports 60–3600 seconds with a 300-second default).
   - Storage upload handler unconditionally strips any client-provided UUID prefix and generates an authoritative server-side UUID to guarantee uniqueness and prevent collision or path spoofing. Client forms capture the server-confirmed `safePath` upon upload to eliminate path desynchronization.
   - Resilient directory-level fallback in `get_document_url` searches parent and sibling asset directories if an exact key is missing, auto-healing the PostgreSQL database record upon match.
   - Built-in secure in-tab document previewer renders image attachments centered in a dark viewport with quick download controls and PDF files in full-viewport iframes, circumventing modern browser top-frame blob URL restrictions.
   - Interactive attachment badges (`📎 {count} Doc(s)`) provide 1-click opening with tactile loading spinners and error toast alerts across all asset cards (Insurance, Gold, Real Estate, FD, RD, SIP, Document Vault).
4. **Zero-Trust Client-Side Document Encryption**:
   - Native W3C Web Crypto (`AES-GCM-256` + `PBKDF2` with 100,000 rounds of SHA-256) encrypts binary payloads on the client device prior to storage transmission; decrypts in-memory on demand with zero cloud API keys required.
5. **Biometric Hardware-Backed Authentication**:
   - WebAuthn platform authenticators enable 1-second FaceID, TouchID, and Windows Hello unlocking without transmitting credentials over the wire.
6. **Automatic Session Auto-Lock**:
   - Configurable inactivity timeout auto-locks the application, requiring PIN or biometric re-authentication.

---

## 💾 Data Resilience & Disaster Recovery

1. **Schema-Validated Full Backup & Restore**:
   - Unified export in JSON, CSV, and printable PDF statements.
   - The backup restore engine (`backupValidator.ts`) enforces envelope integrity, schema structure, and duplicate collision detection before applying restorations to the database.
2. **Client-Triggered Daily Net Worth Snapshots**:
   - Once per day upon a successful portfolio load, the application triggers the `snapshot-net-worth` Edge Function, which computes exact consolidated valuations across all asset classes and records historical timeline snapshots into `net_worth_history`.
3. **Offline-First IndexedDB Cache**:
   - Complete portfolio payloads are cached in IndexedDB (`idb-keyval`) for instant zero-skeleton PWA hydration before any network request occurs, eliminating layout shifts on repeat visits.

---

## 🏗️ Architecture & Tech Stack

The application strictly adheres to Clean Architecture and Domain-Driven Design:

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

- **Frontend**: React 18, TypeScript, Vite 8, Tailwind CSS, Custom SVG Iconography (`AppIcons.tsx`).
- **State & Caching**: SWR with 5-minute deduplication, IndexedDB offline cache (`idb-keyval`), and Fine-Grained React Context split (`PortfolioEntitiesContext`, `PortfolioStatusContext`, `PortfolioActionContext`).
- **Backend & Database**: Supabase PostgreSQL, 5 Deno Edge Functions (`holdings-crud`, `verify-pin`, `snapshot-net-worth`, `market-data`, `gemini-proxy`), Private Supabase Storage.
- **Workers**: Off-thread background Web Worker for Newton-Raphson XIRR cash flow solvers (`src/workers/`).
- **Routing**: React Router v7 with hash-based family-scoped routes (`/:family/home`, `/:family/:asset`).
- **PWA**: Workbox-powered service worker with instant takeover (`skipWaiting: true`, `clientsClaim: true`), auto-update on visibility change, and home-screen install banner.

---

## 📁 Project Structure

```text
project antigravity/
├── index.html                    # HTML entry point
├── e2e/                          # Playwright end-to-end test specs
│   ├── smoke.spec.ts             # 6 smoke test workflows
│   ├── crud.spec.ts              # 3 deep CRUD workflows
│   └── capture_all_views.spec.ts # Automated screenshot capture spec
├── screenshots/                  # Organized screenshot gallery
│   ├── web/dark/                 # 10 desktop dark mode captures
│   ├── web/light/                # 10 desktop light mode captures
│   ├── mobile/dark/              # 10 mobile dark mode captures
│   └── mobile/light/             # 10 mobile light mode captures
├── supabase/
│   ├── functions/                # 5 Deno Edge Functions
│   │   ├── gemini-proxy/         # Server-side Gemini AI proxy with rate limiting
│   │   ├── holdings-crud/        # Portfolio CRUD operations
│   │   ├── market-data/          # Multi-provider market quote proxy
│   │   ├── snapshot-net-worth/   # Daily net worth snapshot recorder
│   │   └── verify-pin/           # PIN authentication endpoint
│   └── migrations/               # PostgreSQL schema migrations
├── src/
│   ├── App.tsx                   # Lightweight entry gate with PIN Lock screen
│   ├── MainApp.tsx               # Context providers, routing, and dashboard load gates
│   ├── main.tsx                  # React DOM root mounting
│   ├── index.css                 # Global styles and design tokens (UI.md single source of truth)
│   ├── components/
│   │   ├── icons/
│   │   │   └── AppIcons.tsx      # Zero-dependency inline SVG icon library
│   │   ├── documents/            # Document Vault registry and secure attachment cards
│   │   │   └── DocumentVaultView.tsx
│   │   ├── fd/                   # Fixed Deposit cards, forms, and registry view
│   │   │   ├── DepositDetailsCard.tsx
│   │   │   ├── FDFormModal.tsx
│   │   │   ├── FixedDepositView.tsx
│   │   │   └── StandardFormFields.tsx
│   │   ├── gold/                 # Gold bullion cards, forms, and registry view
│   │   │   ├── GoldFormModal.tsx
│   │   │   ├── GoldHoldingCard.tsx
│   │   │   └── GoldHoldingView.tsx
│   │   ├── insurance/            # Insurance policy cards, forms, and registry view
│   │   │   ├── InsuranceFormModal.tsx
│   │   │   ├── InsurancePolicyCard.tsx
│   │   │   └── InsuranceView.tsx
│   │   ├── rd/                   # Recurring Deposit cards, forms, and registry view
│   │   │   ├── RDAccountCard.tsx
│   │   │   ├── RDFormModal.tsx
│   │   │   ├── RDInstallmentSchedule.tsx
│   │   │   └── RDView.tsx
│   │   ├── realestate/           # Real Estate cards, forms, and registry view
│   │   │   ├── RealEstateCard.tsx
│   │   │   ├── RealEstateFormModal.tsx
│   │   │   └── RealEstateView.tsx
│   │   ├── sip/                  # Mutual Fund SIP cards, forms, and registry view
│   │   │   ├── SIPAccountCard.tsx
│   │   │   ├── SIPFormFields.tsx
│   │   │   ├── SIPFormModal.tsx
│   │   │   └── SIPView.tsx
│   │   ├── stocks/               # Stocks & ETFs registry view
│   │   │   └── StocksView.tsx
│   │   ├── tax/                  # Tax harvesting analyzer view
│   │   │   └── TaxHarvestingView.tsx
│   │   ├── smart-import/         # AI document import pipeline components
│   │   │   ├── BatchQuarantineReview.tsx
│   │   │   ├── DuplicateWarningBanner.tsx
│   │   │   ├── ImportConfidenceBadge.tsx
│   │   │   ├── ImportDropZone.tsx
│   │   │   ├── ImportReviewForm.tsx
│   │   │   └── ImportSaveProgress.tsx
│   │   ├── ui/                   # Shared UI primitives
│   │   │   ├── AnimatedNumber.tsx
│   │   │   ├── AssetRegistryContainer.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── ChartSkeleton.tsx
│   │   │   ├── ContextMenu.tsx
│   │   │   ├── DocumentAttachmentField.tsx
│   │   │   ├── IconButton.tsx
│   │   │   ├── LazyViewport.tsx
│   │   │   ├── RegistryToolbar.tsx
│   │   │   ├── SegmentedControl.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── Sparkline.tsx
│   │   ├── AddFamilyModal.tsx    # Modal form to add new family members
│   │   ├── AddHoldingModal.tsx   # Modal form to add new stock holdings
│   │   ├── AppErrorBoundary.tsx  # Authenticated app-level crash recovery boundary
│   │   ├── AssetCardSkeleton.tsx # Reusable pulsing shimmer card wireframe for all registry views
│   │   ├── AssetTabContent.tsx   # Orchestrator component rendering the active asset registry view
│   │   ├── BarChart.tsx          # Portfolio comparison bar chart
│   │   ├── ChangePinModal.tsx    # Security modal managing PIN changes and biometric toggles
│   │   ├── ConfirmModal.tsx      # Custom styled backdrop modal replacing browser alerts
│   │   ├── DashboardError.tsx    # Full-page retry UI for API connection failures
│   │   ├── DashboardLoading.tsx  # Skeleton loader states for initial dashboard load
│   │   ├── DashboardWidgets.tsx  # Summary KPI and widget container
│   │   ├── EditStockModal.tsx    # Stock holding edit modal
│   │   ├── EmptyState.tsx        # Styled empty state placeholder with CTA
│   │   ├── ErrorBoundary.tsx     # Root shell fail-safe error boundary
│   │   ├── ExportPanel.tsx       # Export (CSV, PDF, JSON) and schema-validated restore engine
│   │   ├── FamilyTabBar.tsx      # Top tab bar switcher for family member portfolios
│   │   ├── FloatingAddMenu.tsx   # Quick floating menu to add assets
│   │   ├── Header.tsx            # Top bar with total value, P&L, Sync button, and overflow menu
│   │   ├── HoldingDetailDrawer.tsx # Responsive holding detail drawer
│   │   ├── InsightsPanel.tsx     # Allocation, performer, and reminder insight panels
│   │   ├── MobileAlertsView.tsx  # Mobile view display for active alerts
│   │   ├── MobileBottomNav.tsx   # Liquid Glass inspired floating tab bar
│   │   ├── MobileHomeSummary.tsx  # Mobile view dashboard summary
│   │   ├── MobileStatusBar.tsx   # Mobile fixed status bar
│   │   ├── Modal.tsx             # Core reusable styled backdrop modal wrapper
│   │   ├── NetWorthTimelineChart.tsx # Historical net worth area chart with date filtering
│   │   ├── PWAInstallBanner.tsx  # Native-like PWA home-screen install banner
│   │   ├── PieChart.tsx          # Asset allocation donut chart
│   │   ├── PinLockScreen.tsx     # Secure session-based PIN lock keypad gate screen
│   │   ├── PortfolioAssistant.tsx # Conversational AI portfolio assistant
│   │   ├── PortfolioTable.tsx    # Sortable holdings table with preset selectors & allocation column
│   │   ├── RenamePortfolioModal.tsx # Modal form to rename family member portfolios
│   │   ├── SearchBar.tsx         # Fuzzy global search palette (Cmd/Ctrl + K)
│   │   ├── SectionErrorBoundary.tsx # Nested error boundary for asset-specific dashboard components
│   │   ├── SmartImportModal.tsx  # AI document & CSV smart extraction modal
│   │   ├── SummaryCards.tsx      # KPI cards — invested, current, P&L, today
│   │   └── Toast.tsx             # Global non-blocking notification toast component
│   ├── layouts/
│   │   ├── AppShell.tsx          # Main dashboard layout (responsive switcher, lazy panel views)
│   │   ├── AppShellModals.tsx    # Extracted modal orchestrator for AppShell
│   │   ├── DesktopSidebar.tsx    # Desktop sidebar navigation
│   │   └── HomeDashboardWidgets.tsx # Home page 2x2 equalized dashboard widget grid
│   ├── contexts/
│   │   ├── MobileContext.tsx     # Mobile viewport state context
│   │   ├── PortfolioContext.tsx  # Global portfolio state provider (Entities, Status, Actions)
│   │   ├── PrivacyContext.tsx    # Balance visibility mask state
│   │   ├── ThemeContext.tsx      # Dark / Light theme provider
│   │   └── ToastContext.tsx      # Global notification toast provider
│   ├── hooks/
│   │   ├── useAlerts.ts          # Evaluates warnings, contains visible/dismissed states
│   │   ├── useAnimatedCounter.ts # Smooth number animation ticker hook
│   │   ├── useAssetFilterSort.ts # Asset registry search and multi-field sorting
│   │   ├── useAssetModal.ts      # Reusable asset modal state manager
│   │   ├── useAutoLock.ts        # Inactivity session auto-lock
│   │   ├── useDebounce.ts        # Generic value debounce hook
│   │   ├── useDocumentStorage.ts # Document storage hook
│   │   ├── useIsMobile.ts        # Centralized matchMedia viewport hook
│   │   ├── useKeyboardShortcuts.ts # Global hotkey listeners
│   │   ├── useLongPress.ts       # Tactile long-press gesture detector
│   │   ├── useModalState.ts      # Modal visibility state coordinator
│   │   ├── usePortfolioData.ts   # Backward-compatible facade for domain hooks
│   │   ├── usePortfolioInsights.ts # Portfolio health scoring and insights engine
│   │   ├── usePullToRefresh.ts   # Mobile pull-to-refresh gesture with haptic feedback
│   │   └── useSwipeNavigation.ts # Mobile swipe navigation between asset tabs
│   ├── domains/                  # Clean Architecture domain models, calculations, services, and repositories
│   │   ├── ai/                   # AI assistant intent classifier, wealth strategist, and tools
│   │   │   ├── assistant/
│   │   │   │   ├── assistantEngine.ts
│   │   │   │   ├── assistantTypes.ts
│   │   │   │   ├── intentClassifier.ts
│   │   │   │   ├── wealthStrategistEngine.ts
│   │   │   │   └── intents/      # Domain-specific intent modules
│   │   │   └── index.ts
│   │   ├── assets/               # Domain-specific financial compounding and valuations (FD, RD, SIP, Gold)
│   │   ├── performance/          # Pure financial math: Newton-Raphson XIRR, CAGR, weighted age, benchmarks
│   │   ├── portfolio/            # Portfolio domain hooks, services, calculations, backup schemas
│   │   ├── smart-import/         # AI document import pipeline
│   │   │   ├── services/
│   │   │   │   ├── duplicateDetectionService.ts
│   │   │   │   ├── entityDisambiguationService.ts
│   │   │   │   ├── evidenceHeatmapService.ts
│   │   │   │   ├── financialValidationService.ts
│   │   │   │   └── importPersistenceService.ts
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   └── taxation/             # Indian Income Tax FY24-25 capital gains & tax loss harvesting
│   ├── infrastructure/           # Infrastructure implementations
│   │   ├── cache/                # IndexedDB offline hydration and SWR configuration
│   │   ├── logging/              # Privacy-safe credential-redacting logger
│   │   ├── market-data/          # Multi-provider market quote service (Yahoo, AMFI, MCX)
│   │   └── supabase/             # Supabase repositories implementing domain repository contracts
│   ├── shared/                   # Shared constants and error hierarchy
│   │   ├── constants.ts
│   │   └── errors/
│   │       └── AppError.ts       # Standardized error hierarchy (Validation, Repository, Sync, MarketData, Auth)
│   ├── workers/
│   │   ├── xirr.worker.ts        # Off-thread Newton-Raphson XIRR Web Worker
│   │   └── xirrClient.ts         # Worker message proxy client
│   ├── types/                    # TypeScript type definitions
│   └── utils/                    # Pure utility functions (29 modules)
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml            # CI/CD: lint → typecheck → test → build → GitHub Pages deploy
│   │   └── e2e.yml               # Playwright E2E CI workflow
│   └── dependabot.yml            # Automated dependency updates
├── GEMINI.md                     # Full architecture & AI agent navigation guide
├── UI.md                         # Design token single source of truth
├── CONTRIBUTING.md               # Contributor guidelines
└── package.json
```

---

## 💾 Database Schema & Table Mappings

| Asset Tab / UI Mode | Supabase PostgreSQL Table | Core Compounding / Valuation Rule |
| :--- | :--- | :--- |
| **Stocks & ETFs** | `holdings` (via `holdings-crud`) | Live Yahoo Finance quote × share quantity |
| **Fixed Deposit (FD)** | `fixed_deposits` | Half-yearly compounding (FD interest rates) + Indian Bank Presets |
| **Recurring Deposit (RD)** | `rd_accounts` | Quarterly compounding + Contribution dates array |
| **SIP Mutual Fund (SIP)** | `sip_accounts` | Live AMFI NAV scheme price multiplication & Presets |
| **Gold Holding** | `gold_holdings` | Gram weight × purchase/live MCX gold rate × Hallmark multiplier |
| **Real Estate** | `real_estate` | Current valuation + rental income yield |
| **Insurance** | `insurances` | Sum assured + premium renewal warning tracking |
| **Document Vault** | `documents` | Expiry tracking + asset reference linking |
| **Net Worth Snapshot** | `net_worth_history` | Historical daily total and asset-class breakdown |
| **Market Cache** | `market_price_cache` | 2-minute cached Yahoo Finance stock quotes |

---

## 🧪 Testing & Verification Pipeline

The repository enforces strict verification across unit, integration, and browser end-to-end suites:

```bash
# Run Vitest test suite across 54 test files and 301 tests (100% passing)
npm test

# Run Playwright browser E2E tests (9 tests: 6 smoke + 3 deep CRUD workflows)
npm run test:e2e

# Run complete verification pipeline: ESLint + TypeScript typecheck + Vitest + Vite build
npm run verify
```

### Test Distribution

| Test Location | Files | Description |
| :--- | :--- | :--- |
| `src/domains/__tests__/` | 14 | Pure domain calculations (portfolio totals, tax harvesting, gold valuation, XIRR benchmarks, wealth strategist, entity disambiguation, evidence heatmap, auth security) |
| `src/utils/__tests__/` | 24 | Utility tests (formatters, date utils, math, crypto, biometrics, storage, AI extraction, assistant, security audit, performance) |
| `src/hooks/__tests__/` | 4 | Hook tests (alerts, asset filter/sort, auto-lock, debounce) |
| `src/infrastructure/__tests__/` | 1 | Market data fallback chain tests |
| `src/components/__tests__/` | 4 | Component tests (Header, RegistryToolbar, PinLockScreen, Modal) |
| `src/domains/portfolio/services/__tests__/` | 2 | Domain service tests (portfolioService, offlineOutbox) |
| `src/domains/smart-import/__tests__/` | 2 | Smart import tests (financialValidation, duplicateDetection) |
| `src/infrastructure/cache/__tests__/` | 1 | Offline cache hydration tests |
| `src/infrastructure/logging/__tests__/` | 1 | Credential redaction and logging tests |
| **Total** | **54 files / 301 tests** | **100% passing** |

---

## ⚡ Performance Optimizations

1. **Sub-Millisecond Aggregation (< 1ms)**: Multi-portfolio aggregation for 1,000+ assets in ~0.2ms and 10,000 assets in ~0.7ms (well within the 16.6ms 60 FPS frame budget).
2. **Instant PWA Zero-Skeleton Hydration**: Initial render hydrates synchronously from IndexedDB offline cache before any network request occurs, eliminating layout shifts.
3. **Mobile Offscreen Containment (`content-visibility: auto`)**: Un-virtualized holding cards skip layout and style computation until scrolled into the viewport, while virtualized tables bypass intrinsic sizing to prevent layout shifts.
4. **Zero-Latency Touch & GPU Layer Promotion**: Global `touch-action: manipulation` eliminates the 300ms mobile tap delay. Fixed bars and the Liquid Glass tab bar promote to GPU compositor layers.
5. **Idle Chunk Pre-warming**: `requestIdleCallback` pre-warms the top 4 heaviest asset view chunks during device idle time for zero-skeleton tab switching.
6. **Off-Thread Worker Infrastructure**: Background Web Worker for Newton-Raphson cash flow calculations (`calculateXIRRAsync`) during bulk batch workloads > 10,000 cash flows; synchronous calculation is used by default for sub-millisecond execution.
7. **Render Memoization & Virtualization**: Registry tables utilize `react-window` virtualization and `React.memo` with strict equality comparators on card components.
8. **PWA Auto-Update**: Workbox instant takeover (`skipWaiting: true`, `clientsClaim: true`) and document `visibilitychange` update listeners.
9. **Brotli & Gzip Compression**: Vite build produces pre-compressed `.br` and `.gz` assets via `vite-plugin-compression2`.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v20+ required, v22 LTS recommended; `engines` set to `>=20`)
- npm (v10+)
- A Supabase project

### 2. Installation
```bash
git clone https://github.com/mohanlalam/finance.git
cd finance
npm install
```

### 3. Environment Variables & Secrets
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_APP_PIN=your-4-digit-pin # Used only by local Playwright E2E tests (e2e/crud.spec.ts); never bundled into client JS
VITE_GEMINI_API_KEY=your-gemini-api-key # Optional fallback if gemini-proxy is unconfigured
```

Set the server-side secrets in Supabase (never expose in client `.env`):
```bash
# PIN hash (SHA-256 of PIN) for fail-closed Edge Function authentication
npx supabase secrets set APP_PIN_HASH="<sha256_hash_of_pin>"

# Gemini API key for the server-side gemini-proxy Edge Function
npx supabase secrets set GEMINI_API_KEY="<your-gemini-api-key>"
```

### 4. Database Setup & Edge Functions
```bash
# Deploy PostgreSQL schema migrations
npx supabase db push

# Deploy all 5 Deno Edge Functions
npx supabase functions deploy --project-ref <project-ref> --no-verify-jwt
```

### 5. Run Locally
```bash
npm run dev -- --host --port 5173
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| **Dev Server** | `npm run dev` | Start Vite dev server with HMR |
| **Unit Tests** | `npm test` | Run Vitest unit & integration tests (54 test files / 301 tests, 100% passing) |
| **E2E Tests** | `npm run test:e2e` | Run Playwright browser E2E tests (9 tests across smoke and CRUD specs) |
| **Build** | `npm run build` | Production build to `dist/` |
| **Preview** | `npm run preview` | Preview the production build locally |
| **Lint** | `npm run lint` | Run ESLint checks |
| **Type Check** | `npm run typecheck` | Run TypeScript compiler checks (no emit) |
| **Verify All** | `npm run verify` | Run lint + typecheck + test + build in sequence |
| **Mobile Sync** | `npm run mobile:sync` | Build web assets and sync Capacitor Android project (requires local `../android/mobile` directory) |
| **Mobile Run** | `npm run mobile:run` | Build, sync, and launch Capacitor Android app in emulator (requires local `../android/mobile` directory) |

> **Note on Mobile Scripts**: The scripts `npm run mobile:sync` and `npm run mobile:run` depend on an external sibling directory (`../android/mobile`) containing the Capacitor Android shell and are intended for local Android mobile development setups.

---

## 🌐 Automated CI/CD

Two GitHub Actions workflows are configured in `.github/workflows/`:

| Workflow | File | Trigger | Pipeline |
|---|---|---|---|
| **Deploy** | `deploy.yml` | Push to `main` | ESLint → TypeScript check → Vitest → Vite build → GitHub Pages deploy |
| **E2E** | `e2e.yml` | Push / PR | Playwright browser E2E test suite |

Dependabot is configured via `.github/dependabot.yml` for automated dependency update PRs.

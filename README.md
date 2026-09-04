# 🌌 Family Portfolio Vault

A high-performance, privacy-first multi-asset portfolio tracker designed to manage consolidated family wealth. Elevated with the **Antigravity Cyber-Zen Design Aesthetic** (weightless suspension, deep cosmic obsidian canvas `#040711`, frosted glassmorphism `backdrop-blur-2xl`, glowing neon metrics, and floating dock navigation), Clean Architecture v2.0, zero-dependency SVG iconography, sub-second instant loads, and multi-provider market quote integration.

---

## ✨ Key Features

### 🌌 Antigravity Cyber-Zen UI & Visual Experience
- **Weightless Suspension & Zero-G Atmosphere** — Replaces grounded footers with atmospheric suspension over a deep cosmic void (`#040711`) layered with multi-point ambient radial nebula meshes (cyan `#06b6d4`, celestial violet `#a855f7`, and emerald aura `#10b981`).
- **Glassmorphic Floating Surfaces** — Translucent cards with `backdrop-blur-2xl`, 1px luminous edge highlights, and zero-G hover ascension.
- **Cyber-Zen Wide-Tracked Typography & Glowing Metrics** — Wide-tracked category micro-tags with luminous glowing profit (+emerald), loss (-rose), and bullion (amber) indicators.
- **Floating Island Navigation** — Dynamic Island frosted header and floating mobile bottom dock with spring physics.

### 📊 Financial Analytics & Visualizations
- **Consolidated Financial Net Worth Timeline** — Responsive SVG area chart with interactive hover cards plotting liquid/deposit historical wealth appreciation across Stocks, Fixed Deposits, RDs, and Mutual Funds.
- **Asset Allocation Donut** — Multi-category distribution chart across Stocks, Fixed Deposits, RDs, Mutual Funds, Gold Bullion, and Real Estate.
- **Live Market Data Hub** — Multi-provider quotes coordinator with automated background polling, in-memory TTL caching, and offline fallback (Yahoo Finance for equities, AMFI India for Mutual Fund NAVs, and MCX/IBJA for bullion).
- **Tax Loss Harvesting Opportunity Finder** — Indian Income Tax FY24-25 analyzer distinguishing equity STCG (20%) / LTCG (12.5% over ₹1.25L) from debt and gold slab rates.

### 💼 Multi-Asset Registry Suite (Unified Single-Banner Architecture)
- **Unified Single-Banner Architecture** — All non-stock asset classes render exactly ONE top banner aggregating all family holdings with domain-essential metrics and interactive 1-click member filters (`Rammohan`, `Padmavathi`, `Sai Laxmi`), followed by holdings grouped cleanly by family member below.
- **Ultra-Compact Mobile Layout** — Tuned for mobile screens (`< 768px`) with a side-by-side 3-column member breakdown (`grid-cols-3 gap-1`), high-density 2x2 metric ribbons (`p-1.5`), and 50/50 balanced top badges (`flex-1 sm:flex-initial`), saving **~65% vertical screen space**.
- **Fixed Deposits (FD)** — Compounded interest calculations (strictly Indian banking half-yearly compounding $n=2$), auto-suggestions for all major Indian banks, maturity date timeline progress bars, and linked deposit receipts.
- **Recurring Deposits (RD)** — Multi-month installment tracking with Indian bank datalists, paid vs. overdue status tracking, and one-click installment recording.
- **Mutual Fund SIPs** — Real-time scheme tracking via AMFI India NAV automation, top Indian scheme presets (Parag Parikh, Quant, Mirae, etc.), and unit holdings valuation.
- **Gold Holdings & Bullion (Real-Time Live Valuation)** — Two-way Buy Rate / gram ↔ Total Purchase Cost calculator, hallmark purity multipliers (24K, 22K/916, 18K/750, 14K/585), real-time auto-computed Current Market Valuation on weight and purity changes, live MCX spot rate appreciation, 5 summary metrics including canonical **Weight in Tola ($1\text{ tola} = 11.6638\text{ g}$)**, and standalone Total Investment & Value as of date metrics.
- **Real Estate (Standalone Valuation)** — Property acquisition cost basis, current valuations as of date, and annual rental income yield percentages tracked independently from liquid family net worth.
- **Insurances** — Term, health, life, and motor policy registries with premium renewal timers and overdue status warnings.
- **Document Vault** — Secure attachment manager linked by asset class with expiry date tracking and upcoming deadline alerts.

### 🤖 AI Document Import & Assistant
- **Smart AI Import (Quarantine & Review Workflow)** — Zero silent database writes. Scans broker statements, gold invoices, FD certificates, or insurance receipts using multi-model Gemini Vision through a secure server-side proxy (`gemini-proxy` Edge Function) into a quarantined side-by-side verification modal with inline field editing, instant non-blocking saves, and document vault linking.
- **Deterministic Intent Classifier** — Modularized client-side NLP engine parsing 17 financial intents (`NET_WORTH`, `PERFORMERS`, `MATURITY_TIMELINE`, `ALLOCATION_SPLIT`, `SPECIFIC_GOLD`, `SPECIFIC_FDS`, `INSURANCE_REMINDERS`, `FAMILY_BREAKDOWN`, etc.) with matched asset badge tags and zero hallucinated numbers. Intent evaluation is split into focused domain modules (`wealthIntents`, `assetIntents`, `timelineIntents`, `performanceIntents`).
- **Secure Gemini Proxy** — `gemini-proxy` Supabase Edge Function proxies all Gemini API calls server-side, protecting the API key from client exposure with IP-based sliding-window rate limiting (20 req/min), PIN validation, and graceful client fallback for offline/unconfigured environments.

---

## 🛡️ Security Architecture & Threat Model

1. **Server-Side PIN Authentication (Fail-Closed)**:
   - Client-side PIN entries are hashed with SHA-256 (`crypto.subtle.digest`) and sent via the `X-App-Pin` header.
   - Supabase Edge Functions (`holdings-crud`, `verify-pin`, `snapshot-net-worth`, and `market-data`) validate this header directly against the server-side `APP_PIN_HASH` environment secret.
   - If the server PIN secret is missing or unconfigured, functions **Fail Closed (HTTP 503)** immediately.
2. **Brute-Force & Rate-Limiting Protection**:
   - IP-based sliding window rate limiter (`MAX_FAILED_ATTEMPTS = 5`, `RATE_WINDOW_MS = 5 min`) protects all PIN-locked endpoints.
   - Exceeding attempts returns **HTTP 429 (Too Many Requests)** with standard `Retry-After` headers.
3. **Private Document Storage with Time-Limited Signed URLs**:
   - The `investment-documents` bucket is strictly **private (`public = false`)** with all direct public read/write policies dropped.
   - Attachments are accessed via short-lived signed URLs issued by PIN-authenticated Edge Functions (the client requests 60 seconds; the backend supports 60–3600 seconds with a 300-second default).
   - Client-side storage path generators enforce UUID path randomization and sanitization against directory traversal (`../`).
4. **Biometric Hardware-Backed Authentication**:
   - WebAuthn platform authenticators enable 1-second FaceID, TouchID, and Windows Hello unlocking without transmitting credentials over the wire.

---

## 💾 Data Resilience & Disaster Recovery

1. **Schema-Validated Full Backup & Restore**:
   - Unified export in JSON, CSV, and printable PDF statements.
   - The backup restore engine (`backupValidator.ts`) enforces envelope integrity, schema structure, and duplicate collision detection before applying restorations to the database.
2. **Client-Triggered Daily Net Worth Snapshots**:
   - Once per day upon a successful portfolio load, the application triggers the `snapshot-net-worth` Edge Function, which computes exact consolidated valuations across all asset classes and records historical timeline snapshots into `net_worth_history`.

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
- **Backend & Database**: Supabase PostgreSQL, Deno Edge Functions, Private Supabase Storage.
- **Workers**: Off-thread background Web Worker for Newton-Raphson XIRR cash flow solvers (`src/workers/`).

---

## 📁 Project Structure

```text
project antigravity/
├── index.html                    # HTML entry point
├── e2e/                          # Playwright end-to-end test specs (smoke.spec.ts, crud.spec.ts)
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
│   │   ├── tax/                  # Tax harvesting analyzer view
│   │   │   └── TaxHarvestingView.tsx
│   │   ├── ui/                   # Shared UI primitives (Buttons, Modals, Sparklines, ContextMenu)
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
│   │   ├── DataQualityHealthModal.tsx # Data quality audit modal with resolution tracking
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
│   │   ├── MobileBottomNav.tsx   # Sticky mobile tabs navigation bar with alert badge count
│   │   ├── MobileHomeSummary.tsx # Mobile view dashboard summary
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
│   │   ├── SectionErrorBoundary.tsx # Nested React error boundary for asset-specific dashboard components
│   │   ├── SmartImportModal.tsx  # AI document & CSV smart extraction modal
│   │   ├── SummaryCards.tsx      # KPI cards — invested, current, P&L, today
│   │   └── Toast.tsx             # Global non-blocking notification toast component
│   ├── domains/                  # Clean Architecture domain models, calculations, services, and repositories
│   │   ├── ai/                   # AI assistant intent classifier and deterministic tools
│   │   ├── assets/               # Domain-specific financial compounding and valuations (FD, RD, SIP, Gold)
│   │   ├── data-quality/         # Portfolio data health scoring rules
│   │   ├── performance/          # Pure financial math: Newton-Raphson XIRR, CAGR, weighted age
│   │   ├── portfolio/            # Portfolio domain hooks, services, calculations, backup schemas
│   │   └── taxation/             # Indian Income Tax FY24-25 capital gains & tax loss harvesting
│   ├── infrastructure/           # Infrastructure implementations
│   │   ├── cache/                # IndexedDB offline hydration and SWR configuration
│   │   ├── logging/              # Privacy-safe credential-redacting logger
│   │   ├── market-data/          # Multi-provider market quote service (Yahoo, AMFI, MCX)
│   │   └── supabase/             # Supabase repositories implementing domain repository contracts
│   ├── layouts/
│   │   ├── AppShell.tsx          # Main dashboard layout (responsive switcher, lazy panel views)
│   │   └── DesktopSidebar.tsx    # Desktop sidebar navigation
│   ├── contexts/
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
│   │   ├── useIsMobile.ts        # Centralized matchMedia viewport hook
│   │   ├── useKeyboardShortcuts.ts # Global hotkey listeners
│   │   ├── useLongPress.ts       # Tactile long-press gesture detector
│   │   ├── useModalState.ts      # Modal visibility state coordinator
│   │   ├── usePortfolioData.ts   # Backward-compatible portfolio state facade
│   │   ├── usePortfolioInsights.ts # Computes allocation, performer, and reminder insights
│   │   ├── usePullToRefresh.ts   # Tactile mobile pull-to-refresh hook
│   │   └── useSwipeNavigation.ts # Touch swipe gesture tracking for mobile tab layout
│   ├── workers/
│   │   ├── xirr.worker.ts        # Background Web Worker for Newton-Raphson XIRR cash flow calculation
│   │   └── xirrClient.ts         # Asynchronous Promise client with sync fallback
│   ├── types/
│   │   └── portfolio.ts          # Core TypeScript interfaces (Holding, NetWorthSnapshot, etc.)
│   └── utils/                    # Shared pure utility modules (math, dates, formatters, storage, familyMemberConfig)
├── supabase/
│   ├── functions/                # Deno Edge Functions (gemini-proxy, holdings-crud, market-data, snapshot-net-worth, verify-pin)
│   └── migrations/               # PostgreSQL schema migrations, indexes, and RLS policies
```

---

## 🧪 Testing & Verification Pipeline

The repository enforces strict verification across unit, integration, and browser end-to-end suites:

```bash
# Run Vitest test suite across 50 test files and 260 tests (100% passing)
npm test

# Run Playwright browser E2E tests (9 tests: 6 smoke + 3 deep CRUD workflows)
npm run test:e2e

# Run complete verification pipeline: ESLint + TypeScript typecheck + Vitest + Vite build
npm run verify
```

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
VITE_APP_PIN=your-4-digit-pin
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

# Deploy all Deno Edge Functions
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
| **Unit Tests** | `npm test` | Run Vitest unit & integration tests (50 test files / 260 tests) |
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

## 🌐 Automated CI/CD Deployment

A GitHub Actions workflow is configured in `.github/workflows/deploy.yml` to automatically execute linters, strict TypeScript checks, Vitest test suites, and production builds before deploying to GitHub Pages on every push to the `main` branch.

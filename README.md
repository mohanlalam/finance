# 💼 Family Portfolio Tracker

A premium, interactive web application designed to track and manage multi-asset portfolios for the entire family. The dashboard offers visual analytics, live market pricing for stocks & ETFs, and detailed registry management for Fixed Deposits, Gold, Real Estate, Insurance, and Documents.

---

## ✨ Features

### 📊 Financial Dashboard & Analytics
- **Asset Allocation Chart** — Interactive donut chart showcasing distribution across Stocks, FDs, Gold, and Real Estate.
- **Net Worth Growth Timeline** — Responsive SVG line/area chart with interactive tooltip nodes plotting historical compound wealth appreciation.
- **P&L Visuals** — Direct indications of profits and losses with custom positive/negative indicators and INR formatting.
- **Market Pricing** — Automated background refresh for stock and ETF holdings (15-minute intervals) with on-demand sync and cached quotes.

### 💡 Portfolio Insights & Rebalancing
- **Performance Highlights** — Instantly view top stock holdings, top gainers, top losers, and today's biggest absolute price movement.
- **Portfolio Health Score** — Automated multi-factor evaluation engine (0-100) scoring diversification, active SIPs, emergency fund coverage (capped at 20 points), stock concentration, and active insurances (raised to 15 points).
- **Rebalancing recommendations** — Smart allocation rebalancing engine displaying exact cash buy/sell suggestions from target drifts, ignoring tiny drifts under an explicit threshold `MIN_ACTION = 5000`.
- **Asset Allocation Drift & Targets** — Tracks deviations between actual asset splits and targets. Features **User-Configurable Allocation Targets** via a settings modal.
- **Portfolio Concentration Alerts** — Warnings if any single equity exceeds 15% of the total portfolio value.

### 🤖 AI Portfolio Assistant
- **Intent-Based NLP Classifier** — Pre-filters queries into structured intents (e.g. performers, maturities, allocations) to eliminate false positive keywords before parameter extraction.

### 💼 Portfolio Management & Navigation
- **Global Cross-Asset Search** — Live fuzzy search bar across stocks, banks, gold items, properties, and documents. Instantly jump to the tab and scroll directly to the matching asset.
- **Family View Switcher** — Toggle between **Family Overview** (combined family wealth) and individual member pages (My Portfolio, Mother's Portfolio, Wife's Portfolio).
- **Portfolio Renaming** — Easily change family display labels directly from the UI.
- **Dynamic Add/Edit** — Create and edit asset entries dynamically with live calculations.
- **Holdings Table Sorting Presets** — Quick presets to sort holdings by current value, total P&L, today's percent movement, or overall allocation percent.
- **Mobile Bottom Navigation** — Fixed bottom bar for quick tabs swapping on narrow mobile viewports, featuring an **Alert Count Badge** on the Home tab.

### ⚡ High Performance & Responsiveness
- **App Icons inline SVG System** — Replaced all external `lucide-react` icons inside critical path modules (such as Header, BottomNav, summary panels, and error boundaries) with a custom inline SVG library (`AppIcons.tsx`). This completely isolates `lucide-react` to lazy-loaded chunks and prevents large dependency footprints during initial mount.
- **Dynamic Tab Preloading** — Lazily loads all primary asset views and tables (`FixedDepositView`, `RDView`, `SIPView`, `GoldHoldingView`, `RealEstateView`, `InsuranceView`, `DocumentVaultView`, and `PortfolioTable`). Uses an IIFE single-pass preloader on mount to fetch all bundle chunks in parallel, eliminating UI lag on swipe navigation.
- **Asynchronous Web Workers** — Offloads heavy computations (Newton-Raphson XIRR solvers, multi-factor Health Score scoring, and rebalancing recommendations) to background threads (`src/workers/`) with synchronous fallbacks and detailed diagnostics warnings in case of worker thread initialization failures.
- **List Virtualization & Row Keys** — Uses `react-window` to virtualize large registry listings (>8 accounts) to keep scrolling fluid and render times minimal. Row key elements are explicitly bound to asset IDs (`itemKey`) to optimize DOM recycling and prevent rendering glitches.
- **Lazy Chart Loading** — Uses responsive SVG charts (`NetWorthTimelineChart`, `PieChart`, `BarChart`) code-split and loaded dynamically when navigating to the analytics view.
- **Lock Screen Code-Splitting** — Dynamically code-splits the context providers and routing (`MainApp`) as well as the main dashboard layout (`AppShell`) and components (like search bars and insights), keeping the entry bundle size tiny so the zero-dependency PIN Lock screen loads instantly on mobile networks.
- **Advanced Caching & Focus Resume** — Employs `SWR` for remote state cache validation (customized with a 5-minute `dedupingInterval` and `errorRetryCount: 2`), IndexedDB local caches (`idb-keyval`) for instant stale-while-revalidate loads (invalidated on write/mutations), a 5-minute time-gate cooldown on tab focus resume reloads, module-level in-memory caching of Supabase PIN hashes, async IndexedDB caching for live Mutual Fund NAV fetches, and a ref-based resolver registry queue in `refreshSnapshot` to prevent hanging promises.
- **Mobile Summary Optimization** — Optimizes `MobileHomeSummary` using `React.memo` to skip re-renders from parent data/price updates and collapses 9 duplicate `reduce()` calls into a single-pass `useMemo` loop.
- **Vite & Rollup Build Enhancements** — Targets modern engines (`es2020`) to save 10-15% of chunk weight, minifies CSS, uses Rollup `manualChunks` to split supplier vendors, and enforces complete pre-caching of all JS and CSS chunks using workbox configurations in the PWA plugin for true offline availability.

### 📂 Multi-Asset Registry & Reminders
- **Fixed Deposits (FD)** — Real-time compounded interest tracking (compounded half-yearly), maturity date tracking, timeline progress bars, and document attachments.
- **Recurring Deposits (RD)** — Multi-month installment tracking with an interactive month-by-month grid list, paid vs. overdue status tracking, and a one-click **+ Pay** action button to record monthly contributions.

- **SIP Mutual Funds** — Real-time mutual fund tracking via scheme automation. Integrate Scheme Codes with `api.mfapi.in` (including a 4-hour `sessionStorage` cache) to dynamically fetch live NAVs and calculate current portfolio valuations based on units owned.
- **Gold Holdings** — Weight tracking, purity selection (24K, 22K, etc.), cost basis vs. current valuation appreciation.
- **Real Estate** — Property value trackers, locations, acquisition dates, monthly rental yield calculations, and empty-state CTA redirection.
- **Insurances** — Health, term, life, and motor policy registries with automated renewal timers and status alerts.
- **Document Vault & Reminders** — Secure file manager linked by asset class. Enter optional document expiry dates to see warning badges, track upcoming deadlines, and sort expiring files first.
- **Notes & Remarks Field** — Support for notes on all asset registries (FDs, Gold, Real Estate, Insurance) with a StickyNote icon representation in the dashboard list.

### 🔔 Custom Modals & In-App Smart Alerts
- **Dismissible Alerts Banner** — Displaying warning alerts for stocks hitting 52-week highs/lows, FDs maturing within 15 days, insurance premiums due within 30 days, and family portfolio swings.
- **Custom Confirmation Modals** — Eliminates native browser alert/confirm blocking popups, replacing them with custom-styled, theme-aware overlays.

### 📥 Import / Export Controls
- **CSV Import Modal** — Bulk import stock holdings from any CSV file with field column-mapping, error logs, and a dry-run preview before committing to database.
- **Backup & Export Options** — Standardized Excel/CSV export for all assets, formatted JSON backups, and print-ready styled PDF reports.

### 🔒 Security & Reliability
- **PIN Lock Screen** — Optional session-based PIN lock screen to prevent unauthorized access to sensitive family wealth data. Configurable via environment variables.
- **Error Boundaries & Loaders** — App-wide and component-specific React error boundaries coupled with custom skeleton loaders to enhance resilience.

---

## 🏗️ Tech Stack

### Frontend
- **React 18** — Component-based UI with hooks
- **TypeScript** — End-to-end type safety
- **Vite 5 / 8** — Lightning-fast dev server and optimized builds
- **Tailwind CSS 3** — Utility-first styling
- **AppIcons** — Custom zero-dependency inline SVG iconography system
- **SWR ^2.4.1** — Stale-while-revalidate data fetching and caching
- **react-window ^1.8.10** — Grid and list virtualization
- **idb-keyval ^6.2.5** — Minimalistic IndexedDB wrapper for local cache storage

### Backend (Supabase)
- **PostgreSQL** — Relational database tables for portfolios, holdings, FDs (`fixed_deposits`), RDs (`rd_accounts`), Mutual Funds (`sip_accounts`), gold, real estate, insurances, documents, and net worth history.
- **Supabase Storage** — Secure file storage for financial and insurance document attachments.
- **Edge Functions (Deno)** — Serverless functions for:
  - `holdings-crud` — Secure DB access and operations (PIN-locked).
  - `market-data` — Yahoo Finance live quotes lookup and server-side caching.
  - `snapshot-net-worth` — Automated daily net worth calculation and logging.

### Mobile & Hybrid
- **Capacitor** — Package and sync assets to run natively on mobile platforms (Android).

---

## 📁 Project Structure

```
project antigravity/
├── index.html                    # HTML entry point
├── src/
│   ├── App.tsx                   # Root component — lightweight, zero-dependency PIN screen gate
│   ├── MainApp.tsx               # Lazy-loaded main app shell container (contexts, routes, load gates)
│   ├── main.tsx                  # React DOM mount
│   ├── index.css                 # Global styles & design tokens (UI.md single source of truth)
│   ├── vite-env.d.ts             # Vite type declarations
│   ├── components/
│   │   ├── icons/
│   │   │   └── AppIcons.tsx      # Inline SVG icon library replacing lucide-react on critical rendering paths
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
│   │   ├── AlertsBanner.tsx      # Banners showing active notifications (52w high/low, FD due, etc.)
│   │   ├── AppErrorBoundary.tsx  # Global React error boundary component
│   │   ├── AssetCardSkeleton.tsx # Reusable pulsing shimmer card wireframe for all registry views
│   │   ├── AssetTabContent.tsx   # Orchestrator component rendering the active asset registry view
│   │   ├── BarChart.tsx          # Portfolio comparison bar chart
│   │   ├── ChangePinModal.tsx    # Security modal managing PIN changes and biometric toggles
│   │   ├── ConfirmModal.tsx      # Custom styled backdrop modal replacing native browser confirm/alert
│   │   ├── DashboardError.tsx    # Full-page retry UI for API/Supabase connection failures
│   │   ├── DashboardLoading.tsx  # Skeleton loader states for dashboard fetch
│   │   ├── DashboardWidgets.tsx  # Summary widgets container
│   │   ├── DataQualityHealthModal.tsx # Data quality audit modal with resolution tracking
│   │   ├── EditStockModal.tsx    # Stock holding edit modal
│   │   ├── EmptyState.tsx        # Styled empty state placeholder with CTA
│   │   ├── ErrorBoundary.tsx     # Generic component-level error boundary
│   │   ├── ExportPanel.tsx       # Export (CSV, PDF, JSON) and schema-validated restore engine
│   │   ├── FamilyTabBar.tsx      # Top tab bar switcher for family member portfolios
│   │   ├── FloatingAddMenu.tsx   # Quick floating menu to add assets
│   │   ├── Header.tsx            # Top bar — total value, P&L, refresh controls, Import/Export trigger
│   │   ├── HoldingDetailDrawer.tsx # Apple-style responsive holding detail drawer
│   │   ├── InsightsPanel.tsx     # Detailed drift, gainer, loser, and performer panels
│   │   ├── MobileAlertsView.tsx  # Mobile view display for dismissed/active portfolio alerts
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
│   ├── utils/
│   │   ├── apiClient.ts          # Safe wrapper client around Supabase edge functions
│   │   ├── auth.ts               # Session PIN verification and security helpers
│   │   ├── biometrics.ts         # WebAuthn FaceID / TouchID platform authenticator
│   │   ├── chartHelpers.ts       # Color configurations and chart formatting helpers
│   │   ├── formatters.ts         # INR formatting (formatINR, formatFullINR), dates, percentages
│   │   ├── goldPricing.ts        # Live MCX gold rate parser and hallmark calculators
│   │   ├── pdfReport.ts          # Print-ready styled PDF report generator
│   │   ├── rdUtils.ts            # Canonical RD compounding re-export proxy
│   │   ├── sipUtils.ts           # Canonical SIP valuation re-export proxy and NAV cache
│   │   ├── dataQuality.ts        # Canonical Data Quality audit re-export proxy
│   │   ├── assistant.ts          # Canonical AI Assistant re-export proxy
│   │   └── backupValidation.ts   # Canonical backup validation re-export proxy
├── supabase/
│   ├── config.toml               # Edge Functions configuration
│   ├── functions/
│   │   ├── holdings-crud/        # Deno edge function handling auth and asset operations
│   │   ├── market-data/          # Deno edge function proxying and caching Yahoo Finance quotes
│   │   └── snapshot-net-worth/   # Deno edge function logging daily wealth snapshots
│   └── migrations/               # Database tables schema migrations
├── tailwind.config.js            # Tailwind configuration
├── postcss.config.js             # PostCSS plugins
├── vite.config.ts                # Vite build configuration
├── tsconfig.json                 # TypeScript root config
└── package.json                  # Dependencies, script configurations, and engines
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** (comes with Node)
- A **Supabase** project instance.

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd "project antigravity"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> ℹ️ **Access Security**: App PIN authentication is enforced server-side by Supabase Edge Functions via the `APP_PIN_HASH` secret (SHA-256 hash).
> ⚠️ The `.env` file is git-ignored. Never commit your keys.

### 4. Set Up the Database & Storage
1. **Deploy Migrations:** Run migrations on your Supabase instance to configure database tables, RLS policies, indexes, and seeded data:
   ```bash
   npx supabase db push
   ```
2. **Deploy Edge Functions:** Deploy Edge Functions for auth, CRUD operations, live market pricing, and net worth logging:
   ```bash
   npx supabase functions deploy holdings-crud --no-verify-jwt --use-api
   ```
   ```bash
   npx supabase functions deploy market-data --no-verify-jwt --use-api
   ```
   ```bash
   npx supabase functions deploy snapshot-net-worth --no-verify-jwt --use-api
   ```

### 5. Run Locally
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

### 6. Testing & Quality Verification
The codebase contains a comprehensive automated test suite across pure calculation domains, component interactions, and security checks:
```bash
npm test          # Run Vitest test suite (30 test files, 165+ tests)
npm run test:ui   # Interactive test runner UI with watch mode
npm run verify    # Run lint + typecheck + build in sequence
```

---

## 🛡️ Security Architecture & Threat Model

1. **Server-Side PIN Authentication (Fail-Closed)**:
   - Client-side PIN entries are hashed with SHA-256 (`crypto.subtle.digest`) and sent via the `X-App-Pin` header.
   - Supabase Edge Functions (`holdings-crud`, `verify-pin`, `snapshot-net-worth`) validate this header directly against the server-side `APP_PIN_HASH` environment secret.
   - If the server PIN secret is missing or unconfigured, functions **Fail Closed (HTTP 503)** immediately.
2. **Brute-Force & Rate-Limiting Protection**:
   - IP-based sliding window rate limiter (`MAX_FAILED_ATTEMPTS = 5`, `RATE_WINDOW_MS = 5 min`) protects all PIN-locked endpoints.
   - Exceeding attempts returns **HTTP 429 (Too Many Requests)** with standard `Retry-After` headers.
3. **Private Document Storage with Time-Limited Signed URLs**:
   - The `investment-documents` bucket is strictly **private (`public = false`)** with all direct public read/write policies dropped.
   - Attachments are accessed via short-lived signed URLs (60-second expiration) issued by PIN-authenticated Edge Functions.
   - Client-side storage path generators enforce UUID path randomization and sanitization against directory traversal (`../`).
4. **Biometric Hardware-Backed Authentication**:
   - WebAuthn platform authenticators enable 1-second FaceID, TouchID, and Windows Hello unlocking without transmitting credentials over the wire.

---

## 💾 Data Resilience & Disaster Recovery

1. **Schema-Validated Full Backup & Restore**:
   - Unified export in JSON, CSV, and printable PDF statements.
   - The backup restore engine (`backupValidator.ts`) enforces envelope integrity, schema structure, and duplicate collision detection before applying restorations to the database.
2. **Automated Daily Net Worth Snapshots**:
   - The `snapshot-net-worth` Edge Function runs daily, computing exact consolidated valuations across all asset classes and logging historical timeline snapshots into `net_worth_history`.

---

## 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| **Dev Server** | `npm run dev` | Start Vite dev server with HMR |
| **Test Suite** | `npm test` | Run Vitest unit & integration tests (165+ tests) |
| **Build** | `npm run build` | Production build to `dist/` |
| **Preview** | `npm run preview` | Preview the production build locally |
| **Lint** | `npm run lint` | Run ESLint checks |
| **Type Check** | `npm run typecheck` | Run TypeScript compiler checks (no emit) |
| **Verify All** | `npm run verify` | Run lint + typecheck + build in sequence |
| **Mobile Sync** | `npm run mobile:sync` | Build web assets and sync Capacitor configuration for Android |
| **Mobile Run** | `npm run mobile:run` | Build, sync, and launch the Capacitor Android app in emulator |

---

## 🌐 Deployment

A GitHub Actions workflow is pre-configured in `.github/workflows/deploy.yml` to automatically run linters, strict TypeScript checks, Vitest test suites, and production builds before deploying to GitHub Pages when commits are pushed to the `main` branch.

To enable this:
1. Go to your repository settings on GitHub: **Settings → Pages**.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Configure the required secrets under **Settings → Secrets and variables → Actions** with your production environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_PIN`
   - `VITE_GEMINI_API_KEY`

---

## 🔄 Data Flow

```
┌─────────────────┐                        ┌──────────────────────┐
│    React UI      │ ────────────────────► │  Supabase Storage    │
│   (App.tsx)      │ ◄──────────────────── │ (investment-docs)    │
│                 │                        └──────────────────────┘
│                 │      CRUD Actions (fetch)
│                 │ ─────────────────────────────────┐
└──────┬──────────┘                                  │
       │                                             ▼
       │                                 ┌──────────────────────┐
       │                                 │ holdings-crud        │
       │                                 │ (Edge Function)      │
       │                                 └──────────┬───────────┘
       │  refreshPrices()                           │
       │  (every 30s)                               ▼
       ▼                                 ┌──────────────────────┐
 ┌──────────────┐            fetch()     │  Supabase DB         │
 │ usePortfolio │ ─────────────────────► │  (PostgreSQL)        │
 │ Data hook    │ ◄───────────────────── └──────────────────────┘
 └──────┬───────┘          live prices
        │
        ▼
 ┌──────────────┐            fetch()             ┌──────────────────┐
 │ market-data  │ ─────────────────────────────► │  Yahoo Finance   │
 │ edge function│ ◄───────────────────────────── │     (API)        │
 └──────────────┘                                └──────────────────┘
```

---

## 🛠️ Troubleshooting

### HTTP 500 / PGRST303 ("JWT issued at future")
If the dashboard fails to load and displays a `PGRST303` error:
1. This is a transient clock synchronization (skew) issue between the Supabase Edge Function environment (Deno Deploy) and the database server.
2. If this occurs, wait a few moments and click **Try Again** or refresh the page. The clocks will automatically resynchronize.
3. The Edge Function outputs detailed error messages for database operations, avoiding raw `[object Object]` displays.

---

## 📄 License

This is a private family project. All rights reserved.

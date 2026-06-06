# 💼 Family Portfolio Tracker

A premium, interactive web application designed to track and manage multi-asset portfolios for the entire family. The dashboard offers visual analytics, live market pricing for stocks & ETFs, and detailed registry management for Fixed Deposits, Gold, Real Estate, Insurance, and Documents.

---

## ✨ Features

### 📊 Financial Dashboard & Analytics
- **Asset Allocation Chart** — Interactive donut chart showcasing distribution across Stocks, FDs, Gold, and Real Estate.
- **Net Worth Growth Timeline** — Responsive SVG line/area chart with interactive tooltip nodes plotting historical compound wealth appreciation.
- **Sankey Flow Diagram** — Native SVG flow diagram charting wealth streams from net worth categories to individual sub-assets. Safeguarded against zero-thickness path and degenerate node renders.
- **Equity Concentration Treemap** — SVG treemap visualization showing relative sizes of top stock holdings. Includes division-by-zero guards and filters out sub-1px elements to ensure overlapping coordinate safety.
- **P&L Visuals** — Direct indications of profits and losses with custom positive/negative indicators and INR formatting.
- **Comparison Engine** — Multi-dimensional bar chart comparing total invested vs. current value per family member.
- **Live Prices** — Live feeds for stock and ETF holdings (every 30 seconds) showing intraday changes and overall returns.

### 💡 Portfolio Insights & Rebalancing
- **Performance Highlights** — Instantly view top stock holdings, top gainers, top losers, and today's biggest absolute price movement.
- **Portfolio Health Score** — Automated multi-factor evaluation engine (0-100) scoring diversification, active SIPs, emergency fund coverage (capped at 20 points), stock concentration, and active insurances (raised to 15 points).
- **Rebalancing recommendations** — Smart allocation rebalancing engine displaying exact cash buy/sell suggestions from target drifts, ignoring tiny drifts under an explicit threshold `MIN_ACTION = 5000`.
- **Asset Allocation Drift & Targets** — Tracks deviations between actual asset splits and targets. Features **User-Configurable Allocation Targets** via a settings modal.
- **Portfolio Concentration Alerts** — Warnings if any single equity exceeds 15% of the total portfolio value.

### 🤖 AI Portfolio Assistant
- **Intent-Based NLP Classifier** — Pre-filters queries into structured intents (e.g. performers, maturities, allocations) to eliminate false positive keywords before parameter extraction.

### 📱 Android Home Screen Widgets
- **Capacitor WebView Widgets** — Isolated WebView route displaying custom-styled, real-time widgets for Net Worth, Today's Gain, and upcoming FD maturities, optimized for Capacitor home widget slots.

### 💼 Portfolio Management & Navigation
- **Global Cross-Asset Search** — Live fuzzy search bar across stocks, banks, gold items, properties, and documents. Instantly jump to the tab and scroll directly to the matching asset.
- **Family View Switcher** — Toggle between **Family Overview** (combined family wealth) and individual member pages (My Portfolio, Mother's Portfolio, Wife's Portfolio).
- **Portfolio Renaming** — Easily change family display labels directly from the UI.
- **Dynamic Add/Edit** — Create and edit asset entries dynamically with live calculations.
- **Holdings Table Sorting Presets** — Quick presets to sort holdings by current value, total P&L, today's percent movement, or overall allocation percent.
- **Mobile Bottom Navigation** — Fixed bottom bar for quick tabs swapping on narrow mobile viewports, featuring an **Alert Count Badge** on the Home tab.

### ⚡ High Performance & Responsiveness
- **Asynchronous Web Workers** — Offloads heavy computations (Newton-Raphson XIRR solvers, multi-factor Health Score scoring, and rebalancing recommendations) to background threads (`src/workers/`) with synchronous fallbacks and detailed diagnostics warnings in case of worker thread initialization failures.
- **List Virtualization & Row Keys** — Uses `react-window` to virtualize large registry listings (>8 accounts) to keep scrolling fluid and render times minimal. Row key elements are explicitly bound to asset IDs (`itemKey`) to optimize DOM recycling and prevent rendering glitches.
- **Intersection Lazy Loading** — Leverages a custom type-safe `LazyChartWrapper` component with `IntersectionObserver` to lazy-load charts (`NetWorthTimelineChart`, `TreemapChart`, `SankeyChart`) only when they scroll into the viewport, completely deferring their bundle load and dynamic import evaluation.
- **Lock Screen Code-Splitting** — Dynamically code-splits the context providers and routing (`MainApp`) as well as the main dashboard layout (`AppShell`), keeping the entry bundle size tiny (188 kB) so the zero-dependency PIN Lock screen loads instantly on mobile networks.
- **Advanced Caching & Focus Resume** — Employs `SWR` for remote state cache validation, IndexedDB local caches (`idb-keyval`) for instant stale-while-revalidate loads (invalidated on write/mutations), a 5-minute time gate on document `visibilitychange` refresh listeners to stop redundant reloads, async IndexedDB caching for live Mutual Fund NAV fetches (with an in-memory map to prevent synchronous startup thread blocks), and a ref-based resolver registry queue in `refreshSnapshot` to prevent hanging promises.

### 📂 Multi-Asset Registry & Reminders
- **Fixed Deposits (FD)** — Real-time compounded interest tracking (compounded half-yearly), maturity date tracking, timeline progress bars, and document attachments.
- **Recurring Deposits (RD)** — Multi-month installment tracking with an interactive month-by-month grid list, paid vs. overdue status tracking, and a one-click **+ Pay** action button to record monthly contributions.
- **Sukanya Samriddhi Yojana (SSY)** — Multi-year financial tracking with compounding strictly on every April 1st (Indian Financial Year end). Auto-calculates default 21-year maturity dates and flags deposits that violate the legal ₹250 – ₹1,50,000 annual range.
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
- **Vite 5** — Lightning-fast dev server and optimized builds
- **Tailwind CSS 3** — Utility-first styling
- **Lucide React ^0.511.0** — Modern, consistent iconography
- **SWR ^2.4.1** — Stale-while-revalidate data fetching and caching
- **react-window ^2.2.7** — Grid and list virtualization
- **idb-keyval ^6.2.5** — Minimalistic IndexedDB wrapper for local cache storage

### Backend (Supabase)
- **PostgreSQL** — Relational database tables for portfolios, holdings, FDs (`fixed_deposits`), RDs (`rd_accounts`), Mutual Funds (`sip_accounts`), SSY (`ssy_accounts`), gold, real estate, insurances, documents, and net worth history.
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
│   ├── index.css                 # Global styles / Tailwind imports
│   ├── vite-env.d.ts             # Vite type declarations
│   ├── components/
│   │   ├── Header.tsx            # Top bar — total value, P&L, refresh controls, Import/Export trigger
│   │   ├── SummaryCards.tsx      # KPI cards — invested, current, P&L, today (compact on mobile)
│   │   ├── PortfolioTable.tsx    # Sortable holdings table with preset selectors & allocation column
│   │   ├── PieChart.tsx          # Asset allocation donut chart
│   │   ├── BarChart.tsx          # Portfolio comparison bar chart
│   │   ├── fd/                   # Standard Fixed Deposits
│   │   │   ├── DepositDetailsCard.tsx # Renders timelines, documents, and notes for FDs
│   │   │   └── StandardFormFields.tsx # Form inputs for standard FDs
│   │   ├── rd/                   # Recurring Deposits
│   │   │   ├── RDAccountCard.tsx     # Card layout for individual RDs
│   │   │   ├── RDFormModal.tsx       # Create/Edit RD form dialog
│   │   │   ├── RDInstallmentSchedule.tsx # Month-by-month RD contribution ledger tracking
│   │   │   └── RDView.tsx            # Main dashboard registry for RDs
│   │   ├── sip/                  # Mutual Fund SIPs
│   │   │   ├── SIPAccountCard.tsx    # Card layout showing live/manual valuation for SIPs
│   │   │   ├── SIPFormFields.tsx     # Inputs for scheme code lookup and unit holdings
│   │   │   ├── SIPFormModal.tsx      # Create/Edit SIP form dialog
│   │   │   └── SIPView.tsx           # Main dashboard registry for Mutual Funds (SIP)
│   │   ├── ssy/                  # Sukanya Samriddhi Yojana (SSY)
│   │   │   ├── SSYAccountCard.tsx    # Card layout for SSY registry
│   │   │   ├── SSYFormModal.tsx      # Create/Edit SSY account form dialog
│   │   │   ├── SSYSchedule.tsx       # Compounding yearly ledger breakdown
│   │   │   └── SSYView.tsx           # Main dashboard registry for SSY accounts
│   │   ├── AssetCardSkeleton.tsx # Reusable pulsing shimmer card wireframe for all registry views
│   │   ├── AddHoldingModal.tsx   # Modal form to add new stock holdings
│   │   ├── AddFamilyModal.tsx    # Modal form to add new family members
│   │   ├── RenamePortfolioModal.tsx # Modal form to rename family member portfolios
│   │   ├── FixedDepositView.tsx  # FD management — list, add, edit, delete
│   │   ├── GoldHoldingView.tsx   # Gold holdings management
│   │   ├── RealEstateView.tsx    # Real estate property management
│   │   ├── InsuranceView.tsx     # Insurance policy management
│   │   ├── DocumentVaultView.tsx # Document vault view with expiry fields and sorted indicators
│   │   ├── SearchBar.tsx         # Fuzzy global search bar component (fuzzy match with tab jumping)
│   │   ├── AlertsBanner.tsx      # Banners showing active notifications (52w high/low, FD due, etc.)
│   │   ├── ExportPanel.tsx       # Export (CSV, PDF, JSON) and CSV Import dialog box
│   │   ├── InsightsPanel.tsx     # Detailed drift, gainer, loser, and performer panels
│   │   ├── AllocationTargetsSettings.tsx # Configurator modal for custom asset allocation target splits
│   │   ├── ConfirmModal.tsx      # Custom styled backdrop modal replacing native browser confirm/alert
│   │   ├── Modal.tsx             # Core reusable styled backdrop modal wrapper
│   │   ├── FloatingAddMenu.tsx   # Quick floating menu to add assets
│   │   ├── QuickActions.tsx      # Grid of quick action buttons for mobile layout
│   │   ├── AssetTabContent.tsx   # Orchestrator component rendering the active asset registry view
│   │   ├── FamilyTabBar.tsx      # Top tab bar switcher for family member portfolios
│   │   ├── MobileAlertsView.tsx  # Mobile view display for dismissed/active portfolio alerts
│   │   ├── MobileBottomNav.tsx   # Sticky mobile tabs navigation bar with alert badge count
│   │   ├── MobileHomeSummary.tsx # Mobile view dashboard summary
│   │   ├── AppErrorBoundary.tsx  # Global React error boundary component
│   │   ├── SectionErrorBoundary.tsx # Nested React error boundary for asset-specific dashboard components
│   │   ├── DashboardLoading.tsx  # Skeleton loader states for dashboard fetch
│   │   ├── DashboardError.tsx    # Full-page retry UI for API/Supabase connection failures
│   │   └── PinLockScreen.tsx     # Secure session-based PIN lock keypad gate screen
│   ├── contexts/
│   │   └── PortfolioContext.tsx  # Global state provider, pricing sync statuses, and consolidated CRUD functions
│   ├── hooks/
│   │   ├── usePortfolioData.ts   # Core data hook — Edge Function list, CRUD operations, local cache, live prices
│   │   ├── useRDData.ts          # Thin hook wrapper pulling Recurring Deposits CRUD from context
│   │   ├── useSIPData.ts          # Thin hook wrapper pulling Mutual Fund SIPs CRUD from context
│   │   ├── useSSYData.ts         # Thin hook wrapper pulling Sukanya Samriddhi Yojana CRUD from context
│   │   ├── usePortfolioInsights.ts # Computes allocation, performer, and reminder insights
│   │   ├── useMarketData.ts      # Standalone market price fetcher (CORS proxied)
│   │   ├── useAlerts.ts          # Evaluates warnings, contains visible/dismissed states
│   │   ├── useSwipeNavigation.ts # Touch swipe gesture tracking for mobile tab layout
│   │   └── useKeyboardShortcuts.ts # Global hotkey listeners for desktop window
│   ├── types/
│   │   └── portfolio.ts          # TypeScript interfaces (Holding, NetWorthSnapshot, etc.)
│   ├── utils/
│   │   ├── apiClient.ts          # Safe wrapper client around Supabase edge functions
│   │   ├── auth.ts               # Session PIN verification and security helpers
│   │   ├── chartHelpers.ts       # Groups color configuration hex values and slices formatting
│   │   ├── formatters.ts         # INR formatting, percent formatting, P&L colors, getDocumentUrl, and FD compounding
│   │   ├── portfolioCalcs.ts     # Computes aggregate values and drift splits; contains the shared compoundValue engine
│   │   ├── rdUtils.ts            # Recurring Deposit installment & compounding calculations leveraging the shared engine
│   │   ├── sipUtils.ts           # SIP contribution & manual valuation helpers
│   │   ├── ssyUtils.ts           # SSY Financial Year & annual compounding calculations leveraging the shared engine
│   │   └── supabaseClient.ts     # Supabase SDK initialization
│   └── data/
│       ├── portfolioData.ts      # Static/seed portfolio data
│       └── 1.csv                 # Raw CSV data source
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
VITE_APP_PIN=your-4-to-6-digit-pin
```

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

### 6. Code Quality & Verification
To verify that the code passes linting rules and TypeScript compilation check, run:
```bash
npm run verify
```
This runs lint, typecheck, and a production build in sequence. You can also run individual checks:
```bash
npm run lint
npm run typecheck
```

---

## 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| **Dev Server** | `npm run dev` | Start Vite dev server with HMR |
| **Build** | `npm run build` | Production build to `dist/` |
| **Preview** | `npm run preview` | Preview the production build locally |
| **Lint** | `npm run lint` | Run ESLint checks |
| **Type Check** | `npm run typecheck` | Run TypeScript compiler checks (no emit) |
| **Verify All** | `npm run verify` | Run lint + typecheck + build in sequence |
| **Mobile Sync** | `npm run mobile:sync` | Build web assets and sync Capacitor configuration for Android |
| **Mobile Run** | `npm run mobile:run` | Build, sync, and launch the Capacitor Android app in emulator |

---

## 🌐 Deployment

A GitHub Actions workflow is pre-configured in `.github/workflows/deploy.yml` to automatically build and deploy the app to GitHub Pages when commits are pushed to the `main` branch.

To enable this:
1. Go to your repository settings on GitHub: **Settings → Pages**.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Configure the required secrets under **Settings → Secrets and variables → Actions** with your production environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_PIN` (optional, 4-6 digit access code)

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

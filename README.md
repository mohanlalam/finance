# 💼 Family Portfolio Tracker

A premium, interactive web application designed to track and manage multi-asset portfolios for the entire family. The dashboard offers visual analytics, live market pricing for stocks & ETFs, and detailed registry management for Fixed Deposits, Gold, Real Estate, Insurance, and Documents.

---

## ✨ Features

### 📊 Financial Dashboard
- **Asset Allocation Chart** — Interactive donut chart showcasing distribution across Stocks, FDs, Gold, and Real Estate.
- **P&L Visuals** — Direct indications of profits and losses with custom positive/negative indicators and INR formatting.
- **Comparison Engine** — Multi-dimensional bar chart comparing total invested vs. current value per family member.
- **Live Prices** — Live feeds for stock and ETF holdings (every 30 seconds) showing intraday changes and overall returns.

### 💼 Portfolio Management
- **Family View switcher** — Toggle between **Family Overview** (combined family wealth) and individual member pages (My Portfolio, Mother's Portfolio, Wife's Portfolio).
- **Portfolio Renaming** — Easily change family display labels directly from the UI.
- **Dynamic Add/Edit** — Create and edit asset entries dynamically with live calculations.

### 📂 Multi-Asset Registry
- **Fixed Deposits** — Real-time compounded interest tracking, optional maturity dates for ongoing deposits (which calculate valuation dynamically up to the current day), timeline progress bars, and document attachments.
- **Gold Holdings** — Weight tracking, purity selection (24K, 22K, etc.), cost basis vs. current valuation appreciation.
- **Real Estate** — Property value trackers, locations, acquisition dates, and monthly rental yield calculations.
- **Insurances** — Health, term, life, and motor policy registries with automated renewal timers and status alerts.
- **Document Vault** — A secure digital folder system categorized by asset class. Attach PDF receipts or insurance policies directly to their records.

### 🔒 Security
- **PIN Lock Screen** — Optional session-based PIN lock screen to prevent unauthorized access to sensitive family wealth data. Configurable via environment variables.

### ⚙️ General
- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile.
- **Offline Resilient** — Gracefully falls back to last known data when the network is unavailable.
- **INR Formatting** — All values formatted in Indian Rupee with lakh/crore notation.

---

## 🏗️ Tech Stack

### Frontend
- **React 18** — Component-based UI with hooks
- **TypeScript** — End-to-end type safety
- **Vite 5** — Lightning-fast dev server and optimized builds
- **Tailwind CSS 3** — Utility-first styling
- **Lucide React** — Clean, consistent iconography

### Backend
- **Supabase** — Open Source Firebase Alternative
  - **PostgreSQL** — Relational database storing portfolios, holdings, FDs, gold, real estate, insurances, and document metadata.
  - **Supabase Storage** — Secure file storage for financial and insurance document attachments.
  - **Edge Functions (Deno)** — Serverless functions for secure CRUD logic (`holdings-crud`) and server-side live market quotes proxying (`market-data`).

### Hosting
- **GitHub Pages** — CI/CD automated deployment on push to `main`.
- **Firebase Hosting** — Production deployment (project: `finance-5efcd`)
- **Netlify** — Production deployment option (SPA routing supported)

---

## 📁 Project Structure

```
project antigravity/
├── index.html                    # HTML entry point
├── src/
│   ├── App.tsx                   # Root component — tabs, layout, data orchestration
│   ├── main.tsx                  # React DOM mount
│   ├── index.css                 # Global styles / Tailwind imports
│   ├── vite-env.d.ts             # Vite type declarations
│   ├── components/
│   │   ├── Header.tsx            # Top bar — total value, P&L, refresh controls
│   │   ├── SummaryCards.tsx      # KPI cards — invested, current, P&L, today
│   │   ├── PortfolioTable.tsx    # Sortable stock holdings table with edit/delete
│   │   ├── PieChart.tsx          # Asset allocation donut chart
│   │   ├── BarChart.tsx          # Portfolio comparison bar chart
│   │   ├── AddHoldingModal.tsx   # Modal form to add new stock holdings
│   │   ├── FixedDepositView.tsx  # FD management — list, add, edit, delete
│   │   ├── GoldHoldingView.tsx   # Gold holdings management
│   │   ├── RealEstateView.tsx    # Real estate property management
│   │   ├── InsuranceView.tsx     # Insurance policy management
│   │   └── DocumentVaultView.tsx # Document upload and management
│   ├── hooks/
│   │   ├── usePortfolioData.ts   # Core data hook — Firestore CRUD, auto-seeding, and live prices
│   │   └── useMarketData.ts      # Standalone market price fetcher (CORS proxied)
│   ├── types/
│   │   └── portfolio.ts          # TypeScript interfaces (Holding, FixedDeposit, etc.)
│   ├── utils/
│   │   ├── auth.ts               # Session PIN verification and security helpers
│   │   ├── formatters.ts         # INR formatting, percent formatting, P&L colors, getDocumentUrl
│   │   └── supabaseClient.ts     # Supabase SDK initialization
│   └── data/
│       ├── portfolioData.ts      # Static/seed portfolio data
│       └── 1.csv                 # Raw CSV data source
├── firebase.json                 # Firebase Hosting config (SPA rewrites)
├── .firebaserc                   # Firebase project binding
├── tailwind.config.js            # Tailwind configuration
├── postcss.config.js             # PostCSS plugins
├── vite.config.ts                # Vite build configuration
├── tsconfig.json                 # TypeScript root config
├── tsconfig.app.json             # App-specific TS config
├── tsconfig.node.json            # Node/tooling TS config
├── eslint.config.js              # ESLint flat config
├── package.json                  # Dependencies and scripts
├── .gitignore                    # Git ignore rules
└── public/
    └── _redirects                # Netlify SPA redirect rule
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** (comes with Node)
- A **Supabase** project.

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

1. **Deploy Migrations:** Run local migrations on your Supabase instance to set up database tables, RLS policies, and default seed data:
   ```bash
   supabase db push
   ```
2. **Deploy Edge Functions:** Deploy serverless edge functions for CRUD operations and live market price proxying:
   ```bash
   supabase functions deploy holdings-crud
   supabase functions deploy market-data
   ```

### 5. Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 6. Code Quality & Verification

To verify that the code passes linting rules and TypeScript compilation check, run:
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

---

## 🌐 Deployment

### Option A — Netlify (Recommended)

**CLI:**
```bash
npm run build
npx -y netlify-cli deploy --prod --dir=dist
```

**Git-connected (auto-deploy on push):**
1. Push your project to GitHub / GitLab
2. Connect the repo on Netlify's dashboard
3. Set **Build command:** `npm run build`
4. Set **Publish directory:** `dist`
5. Add your `VITE_SUPABASE_*` environment variables under **Site Settings → Environment Variables**

> 💡 The `public/_redirects` file handles SPA routing automatically.

### Option B — Firebase Hosting

```bash
npm run build
npx firebase deploy --only hosting
```

### Option C — GitHub Pages (CI/CD Automated)

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
┌──────────────┐             fetch()     │  Supabase DB         │
│  usePortfolio │ ─────────────────────► │  (PostgreSQL)        │
│  Data hook    │ ◄───────────────────── └──────────────────────┘
└──────┬───────┘           live prices
       │
       ▼
┌──────────────┐             fetch()             ┌──────────────────┐
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
3. The Edge Function has been updated with detailed error reporting to output the actual database messages instead of a generic `[object Object]` error.

---

## 📄 License

This is a private family project. All rights reserved.

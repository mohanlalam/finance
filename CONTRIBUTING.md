# 🤝 Contributing to Family Portfolio Tracker

Thank you for contributing to the Family Portfolio Tracker! This guide outlines the project setup, quality verification workflows, and core architectural rules to maintain a high standard across the codebase.

---

## 🚀 Development Setup

### 1. Prerequisites
- **Node.js** ≥ 18.0.0
- **npm** (included with Node.js)

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone <repository-url>
cd "project antigravity"
npm install
```

### 3. Environment Configuration
Copy the example environment file and fill in your Supabase credentials:
```bash
cp .env.example .env
```
Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_APP_PIN=1234 # Optional PIN code gate
```

### 4. Running the Dev Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Verification & Testing Commands

Always run the full verification suite before submitting pull requests or committing code:

```bash
# Run full verification (Lint + Typecheck + Production Build)
npm run verify
```

Individual checks:
```bash
# Run ESLint checks
npm run lint

# Run TypeScript compiler checks (no emit)
npm run typecheck

# Run production build
npm run build
```

---

## 🏗️ Core Architecture & Coding Rules

### 1. State Management & Hooks
- **Split Context Pattern**: Always consume `usePortfolioState()` for data reading and `usePortfolioActions()` for CRUD triggers separately. Never recreate a unified combined hook that triggers unnecessary re-renders across modals or form controls.
- **SWR & IndexedDB Caching**: Remote portfolio and market data fetching must use `SWR` with SWR keys. Local caching is strictly offloaded to IndexedDB (`idb-keyval`) to avoid `localStorage` size limits.

### 2. Styling & Dark Mode
- **Tailwind & Dark Mode**: Never use hardcoded light-only colors (e.g. `#16a765`, `#ff3b30`) without providing corresponding `dark:` variants (e.g. `text-emerald-600 dark:text-emerald-400`).
- **Tabular Numerals**: Apply the `.tnum` class to financial numbers and percentages for consistent monospace alignment.

### 3. Date Arithmetic & Calculations
- **Month Rollover Clamping**: When generating monthly cash-flow dates, always clamp the day of the month to the last valid day of the target month (`new Date(year, month + 1, 0).getDate()`) to prevent JavaScript date-rollover bugs (e.g., Jan 31 rolling into March 3).
- **Linear Investment Weighted Age**: Use `(age / 2)` when calculating weighted capital age for Recurring Deposits and SIPs, as monthly deposits average half the total elapsed duration.
- **Equity Concentration Checks**: Combine both direct stock holdings and Mutual Fund SIP values (`stocks + sip`) when evaluating equity concentration percentages.

### 4. Code Splitting & Performance
- **Lazy Loading**: Registry view components (`FixedDepositView`, `SIPView`, `RDView`, etc.) and SVG charts must be dynamically imported with `React.lazy` and wrapped in `<Suspense>`.
- **Web Worker Offloading**: Offload CPU-heavy calculations (XIRR solvers, health scores, allocation rebalancing) to Web Workers in `src/workers/` with main-thread synchronous fallbacks.
- **Asset Truncation**: Use `truncate` on user-provided strings (stock names, bank names, labels) within fixed-size grid or flex containers.

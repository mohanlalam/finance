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
- **Consistent Dark Scale**: Always use the `slate` scale for dark mode neutrals (e.g. `dark:bg-slate-800`, `dark:border-slate-700`). Never mix `zinc` into dark variants.
- **Valid Tailwind Classes**: Only use standard Tailwind color stops (`50`, `100`, `200`, ..., `900`, `950`). Invalid stops like `text-blue-650` or `text-slate-350` produce no CSS output.
- **Tabular Numerals**: Apply the `.tnum` class to financial numbers and percentages for consistent monospace alignment.
- **Animated Numbers**: Use the `<AnimatedNumber>` component from `src/components/ui/AnimatedNumber.tsx` for all dashboard financial metrics (Net Worth, P&L, Invested). Never display raw jumping number changes.
- **Theme-Aware Widgets**: Widget and card components must respect the global light/dark theme. Never force a fixed dark background (`bg-slate-900`) regardless of mode.

### 3. Date Arithmetic & Calculations
- **Month Rollover Clamping**: When generating monthly cash-flow dates, always clamp the day of the month to the last valid day of the target month (`new Date(year, month + 1, 0).getDate()`) to prevent JavaScript date-rollover bugs (e.g., Jan 31 rolling into March 3).
- **Linear Investment Weighted Age**: Use `(age / 2)` when calculating weighted capital age for Recurring Deposits and SIPs, as monthly deposits average half the total elapsed duration.
- **Equity Concentration Checks**: Combine both direct stock holdings and Mutual Fund SIP values (`stocks + sip`) when evaluating equity concentration percentages.

### 4. Code Splitting & Performance
- **Lazy Loading**: Registry view components (`FixedDepositView`, `SIPView`, `RDView`, etc.) and SVG charts must be dynamically imported with `React.lazy` and wrapped in `<Suspense>`. Use shimmer skeleton placeholders (not `null`) as fallbacks to prevent Cumulative Layout Shift.
- **Web Worker Offloading**: Offload CPU-heavy calculations (XIRR solvers, health scores, allocation rebalancing) to Web Workers in `src/workers/` with main-thread synchronous fallbacks.
- **Asset Truncation**: Use `truncate` on user-provided strings (stock names, bank names, labels) within fixed-size grid or flex containers.
- **Tab Transitions**: Apply the `.tab-transition` CSS class to active tab panels in `AssetTabContent.tsx` with a unique `key` prop to trigger smooth fade-in animations on tab switch.

### 5. Modal System
- **Use `<Modal>` Component**: All popups and form dialogs must use the unified `Modal.tsx` component. Never create inline `<div className="fixed inset-0 ...">` modal markup.
- **Fixed Header + Footer Architecture**: Modal forms must have a pinned top header (`shrink-0 border-b`), a scrollable middle body (`flex-1 min-h-0 overflow-y-auto`), and a pinned bottom action footer (`shrink-0 border-t`). Action buttons (Cancel/Save) must never scroll offscreen.
- **Drag-to-Move**: The `Modal.tsx` component supports `PointerEvent`-based drag-to-move on the header area. Do not override or duplicate this behavior.

### 6. Accessibility
- **ARIA Labels**: All interactive buttons (especially icon-only buttons and keypad digits) must include descriptive `aria-label` attributes.
- **Focus Rings**: Interactive elements must have `focus-visible:ring-2` styles for keyboard navigation visibility.
- **Live Regions**: Status indicators that update dynamically (e.g. price sync status) should use `aria-live="polite"` for screen reader announcements.
- **Touch Device Support**: Never gate interactive controls behind `hover:` states only. Touch devices must have permanent visibility (use `opacity-50 sm:opacity-0 sm:group-hover:opacity-100` pattern).

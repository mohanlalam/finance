# 🎨 Family Portfolio Tracker — UI Design Specification (`UI.md`)

This document provides a comprehensive, exhaustive overview of the **User Interface (UI) and User Experience (UX) Design System** for the Family Portfolio Tracker application. It documents design tokens, core layout architectures, component specifications, screen wireframes, mobile vs. web view adaptations, animations, dark/light theme behavior, modal systems, and responsive UX patterns.

---

## 📑 Table of Contents

1. [Design Philosophy & Core Aesthetics](#1-design-philosophy--core-aesthetics)
2. [Design Tokens & Theme Architecture](#2-design-tokens--theme-architecture)
   - [Color Palette & Tokens](#color-palette--tokens)
   - [Typography & Tabular Numerics](#typography--tabular-numerics)
   - [Corner Radii & Elevation Shadows](#corner-radii--elevation-shadows)
   - [Motion Curves & Micro-Interactions](#motion-curves--micro-interactions)
3. [Layout Architecture: Web / Desktop View](#3-layout-architecture-web--desktop-view)
   - [Desktop Layout Hierarchy](#desktop-layout-hierarchy)
   - [Header & Global Bar](#header--global-bar)
   - [Sticky Desktop Sidebar](#sticky-desktop-sidebar)
   - [Family Selector & Tab Navigation](#family-selector--tab-navigation)
   - [Summary Cards & Sparklines](#summary-cards--sparklines)
   - [2x2 Equalized Dashboard Widget Grid](#2x2-equalized-dashboard-widget-grid)
   - [Portfolio Insights & Health Metrics](#portfolio-insights--health-metrics)
4. [Layout Architecture: Mobile View](#4-layout-architecture-mobile-view)
   - [Passcode Lock Screen (iOS 17/18 Style)](#passcode-lock-screen-ios-1718-style)
   - [Mobile Top Bar & Family Pill Selector](#mobile-top-bar--family-pill-selector)
   - [Mobile Home Wealth Summary View](#mobile-home-wealth-summary-view)
   - [Mobile Bottom Navigation Bar](#mobile-bottom-navigation-bar)
   - [Mobile Floating Add Menu (FAB & Action Sheet)](#mobile-floating-add-menu-fab--action-sheet)
   - [Mobile Alerts Drawer & Page](#mobile-alerts-drawer--page)
   - [Touch Gestures & UX Adaptations](#touch-gestures--ux-adaptations)
5. [Asset Class Registry Views & Component Specs](#5-asset-class-registry-views--component-specs)
   - [Stock & ETF Holdings Table](#stock--etf-holdings-table)
   - [Fixed Deposits (FD) View & Cards](#fixed-deposits-fd-view--cards)
   - [Recurring Deposits (RD) View & Installments](#recurring-deposits-rd-view--installments)
   - [Mutual Fund SIP View & NAV Tracker](#mutual-fund-sip-view--nav-tracker)
   - [Physical & Digital Gold View](#physical--digital-gold-view)
   - [Real Estate Asset Cards](#real-estate-asset-cards)
   - [Insurance Policies View & Renewal Urgency](#insurance-policies-view--renewal-urgency)
   - [Document Vault View](#document-vault-view)
   - [Tax Harvesting Recommendation View](#tax-harvesting-recommendation-view)
   - [What-If Compound Wealth Calculator](#what-if-compound-wealth-calculator)
   - [Portfolio Assistant (AI Conversational UI)](#portfolio-assistant-ai-conversational-ui)
6. [Modal System & Overlay Architecture](#6-modal-system--overlay-architecture)
   - [Unified Draggable Modal Frame](#unified-draggable-modal-frame)
   - [Form Modals Specification](#form-modals-specification)
   - [Confirmation Dialogs & Context Menus](#confirmation-dialogs--context-menus)
   - [Toast Notification Stack](#toast-notification-stack)
7. [State Representations & Micro-Interactions](#7-state-representations--micro-interactions)
   - [Shimmer Skeleton Loading States](#shimmer-skeleton-loading-states)
   - [Empty States](#empty-states)
   - [Privacy / Stealth Mode](#privacy--stealth-mode)
   - [Error Boundaries & Offline Fallbacks](#error-boundaries--offline-fallbacks)
8. [Print & PDF Export UI Styling](#8-print--pdf-export-ui-styling)
9. [Responsive Breakpoint Matrix & Summary](#9-responsive-breakpoint-matrix--summary)
10. [Accessibility & Motion Preferences](#10-accessibility--motion-preferences) 🆕

---

## 1. 🎯 Design Philosophy & Core Aesthetics

The application enforces a **calm, professional, data-first financial design system** engineered for maximum readability, scannability, and high density without visual noise.

* **Flat Canvas & Solid Surfaces**: Uses clean neutral backgrounds (`#f8fafc` in Light Mode, `#090d16` in Dark Mode) with crisp 1px borders (`var(--border-subtle)`). Completely avoids background noise, glowing gradients, or heavy neon glows in data views.
* **Compact Financial Geometry**: Tight corner radii (6px – 12px) paired with tabular numeric alignment guarantee that complex financial figures line up with mathematical precision.
* **Apple & iOS Inspired Tactile Feedback**: Combines spring animations (`cubic-bezier(0.34, 1.56, 0.64, 1)`), tactile button scaling (`scale(0.97)` on active press), and glassmorphic backdrops for modals and lock screens.
* **Functional Color Coding**: Colors are used strictly for financial status: System Green for gains, Dark Amber for warnings/stale pricing, System Red for losses/unfavorable returns, and Crisp Blue for active states and primary actions.

---

## 2. 🎨 Design Tokens & Theme Architecture

The visual theme is governed by CSS Custom Properties declared in `src/index.css` and mapped across Tailwind CSS utility classes.

### Color Palette & Tokens

| Token Name | Light Mode | Dark Mode | Usage Scope |
| :--- | :--- | :--- | :--- |
| `--app-background` | `#f8fafc` | `#090d16` | Main viewport canvas background |
| `--surface` | `#ffffff` | `#131b2e` | Primary card background (`.apple-card`) |
| `--surface-secondary` | `#f1f5f9` | `#1e293b` | Form fields, subtle card headers, table hover |
| `--surface-tertiary` | `#e2e8f0` | `#334155` | Scrollbar thumb, disabled controls, dividers |
| `--text-primary` | `#0f172a` | `#f8fafc` | Primary titles, net worth values, headings |
| `--text-secondary` | `#475569` | `#94a3b8` | Subtitles, section headers, secondary labels |
| `--text-tertiary` | `#64748b` | `#64748b` | Muted metadata, timestamps, table headers |
| `--accent-blue` | `#2563eb` | `#3b82f6` | Primary action buttons, active navigation indicator |
| `--accent-blue-soft` | `#eff6ff` | `#1e3a8a` (20%) | Selected tab pills, info badges |
| `--positive` | `#16a34a` / `#34C759` | `#22c55e` | Profit indicators, positive gain badges |
| `--positive-soft` | `#f0fdf4` | `#14532d` (20%) | Positive summary card accent background |
| `--negative` | `#dc2626` | `#ef4444` | Loss indicators, negative return badges |
| `--negative-soft` | `#fef2f2` | `#7f1d1d` (20%) | Loss summary card accent background |
| `--warning` | `#d97706` | `#f59e0b` | Stale price alerts, upcoming maturity warnings |
| `--warning-soft` | `#fffbeb` | `#78350f` (20%) | Caution banner backgrounds |
| `--border-subtle` | `rgba(148, 163, 184, 0.2)` | `rgba(255, 255, 255, 0.1)` | 1px clean container & card borders |

### Typography & Tabular Numerics

The typography system prioritizes tabular alignment for financial digits, using `-apple-system` / `SF Pro` fonts:

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

#### Typography Scale Matrix

| Class Name | Mobile Size | Desktop Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `h1` / `.text-page-title` | `28px` | `34px` | `700` (Bold) | `1.2` | Top dashboard page titles |
| `h2` / `.text-section-title` | `20px` | `24px` | `700` (Bold) | `1.3` | Section headings, widget headers |
| `h3` / `.text-card-title` | `15px` | `17px` | `600` (SemiBold) | `1.4` | Asset card titles, table headers |
| `.text-body` | `14px` | `16px` | `400` (Regular) | `1.5` | Standard body copy, descriptions |
| `.text-supporting` | `12px` | `13px` | `400` (Regular) | `1.5` | Secondary metadata, dates, tickers |
| `.text-financial` | `22px` | `26px` | `700` (Bold) | `1.2` | Net Worth totals, asset values |
| `.text-label-small` | `11px` | `12px` | `500` (Medium) | `1.4` | Small pill text, category tags |

#### Tabular Number Rules
* **`.tnum` / `.text-financial`**: Enforces `font-variant-numeric: tabular-nums` and `font-feature-settings: "tnum" 1, "cv05" 1`. Prevents layout jitter when financial values change dynamically.
* **`.ios-currency`**: Renders currency symbols (₹, $) with reduced opacity (`0.85`) and lighter weight (`300`) for subtle visual hierarchy.
* **`AnimatedNumber`**: Count-up interpolation over 500ms using `requestAnimationFrame` with cubic ease-out transitions. Skips animation when `prefers-reduced-motion` is enabled.

### Corner Radii & Elevation Shadows

To maintain a compact, crisp financial interface, corner radii are strictly capped between 6px and 12px:

* `--radius-small` (`6px`): Badges, table filter pills, small icon buttons.
* `--radius-medium` (`10px`): Asset cards (`.apple-card`), form text inputs, select dropdowns.
* `--radius-large` (`12px`): Modal containers, major dashboard chart panels, lock screen keypads.
* `--radius-pill` (`999px`): Status indicators, rounded pill tags.

#### Shadow Tokens
* **`--shadow-card`**: `0 1px 3px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02)` (Light) / `0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.25)` (Dark).
* **`--shadow-floating`**: `0 8px 24px rgba(0, 0, 0, 0.1)` (Light) / `0 10px 30px rgba(0, 0, 0, 0.5)` (Dark) for modals and dropdown menus.

### Motion Curves & Micro-Interactions

* **Tactile Press Feedback (`.ios-press`)**:
  ```css
  .ios-press {
    transition: transform 0.12s var(--ios-spring), background-color 0.15s ease, opacity 0.15s ease;
  }
  .ios-press:active {
    transform: scale(0.97);
    opacity: 0.9;
  }
  ```
* **Modal Scale-In (`.animate-modal-content`)**: `0.35s` duration using `cubic-bezier(0.34, 1.56, 0.64, 1)` spring expansion.
* **Sparkline Line Draw (`.animate-sparkline-draw`)**: SVG line drawing over `0.8s` using `stroke-dashoffset` animation.

---

## 3. 🖥️ Layout Architecture: Web / Desktop View

The web view is designed for wide screens (`md: 768px` up to `2xl: 1720px`), emphasizing multi-column dashboards, high data density, sticky navigation, and keyboard accessibility.

```
+-----------------------------------------------------------------------------------------------+
|                                      HEADER BAR (Sticky Top)                                   |
| Logo | Portfolio Name | Privacy Toggle | Net Worth Badge | Live Status | Theme Switch | Lock |
+-----------------------------------------------------------------------------------------------+
|                               FAMILY TAB BAR (Horizontal Scroll)                               |
| [All Family]  [Personal]  [Spouse]  [Parents]  [+ Add Member]                 [Rename] [Delete] |
+-------------------------------+---------------------------------------------------------------+
| DESKTOP SIDEBAR (Sticky Left) | MAIN DASHBOARD CONTENT AREA                                   |
|                               |                                                               |
|  📊 All Overview              |  [ SUMMARY CARDS (Net Worth | Invested | Today PnL | Total PnL) ] |
|  📈 Stock Holdings            |                                                               |
|  🏦 Fixed Deposits            |  [ FAMILY MEMBER OVERVIEW CARDS (When 'All' selected) ]        |
|  🔄 Recurring Deposits        |                                                               |
|  💰 Mutual Fund SIPs          |  [ 2x2 EQUALIZED DASHBOARD WIDGET GRID (Height: 370px) ]       |
|  🥇 Physical & Digital Gold   |  +-----------------------------+----------------------------+ |
|  🏢 Real Estate               |  | Net Worth Timeline (SVG)    | Portfolio AI Assistant     | |
|  🛡️ Insurance Policies        |  +-----------------------------+----------------------------+ |
|  📁 Document Vault            |  | Asset Allocation (Pie)      | Asset Performance (Bar)    | |
|  🧩 Dashboard Widgets         |  +-----------------------------+----------------------------+ |
|  🧮 What-If Calculator        |                                                               |
|  ⚖️ Tax Harvesting            |  [ PORTFOLIO INSIGHTS & HEALTH SCORE PANEL ]                  |
|                               |                                                               |
|                               |  [ ACTIVE ASSET REGISTRY TABLE / CONTAINER VIEW ]             |
+-------------------------------+---------------------------------------------------------------+
```

### Desktop Layout Hierarchy

1. **Header Bar** (`Header.tsx`): Fixed top bar spanning up to `1720px`.
2. **Family Tab Bar** (`FamilyTabBar.tsx`): Pinned under header, allowing instant portfolio context switching.
3. **Sidebar + Main Content Grid**:
   - Left Sidebar: `w-64`, `sticky top-6`, `self-start` height constraint (prevents vertical white space).
   - Right Main Area: `flex-1 min-w-0`, stacked in vertical order: Summary Cards → Family Overview Cards → 2x2 Widget Grid → Portfolio Insights → Asset Category Registry View.

### Header & Global Bar

* **Left Section**:
  * App Icon: Blue rounded square (`w-8 h-8 rounded-lg bg-blue-600`) with white trending line SVG.
  * Brand & Context Labels: "Family Wealth" (`text-sm font-extrabold`) over active portfolio sub-label ("Family Portfolio" or member name).
* **Right Utilities**:
  * **Net Worth Display** (Desktop only): Formatted INR total next to positive/negative total percentage return badge.
  * **Privacy Eye Toggle**: Button switching between open values and bullet masks (`••••••`).
  * **Market Sync Status Pill**: Dynamic badge displaying "Live", "Syncing...", "Cached (Offline)", or "Stale".
  * **Alerts Notification Bell**: Displays active alert counter badge; triggers dropdown list of 52-week highs/lows, maturity warnings, and portfolio swing alerts.
  * **Theme Switcher**: Sun / Moon icon button to toggle Light/Dark mode.
  * **PIN Lock Button**: Instantly locks the session and returns to `PinLockScreen`.
  * **Tap Area Standards**: All desktop header utility buttons enforce a minimum 44px × 44px tap boundary (`min-w-[44px] min-h-[44px] flex items-center justify-center`).

### Sticky Desktop Sidebar

* Component: `DesktopSidebar.tsx`
* Position: `sticky top-6`, constrained with `self-start` to avoid unnecessary stretching.
* **Item Styling**:
  * Inactive Item: `text-[var(--text-secondary)]`, hover background `bg-[var(--surface-secondary)]`.
  * Active Item: `bg-blue-600 text-white font-semibold shadow-sm`.
  * Count Badges: Small pill on the right showing total asset count per category.

### Family Selector & Tab Navigation

* Component: `FamilyTabBar.tsx`
* Features:
  * Primary `'all'` tab ("All Family") pinned to the left.
  * Chronologically sorted custom portfolios (e.g., "Personal", "Spouse", "Child", "Parents").
  * Inline "+ Add Member" button opening `AddFamilyModal`.
  * Context menu triggers for renaming (`RenamePortfolioModal`) or deleting family portfolios.

### Summary Cards & Sparklines

* Component: `SummaryCards.tsx`
* Layout: Grid of 4 cards on desktop (`grid-cols-4 gap-4`).
* Card Types:
  1. **Total Net Worth**: Includes live balance, 24h change indicator, and 7-point Mini Sparkline.
  2. **Total Invested**: Principal capital allocated across all asset classes.
  3. **Today's P&L**: Daily fluctuation with system green/red indicator.
  4. **Total P&L / Returns**: Overall profit/loss with percentage badge and overall yield sparkline.
* **Sparklines**: Mini inline SVG graphs (`Sparkline.tsx`) with animated line-draw on mount (`.animate-sparkline-draw`).

### 2x2 Equalized Dashboard Widget Grid

All four core visualization widgets are constrained to an **equalized height of 370px** inside a `grid-cols-1 lg:grid-cols-2 gap-5` container to maintain strict visual alignment:

1. **Net Worth Timeline Chart** (`NetWorthTimelineChart.tsx`):
   * Interactive SVG line & filled area chart showing historical wealth growth.
   * Date range selector pills: `1M`, `3M`, `6M`, `1Y`, `ALL`.
   * Displays interactive crosshair tooltip on hover with exact date and valuation.
   * Empty state preview: Renders a muted reference curve with a glassmorphic badge overlay when insufficient data exists.
2. **Portfolio Assistant (AI Chat)** (`PortfolioAssistant.tsx`):
   * Conversational NLP panel formatted to 370px height matching neighboring charts with internal scroll body (`flex-1 min-h-0 overflow-y-auto`).
   * Features quick suggestion prompt pills, typing indicator, markdown formatting, `Bot` SVG icon integration, and copy button.
3. **Asset Allocation Chart** (`PieChart.tsx`):
   * Donut chart representing portfolio breakdown across asset classes (Stocks & ETFs, Fixed Deposits, Recurring Deposits, Mutual Fund SIPs, Gold Holdings, Real Estate).
   * **Dual Legend Breakdown**: Each legend row clearly displays both the formatted monetary valuation (`formatINR`) and the composition weight percentage (`%`) without signed `+`/`-` prefixes.
   * **Privacy / Stealth Mode Integration**: Fully respects `PrivacyContext` (`isBalancesHidden`), replacing monetary figures in the donut center, hover tooltips, and legend rows with masked bullet strings (`••••••`).
   * **Interactive Donut Hover**: Hovering over any slice shifts the arc outward (`scale(1.04)`) and updates the center label to display the slice name, weight percentage, and formatted monetary value (`formatINR`).
4. **Performance Bar Chart** (`BarChart.tsx`):
   * Bar visualization comparing invested value vs current market value per asset class.

### Portfolio Insights & Health Metrics

* Component: `InsightsPanel.tsx`
* Metrics Evaluated:
  * **Portfolio Health Score**: Weighted 0-100 metric calculated based on asset diversification, concentration risk, and liquidity.
  * **Top 5 Today's Movers**: Displays the **top 5 daily movers** ranked by absolute percentage movement with compact spacing (`space-y-2`) and scaled badge icons (`w-7 h-7`).
  * **Allocation Drift Alerts**: Highlights asset classes exceeding target allocation thresholds.
  * **Upcoming FD Maturities (30 Days)** & **Insurance Renewals (60 Days)**: Urgency notification cards with direct action buttons.

---

## 4. 📱 Layout Architecture: Mobile View

The mobile view adapts to viewports under `768px`, substituting sidebars with bottom tab bars, touch swipe navigation, collapsible cards, pull-to-refresh gates, and bottom sheet action menus.

```
+-------------------------------------------------------------+
| MOBILE TOP HEADER                                           |
| [Logo] Family Wealth   (Eye)  (Sync Pill)  (Bell)  (Theme)  |
+-------------------------------------------------------------+
| FAMILY MEMBER HORIZONTAL SCROLL PILLS                       |
| ( All )  ( Personal )  ( Spouse )  ( Parents )              |
+-------------------------------------------------------------+
| MOBILE HOME WEALTH SUMMARY CARDS                            |
| +---------------------------------------------------------+ |
| | NET WORTH TOTAL                                         | |
| | ₹ 42,85,400.00                    [ +1.8% Today ]     | |
| +---------------------------------------------------------+ |
| | [Invested: ₹34L] | [Today PnL: +₹12.4K] | [Total PnL: ...] |
| +---------------------------------------------------------+ |
|                                                             |
| ASSET CLASS GRID & TOUCH CARDS (Swipe Left/Right to Switch) |
| [ Stocks: ₹18.5L ] [ FDs: ₹8.0L ] [ Mutual Funds: ₹6.2L ]   |
| [ Gold: ₹4.1L   ] [ Real Estate ] [ Insurance Policies  ]   |
|                                                             |
+-------------------------------------------------------------+
| FIXED BOTTOM NAVIGATION BAR (with Safe-Area Padding)        |
| [ 🏠 Home ]  [ 📈 Assets ]  [ ➕ FAB ]  [ 🔔 Alerts ] [ ⚙️ ]  |
+-------------------------------------------------------------+
```

### Passcode Lock Screen (iOS 17/18 Style)

* Component: `PinLockScreen.tsx`
* Visual Design:
  * Background: Aurora purple-to-blue gradient overlay with radial soft lights.
  * Clock & Header: Live iOS-style bold time & date display.
  * Animated Padlock Icon: Switches smooth state between locked and unlocked keyhole states.
  * Keypad: 3x4 grid of circular frosted glass buttons (`backdrop-filter: blur(16px)`), featuring large numeric digits (1-9, 0) and telephone letter sub-labels (ABC, DEF, GHI...).
  * PIN Dots: 4 circular dots that glow soft blue when filled and execute a horizontal shake animation on incorrect passcode input.

### Mobile Top Bar & Family Pill Selector

* Compact Header: Reduced height (`h-12`), showing logo, current portfolio context, privacy eye toggle, refresh icon, alert bell badge, and dark mode toggle.
* Family Selector: Touch-scrollable horizontal row of pill buttons featuring edge gradient masks (`mask-image: linear-gradient(...)`) indicating off-screen content.

### Mobile Home Wealth Summary View

* Component: `MobileHomeSummary.tsx`
* Optimizations:
  * Defensive text truncation (`truncate`) preventing number wrapping on narrow screens (320px–375px).
  * Collapsible quick category cards displaying total balance, asset count, and daily change per category.
  * Single-pass `useMemo` computation loop ensuring smooth 60FPS scrolling.

### Mobile Bottom Navigation Bar

* Component: `MobileBottomNav.tsx`
* Fixed Position: `fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-[var(--border-subtle)]`.
* Safe Area: Utilizes `.pb-safe` (`padding-bottom: env(safe-area-inset-bottom, 8px)`) to accommodate iOS home indicator bars.
* Nav Items:
  1. **Home**: Directs to overall mobile summary view.
  2. **Assets**: Opens active asset tab menu.
  3. **Add (+ FAB)**: Center elevated action button opening `FloatingAddMenu`.
  4. **Alerts**: Opens `MobileAlertsView` drawer with active alert badge.
  5. **Widgets / Tools**: Accesses What-If calculator and tax harvesting views.

### Mobile Floating Add Menu (FAB & Action Sheet)

* Component: `FloatingAddMenu.tsx`
* Layout: Triggered via the mobile FAB button. Pops up a glassmorphic action sheet presenting all asset entry types (Stock, Fixed Deposit, RD, Mutual Fund SIP, Gold, Real Estate, Insurance Policy, Document).
* Position Customization: Features customizable button positioning (`'right'` | `'center'` | `'left'`) with persistent `localStorage` storage (`finance_fab_position`). Defaulted to **Right side** (`right-2 items-end`) to prevent blocking center card titles and values. Includes an interactive position switcher pill (`[ Left ↙ | Center ⬇ | Right ↘ ]`) inside the menu header bar for instant toggling.
* State Visibility: Automatically hidden when `isAnyModalOpen` is true (managed via [`useModalState.ts`](src/hooks/useModalState.ts)).

### Mobile Alerts Drawer & Page

* Component: `MobileAlertsView.tsx`
* Features: Touch-optimized list of active system alerts with one-tap dismissals and categorized color badges (Blue for 52-week highs, Amber for lows, Indigo for FD maturity, Rose for Insurance renewal).

### Touch Gestures & UX Adaptations

* **Touch Swipe Navigation (`useSwipeNavigation.ts`)**: Allows horizontal finger swiping across the main screen to transition between consecutive asset tabs (*Stocks → FDs → RDs → SIPs → Gold*).
* **Pull-to-Refresh (`usePullToRefresh.ts`)**: Dragging down from the top of the mobile home summary triggers an active price sync indicator and re-validates SWR market caches.
* **Touch Targets**: All mobile buttons enforce a minimum 44px × 44px tap area for optimal thumb interaction.

---

## 5. 🧩 Asset Class Registry Views & Component Specs

### Stock & ETF Holdings Table & Management

* **Desktop & Table Component**: `PortfolioTable.tsx`
* **Core Table Architecture**:
  * **11 Financial Metrics Columns**: Compacted horizontal padding (`px-2`) and ticker name truncation (`max-w-[140px]`) allow all 11 columns to fit full-width on desktop viewports (`≥ 1024px`) without horizontal scrollbars:
    1. **Ticker / Company Name**: Stock ticker symbol, full company name, and security type badge (e.g. `RELIANCE`, `TCS`, `NIFTYBEES [ETF]`).
    2. **Quantity**: Total shares/units held with tabular formatting (`.tnum`).
    3. **Avg Buy Price**: Average acquisition cost per unit (`formatINR`).
    4. **CMP (Current Market Price)**: Real-time stock price with live pulse dot indicator.
    5. **Invested Amount**: Total principal invested (`Qty × Avg Price`).
    6. **Current Value**: Live position valuation (`Qty × CMP`).
    7. **Portfolio Allocation %**: Weight share of holding relative to total portfolio net worth (`formatPercent`).
    8. **Today's Change**: 24-hour P&L fluctuation with system green/red color indicator and `%` badge.
    9. **Total Return (P&L)**: Overall unrealized profit/loss in monetary value (`₹`) and return percentage (`%`).
    10. **Share Action**: Instant button trigger (`shareHolding`) to export holding performance summary snippet.
    11. **Management Actions**: Dedicated action column pencil button opening `EditStockModal` and delete button triggering `ConfirmModal`. (Inline pen icons removed from QTY and Avg Price cells to prevent visual noise).
* **Quick Filter Pills**:
  * **All**: Displays complete stock & ETF portfolio with total asset count badge.
  * **Gainers**: Filters holdings with positive total P&L (`unrealizedPnL > 0`).
  * **Losers**: Filters holdings with negative total P&L (`unrealizedPnL < 0`).
  * **ETFs**: Filters Exchange Traded Funds based on security type tag or name match (`type === 'etf'` or name/ticker contains `etf`).
* **Preset Sorting Controls**:
  * Quick sort presets (*Current Value*, *P&L Amount*, *P&L %*, *Today %*, *Allocation %*) with toggleable ascending/descending direction indicators (`▲` / `▼`).
* **Stock & ETF Modals**:
  * **`AddHoldingModal.tsx`**: Add stock/ETF holding with ticker autocomplete search, quantity, average buy price, transaction date, and target portfolio selector.
  * **`EditStockModal.tsx`**: Inline editing modal to update holding quantity or average purchase price with validation error feedback.
* **Mobile View Adaptations**:
  * Adapts table rows into responsive mobile asset cards with stock ticker avatar, quantity badge, CMP indicator, expandable P&L drawer, and touch action controls.

### Fixed Deposits (FD) View & Cards

* Component: `FixedDepositView.tsx` & `DepositDetailsCard.tsx`
* Cards Specs:
  * Bank Name & Logo Badge (e.g., HDFC, ICICI, SBI).
  * Principal Amount vs Projected Maturity Amount split.
  * Interest Rate Pill (`% p.a.`) and Tenor Duration.
  * Progress Bar: Visual bar showing elapsed tenure percentage toward maturity.
  * Maturity Alert: Highlights in amber when within 30 days of maturity.
  * Share Action: Copies summary snippet to clipboard triggering dark-mode aware `useToast` notification (`Summary copied to clipboard!`).

### Recurring Deposits (RD) View & Installments

* Component: `RDView.tsx`, `RDAccountCard.tsx`, & `RDInstallmentSchedule.tsx`
* Visual Specs:
  * Monthly Commitment Indicator: Shows monthly deposit requirement and execution date.
  * Accumulated Balance Tracker.
  * Installment Schedule Matrix: Interactive calendar list checking off paid monthly installments vs pending future deposits.
  * Share Action: Uses `useToast` for copy-to-clipboard feedback.

### Mutual Fund SIP View & NAV Tracker

* Component: `SIPView.tsx` & `SIPAccountCard.tsx`
* Features:
  * Direct integration with AMFI Live Mutual Fund NAV schemes.
  * Displays Scheme Category (Equity, Debt, Hybrid, Index), Monthly SIP Date, and Total Amount Invested.
  * XIRR Returns Badge: Calculated annualized internal rate of return.
  * Active / Paused status pill toggle.
  * Share Action: Uses `useToast` for copy-to-clipboard feedback.

### Physical & Digital Gold View

* Component: `GoldHoldingView.tsx`
* Specifications:
  * Supports 3 Sub-types: Sovereign Gold Bonds (SGB), Digital Gold, and Physical Bullion/Jewelry.
  * Tracks Weight in Grams, Purchase Rate per Gram, and Live Benchmark Rate (24K Gold per Gram).
  * SGB Interest Earnings Tracker (2.5% p.a. semi-annual payout indicator).

### Real Estate Asset Cards

* Component: `RealEstateView.tsx`
* Visual Attributes:
  * Property Type Tags: Residential, Commercial, Land / Plot.
  * Purchase Value vs Current Estimated Market Valuation.
  * Rental Income Yield: Monthly rental collection metric and annualized yield %.
  * Property Location tag and ownership share split.

### Insurance Policies View & Renewal Urgency

* Component: `InsuranceView.tsx`
* Features:
  * Policy Types: Term Life, Health Insurance, Vehicle Insurance, ULIP / Investment.
  * Sum Assured Coverage Amount vs Annual Premium Cost.
  * Expiry / Premium Due Date: Features urgency badges (Rose tag when due within 60 days).

### Document Vault View

* Component: `DocumentVaultView.tsx`
* Structure:
  * Organized Grid: Categorized cards for PAN Cards, Aadhaar, Insurance Papers, FD Certificates, and Property Deeds.
  * Expiration Warning Pills: Highlights identity documents or policies nearing expiration.
  * Secure Download / View action triggers.

### Tax Harvesting Recommendation View

* Component: `TaxHarvestingView.tsx`
* Components:
  * Short-Term Capital Gains (STCG) vs Long-Term Capital Gains (LTCG) Summary Cards.
  * ₹1.25 Lakh Annual LTCG Exemption Progress Bar.
  * Harvesting Opportunity List: Recommends specific stock/ETF holdings to sell and repurchase to offset taxable capital gains.

### Portfolio Assistant (AI Conversational UI)

* Component: `PortfolioAssistant.tsx`
* Specs:
  * Chat Log: Message history with user speech bubbles right-aligned and AI response bubbles left-aligned.
  * Markdown Support: Formatted bullet points, bold key figures, and tabular financial summaries.
  * Dynamic Prompt Suggestion Pills: One-tap prompt pills ("Analyze my asset allocation", "Show top risk factors", "Calculate my tax exposure").
  * Inline Icons: Integrated `Bot` and `User` SVG icons from `AppIcons.tsx`.

---

## 6. 🪟 Modal System & Overlay Architecture

All modal dialogs across the application share a single, unified draggable modal component (`Modal.tsx`) managed through `useModalState.ts`.

```
+-----------------------------------------------------------------------+
| MODAL BACKDROP (Fixed Fullscreen, Backdrop Blur 8px)                  |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  | MODAL CONTAINER (Spring Scale-in 0.35s, Max Height 72vh)          |  |
|  +-----------------------------------------------------------------+  |
|  | HEADER BAR (Pointer Event Draggable Handle)                     |  |
|  | Modal Title                             [ ⚙️ Settings ]  [ X Close ] |  |
|  +-----------------------------------------------------------------+  |
|  | SCROLLABLE FORM BODY (flex-1 min-h-0 overflow-y-auto px-6 py-4)  |  |
|  |                                                                 |  |
|  | [ Form Field 1 Input ]       [ Form Field 2 Select ]            |  |
|  | [ Form Field 3 Date  ]       [ Form Field 4 Currency ]          |  |
|  |                                                                 |  |
|  +-----------------------------------------------------------------+  |
|  | PINNED ACTION FOOTER (bg-surface border-t)                       |  |
|  | [ Cancel Button ]                        [ Save Asset Button ]  |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
+-----------------------------------------------------------------------+
```

### Unified Draggable Modal Frame

* **Pointer Dragging**: Header listens to `onPointerDown`, `pointermove`, `pointerup` to allow smooth modal repositioning across the desktop viewport using hardware-accelerated `translate3d`.
* **Height Constraints**: Constrained to `max-h-[calc(100vh-5rem)] sm:max-h-[72vh]`.
* **Flex Layout**:
  * Pinned Drag Header (Non-scrolling).
  * Scrollable Body (`flex-1 min-h-0 overflow-y-auto`): Form fields scroll cleanly inside the middle section.
  * Pinned Footer (Non-scrolling): Action buttons remain visible at all times.
* **Accessibility**: Listens to `Escape` keypress to close active modal dialog. Sets `role="dialog"` and `aria-modal="true"`.

### Form Modals Specification

* **`AddHoldingModal.tsx`**: Add/Edit Stock & ETF holdings (Ticker lookup, quantity, buy price, date, portfolio context).
* **`FDFormModal`**: Fixed Deposit details (Bank name, principal, rate %, start date, maturity date).
* **`RDFormModal.tsx`**: Recurring Deposit inputs (Bank, monthly installment, interest rate %, tenure months).
* **`SIPFormModal.tsx`**: Mutual Fund SIP inputs (Fund name scheme lookup, monthly SIP amount, SIP day of month).
* **`AddFamilyModal.tsx`**: Add new family member portfolio (Member name, relationship tag).
* **`RenamePortfolioModal.tsx`**: Rename portfolio alias.
* **`ChangePinModal.tsx`**: Update 4-digit security PIN.

### Confirmation Dialogs & Context Menus

* **`ConfirmModal.tsx`**: Destruction confirmation dialog for asset/portfolio deletion with danger red primary action button.
* **`ContextMenu.tsx`**: Right-click or long-press contextual dropdown menu for quick actions (Edit, Delete, Duplicate).

### Toast Notification Stack

* Component: `Toast.tsx` & `ToastContext.tsx`
* Position: Top-right on desktop (`top-4 right-4`), top-center on mobile (`top-3`).
* Variants & Durations:
  * Success / Info / Warning: `4,000ms` auto-dismiss with progress countdown.
  * Error: `8,000ms` extended duration (or manual dismissal) ensuring users have ample time to read error trace diagnostics.
* Auto-Dismiss: Slide-out animation. Completely replaces raw browser `alert()` popups across the entire application.

---

## 7. ⏳ State Representations & Micro-Interactions

### Shimmer Skeleton Loading States

* Components: `AssetCardSkeleton.tsx` & `DashboardLoading.tsx`
* CSS Utility: `.shimmer-bg` and `.shimmer-bar`
* Animation: Linear gradient highlight moving left-to-right (`@keyframes shimmerAnimation`) matching the precise layout of actual asset cards and summary tiles to prevent layout shift (CLS).

### Empty States

* Component: `EmptyState.tsx`
* Visuals: Contextual icon enclosed in a soft blue circle, clear title (e.g., "No Fixed Deposits Added"), descriptive subtext, and a prominent call-to-action button ("+ Add Your First FD").

### Privacy / Stealth Mode

* Managed via `PrivacyContext.tsx`.
* When activated via the top header eye icon:
  * Replaces all monetary values (Net Worth, Invested, P&L, Asset Values) with blurred or masked bullet strings (`••••••`).
  * Exposes `aria-label="Amount hidden"` on masked bullet elements for screen reader clarity.
  * Preserves percentage badges and asset count numbers so users can review allocation percentages in public settings without revealing net worth figures.

### Error Boundaries & Offline Fallbacks

* **`ErrorBoundary.tsx` / `SectionErrorBoundary.tsx`**: Catches rendering failures cleanly within individual widgets or tabs without crashing the parent application. Displays a friendly fallback container with a "Retry Section" button.
* **Offline Banner**: Sticky subtle bar indicating internet connection loss, gracefully serving cached portfolio data from IndexedDB (`idb-keyval`).

---

## 8. 🖨️ Print & PDF Export UI Styling

The application includes dedicated `@media print` CSS overrides optimized for clean A4 PDF generation via `ExportPanel.tsx`:

```css
@media print {
  /* Hide non-printable UI elements */
  header, nav, footer, button, input, select,
  [data-quick-actions], [data-search-bar], [data-alerts-banner] {
    display: none !important;
  }

  /* Force background colors and remove card shadows */
  body { background: white !important; color: #1d1d1f !important; }
  .apple-card, .glass-panel { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }

  /* Page break optimization */
  .rounded-2xl, [role="region"] {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  @page {
    margin: 1.5cm;
    size: A4;
  }
}
```

---

## 9. 📐 Responsive Breakpoint Matrix & Summary

| Breakpoint Target | Width Boundary | Applied Adaptations & Layout Behavior |
| :--- | :--- | :--- |
| **Mobile Extra Small (`xs`)** | `< 375px` | Single-column summary layout, compact financial numbers (`text-[20px]`), hidden secondary metadata, 44px tap targets. |
| **Mobile Standard (`sm`)** | `375px – 639px` | Mobile Home Summary view, horizontal family pill selector, 2-column asset grid, fixed bottom nav bar, swipe gestures active. |
| **Tablet (`md`)** | `640px – 767px` | 2-column summary cards, visible header net worth indicator, enlarged chart containers, slide-over modals. |
| **Desktop Small (`lg`)** | `768px – 1023px` | Pinned desktop sidebar appears (`w-64`), bottom nav hidden, 2x2 equalized widget grid (370px height), desktop header active. |
| **Desktop Standard (`xl`)** | `1024px – 1279px` | 4-column summary cards, expanded stock holdings table (11 columns visible without horizontal scrollbar), live price badges. |
| **Widescreen Desktop (`2xl`)** | `≥ 1280px` | Maximum container width capped at `1720px`, centered with full-density metrics panels, insights breakdown, and chart crosshairs. |

---

## 10. ♿ Accessibility & Motion Preferences 🆕

The application enforces accessibility standards to ensure high legibility, color independence, assistive tech compatibility, and motion reduction:

### 1. Color Independence & Financial Signals
* **Redundant Cues**: Financial indicators utilizing `--positive` (green) or `--negative` (red) always pair color with a `+` / `-` sign prefix or directional arrow icon (▲ / ▼).
* Applies across Summary Cards, Stock Table (*Today's Change*, *Total Return*), and Insights Movers list.

### 2. Reduced Motion Overrides (`prefers-reduced-motion`)
* **CSS Overrides** (`src/index.css`):
  * Disables spring scale-in on `.animate-modal-content` in favor of an instant opacity fade.
  * Sets `.animate-sparkline-draw` `stroke-dashoffset: 0` immediately on mount.
  * Disables `.ios-press` tactile button scaling.
* **Animated Numbers (`useAnimatedCounter.ts`)**: Skips `requestAnimationFrame` count-up interpolation and instantly displays target numeric values.

### 3. Screen Reader & Assistive Tech Accessibility
* **Stealth Mode Masking**: Masked monetary values (`••••••`) expose `aria-label="Amount hidden"` to prevent screen readers from reading bullet glyphs.
* **Polite Live Regions**: Primary Net Worth valuation updates use `aria-live="polite"`.
* **Modal Dialog Focus & Keyboard Traps**: Unified `Modal.tsx` sets `role="dialog"`, `aria-modal="true"`, and handles `Escape` keypress to close active modals.

### 4. Interactive Touch Targets
* All desktop and mobile icon buttons (Theme Toggle, Privacy Eye, Alerts Bell, Lock) enforce a minimum 44px × 44px interactive tap area (`min-w-[44px] min-h-[44px]`).

---

> **Note**: This document serves as the authoritative UI/UX design reference for developers, designers, and AI agents modifying or extending the Family Portfolio Tracker user interface.

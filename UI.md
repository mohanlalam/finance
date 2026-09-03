# 🎨 Family Portfolio Tracker — UI Design Specification (`UI.md`)

This document provides a comprehensive, exhaustive overview of the **User Interface (UI) and User Experience (UX) Design System** for the Family Portfolio Tracker application. It documents design tokens, core layout architectures, component specifications, screen wireframes, mobile vs. desktop view adaptations, animations, dark/light theme behavior, modal systems, keyboard shortcuts, and responsive UX patterns.

---

## 📑 Table of Contents

1. [Design Philosophy & Core Aesthetics](#1-design-philosophy--core-aesthetics)
2. [Design Tokens & Theme Architecture](#2-design-tokens--theme-architecture)
   - [Color Palette & Tokens](#color-palette--tokens)
   - [Typography & Tabular Numerics](#typography--tabular-numerics)
   - [Corner Radii, Elevation Shadows & Z-Index](#corner-radii-elevation-shadows--z-index)
   - [Motion Curves & Micro-Interactions](#motion-curves--micro-interactions)
   - [UI Component Primitives Library](#ui-component-primitives-library)
3. [Layout Architecture: Web / Desktop View](#3-layout-architecture-web--desktop-view)
   - [Desktop Layout Hierarchy](#desktop-layout-hierarchy)
   - [Header & Global Command Bar](#header--global-command-bar)
   - [Global Search Palette (Cmd/Ctrl + K)](#global-search-palette-cmdctrl--k)
   - [Sticky Desktop Navigation Sidebar](#sticky-desktop-navigation-sidebar)
   - [Family Selector & Tab Navigation](#family-selector--tab-navigation)
   - [Summary Cards & Sparklines](#summary-cards--sparklines)
   - [2x2 Equalized Dashboard Widget Grid](#2x2-equalized-dashboard-widget-grid)
   - [Portfolio Insights & Data Health Panel](#portfolio-insights--data-health-panel)
4. [Layout Architecture: Mobile View](#4-layout-architecture-mobile-view)
   - [Passcode Lock Screen (iOS 17/18 Style)](#passcode-lock-screen-ios-1718-style)
   - [Mobile Top Bar & Family Pill Selector](#mobile-top-bar--family-pill-selector)
   - [Mobile Home Wealth Summary View](#mobile-home-wealth-summary-view)
   - [Mobile Bottom Navigation Bar](#mobile-bottom-navigation-bar)
   - [Mobile Floating Add Menu (FAB & Action Sheet)](#mobile-floating-add-menu-fab--action-sheet)
   - [Holding Detail Slide-Over Drawer](#holding-detail-slide-over-drawer)
   - [Mobile Alerts Drawer & Page](#mobile-alerts-drawer--page)
   - [Touch Gestures, PWA Banner & Mobile Performance](#touch-gestures-pwa-banner--mobile-performance)
5. [Asset Class Registry Views & Component Specs](#5-asset-class-registry-views--component-specs)
   - [Standardized Asset Registry Shell](#standardized-asset-registry-shell)
   - [Stock & ETF Holdings Table](#stock--etf-holdings-table)
   - [Fixed Deposits (FD) View & Details Cards](#fixed-deposits-fd-view--details-cards)
   - [Recurring Deposits (RD) View & Installments](#recurring-deposits-rd-view--installments)
   - [Mutual Fund SIP View & Live NAV Tracker](#mutual-fund-sip-view--live-nav-tracker)
   - [Physical & Digital Gold View](#physical--digital-gold-view)
   - [Real Estate Asset Cards](#real-estate-asset-cards)
   - [Insurance Policies View & Renewal Urgency](#insurance-policies-view--renewal-urgency)
   - [Document Vault View & Taxonomy Attachment](#document-vault-view--taxonomy-attachment)
   - [Tax Harvesting Recommendation View](#tax-harvesting-recommendation-view)
   - [Portfolio Assistant (AI Conversational UI)](#portfolio-assistant-ai-conversational-ui)
6. [Modal System & Overlay Architecture](#6-modal-system--overlay-architecture)
   - [Unified Draggable Modal Frame](#unified-draggable-modal-frame)
   - [Standard Form Modals Matrix](#standard-form-modals-matrix)
   - [Smart CAS / Excel Portfolio Import Modal](#smart-cas--excel-portfolio-import-modal)
   - [Data Quality Health Diagnostic Modal](#data-quality-health-diagnostic-modal)
   - [Confirmation Dialogs & Context Menus](#confirmation-dialogs--context-menus)
   - [Toast Notification Stack](#toast-notification-stack)
7. [Keyboard Shortcuts & Quick Access Engine](#7-keyboard-shortcuts--quick-access-engine)
8. [State Representations & Micro-Interactions](#8-state-representations--micro-interactions)
   - [Shimmer Skeleton Loading States](#shimmer-skeleton-loading-states)
   - [Empty State Guidelines](#empty-state-guidelines)
   - [Privacy / Stealth Mode Masking](#privacy--stealth-mode-masking)
   - [Error Boundaries & Offline Fallbacks](#error-boundaries--offline-fallbacks)
9. [Print & PDF Export UI Styling](#9-print--pdf-export-ui-styling)
10. [Responsive Breakpoint Matrix & Summary](#10-responsive-breakpoint-matrix--summary)
11. [Accessibility & Motion Preferences](#11-accessibility--motion-preferences)

---

## 1. 🎯 Design Philosophy & Core Aesthetics: The Antigravity Aesthetic

The application embraces the **Antigravity Design Aesthetic** (Cyber-Zen, weightless suspension, and translucent glassmorphism) paired with precision financial data density:

* **Weightless Suspension & Zero-G Atmosphere**: Instead of a heavy grounded footer, elements float naturally above a deep cosmic void (`#040711` dark mode) accented with subtle atmospheric ambient nebula glows (cyan, purple, emerald) and crystalline prism backdrops in light mode.
* **Glassmorphic Floating Surfaces (`.apple-card`, `.antigravity-card`)**: Surfaces use `backdrop-filter: blur(24px) saturate(180%)`, frosted translucency (`rgba(15, 23, 42, 0.65)`), and 1px luminous edge highlights (`rgba(255, 255, 255, 0.09)`) with ambient specular reflections.
* **Cyber-Zen Wide-Tracked Typography & Glowing Financial Accents**: Section tags, category badges, and column headers use wide tracking (`tracking-wider` / `tracking-widest`). Key financial numbers radiate subtle neon glows (`.neon-glow-positive` with `#10b981`, `.neon-glow-negative` with `#f43f5e`, `.neon-glow-gold` with `#f59e0b`).
* **Floating Island Navigation**: Dynamic Island frosted header, floating pill family selector with glowing capsules, and a floating glass mobile bottom dock.
* **Tactile Spring Physics**: Spring physics transitions (`cubic-bezier(0.16, 1, 0.3, 1)`), tactile micro-scaling (`scale(0.965)`), and gentle zero-G hovering ascension.

---

## 2. 🎨 Design Tokens & Theme Architecture

The visual theme is governed by CSS Custom Properties declared in `src/index.css` and mapped across Tailwind CSS utility classes. **`UI.md` serves as the authoritative single source of truth for all design tokens, color codes, typography scales, radii, elevation shadows, and component specifications.** Other architecture documents (such as `GEMINI.md`) reference this specification to prevent silent token drift.

### Color Palette & Tokens (Canonical)

| Token Name | Light Mode | Dark Mode | Usage Scope |
| :--- | :--- | :--- | :--- |
| `--app-background` | `#f8fafc` | `#040711` | Main viewport cosmic canvas background |
| `--surface` | `rgba(255, 255, 255, 0.78)` | `rgba(15, 23, 42, 0.65)` | Primary floating glass card (`.apple-card`, `.antigravity-card`) |
| `--surface-secondary` | `rgba(241, 245, 249, 0.85)` | `rgba(30, 41, 59, 0.7)` | Form fields, card headers, hover states |
| `--surface-tertiary` | `rgba(226, 232, 240, 0.9)` | `rgba(51, 65, 85, 0.7)` | Scrollbar thumb, disabled controls, dividers |
| `--surface-glass` | `rgba(255, 255, 255, 0.75)` | `rgba(15, 23, 42, 0.7)` | Frosted glass floating navigation and modal headers |
| `--text-primary` | `#0f172a` | `#f8fafc` | Primary titles, net worth values, headings |
| `--text-secondary` | `#475569` | `#94a3b8` | Subtitles, section headers, secondary labels |
| `--text-tertiary` | `#64748b` | `#64748b` | Muted metadata, timestamps, table column headers |
| `--accent-blue` | `#0284c7` | `#38bdf8` | Primary action buttons, active navigation indicators, cyan highlights |
| `--accent-blue-soft` | `rgba(2, 132, 199, 0.08)` | `rgba(56, 189, 248, 0.14)` | Selected tab pills, info badges |
| `--positive` | `#059669` | `#10b981` | Profit indicators, glowing positive gain badges |
| `--positive-soft` | `rgba(16, 185, 129, 0.1)` | `rgba(16, 185, 129, 0.16)` | Positive summary card accent background |
| `--negative` | `#e11d48` | `#f43f5e` | Loss indicators, glowing negative return badges |
| `--negative-soft` | `rgba(225, 29, 72, 0.1)` | `rgba(244, 63, 94, 0.16)` | Loss summary card accent background |
| `--warning` | `#d97706` | `#f59e0b` | Stale price alerts, upcoming maturity/renewal warnings |
| `--warning-soft` | `rgba(245, 158, 11, 0.1)` | `rgba(245, 158, 11, 0.16)` | Caution banner backgrounds |
| `--border-subtle` | `rgba(203, 213, 225, 0.6)` | `rgba(255, 255, 255, 0.09)` | 1px clean container & card borders |
| `--border-glass` | `rgba(255, 255, 255, 0.9)` | `rgba(255, 255, 255, 0.14)` | Glassmorphic floating borders |
| `--border-luminous` | `rgba(2, 132, 199, 0.25)` | `rgba(56, 189, 248, 0.3)` | Luminous focus and active container borders |
| `--backdrop-overlay` | `rgba(15, 23, 42, 0.35)` | `rgba(2, 6, 23, 0.8)` | Modal backdrop blur overlays |

### Canonical Asset Class Color Palette (`ASSET_COLORS`)

| Asset Class | Key | Hex Code | HSL ($H, S, L$) | Semantic Role |
| :--- | :--- | :--- | :--- | :--- |
| **Stocks & ETFs** | `stocks` | `#387ed1` | $(213^\circ, 63\%, 52\%)$ | Kite Sky Blue |
| **Fixed Deposits** | `fd` | `#06b6d4` | $(189^\circ, 94\%, 43\%)$ | Luminous Cyan-Teal (High Dark-Mode Luminance) |
| **Recurring Deposits** | `rd` | `#c2410c` | $(21^\circ, 90\%, 40\%)$ | Deep Rust Tangerine |
| **Mutual Fund SIPs** | `sip` | `#9333ea` | $(271^\circ, 81\%, 56\%)$ | Systematic Growth Violet |
| **Gold Bullion** | `gold` | `#facc15` | $(50^\circ, 95\%, 53\%)$ | Pure Solar Gold |
| **Real Estate** | `realEstate` | `#16a34a` | $(142^\circ, 76\%, 36\%)$ | Evergreen Land & Property |

> **Donut / Chart Ring Sequencing Rule**: To avoid contiguous gradient sweeps where adjacent warm/cool colors blur into one another (e.g. Gold next to RD), charts sequence categories in alternating warm and cool hues: **Stocks (Blue) $\rightarrow$ Gold (Yellow) $\rightarrow$ FD (Cyan) $\rightarrow$ RD (Rust) $\rightarrow$ SIP (Violet) $\rightarrow$ Real Estate (Green)**.

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
| `.text-label-micro` | `10px` | `10px` | `500` (Medium) | `1.2` | Ultra-compact badge labels |

#### Tabular Number Rules
* **`.tnum` / `.text-financial`**: Enforces `font-variant-numeric: tabular-nums` and `font-feature-settings: "tnum" 1, "cv05" 1, "cv01" 1`. Prevents layout jitter when financial values change dynamically.
* **`.ios-currency`**: Renders currency symbols (₹, $) with reduced opacity (`0.85`) and lighter weight (`300`) for subtle visual hierarchy.
* **`AnimatedNumber`**: Smooth count-up interpolation using `requestAnimationFrame` with cubic ease-out transitions. Automatically falls back to static rendering when `prefers-reduced-motion` is enabled.

### Corner Radii, Elevation Shadows & Z-Index

To maintain a compact, crisp financial interface, corner radii and shadows are strictly standardized:

* **Radii Tokens**:
  * `--radius-small` (`6px`): Badges, table filter pills, small icon buttons.
  * `--radius-medium` (`10px`): Asset cards (`.apple-card`), form text inputs, select dropdowns.
  * `--radius-large` (`14px`): Modal containers, major dashboard chart panels, lock screen keypads.
  * `--radius-sheet` (`20px`): Mobile bottom sheets and drawer top corners.
  * `--radius-pill` (`999px`): Status indicators, rounded pill tags.

* **Shadow Tokens**:
  * `--shadow-card`: `0 1px 2px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.03), 0 1px 0 rgba(255,255,255,0.8) inset` (Light) / `0 1px 3px rgba(0,0,0,0.4), 0 6px 20px rgba(0,0,0,0.35)` (Dark).
  * `--shadow-floating`: `0 12px 32px -4px rgba(15,23,42,0.12)` (Light) / `0 16px 40px rgba(0,0,0,0.65)` (Dark) for modals and dropdown menus.

* **Z-Index Scale**:
  * `--z-base`: `1` (Normal content flow)
  * `--z-dropdown`: `100` (Dropdown menus, tooltips, context menus)
  * `--z-sticky`: `200` (Sticky headers, sticky desktop sidebar, floating search bar)
  * `--z-overlay`: `300` (Drawers, search palette overlays, backdrop curtains)
  * `--z-modal`: `400` (Modal windows, form dialogs, diagnostic tools)
  * `--z-toast`: `500` (Global snackbar notifications)

### Motion Curves & Micro-Interactions

* **Tactile Press Feedback (`.ios-press`)**:
  ```css
  .ios-press {
    transition: transform 0.14s var(--ios-spring), background-color 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
  }
  .ios-press:active {
    transform: scale(0.975);
    opacity: 0.92;
  }
  ```
* **Modal Scale-In (`.animate-modal-content`)**: `0.35s` duration using `cubic-bezier(0.34, 1.56, 0.64, 1)` spring expansion.
* **Sparkline Line Draw (`.animate-sparkline-draw`)**: SVG line drawing over `0.8s` using `stroke-dashoffset` animation.
* **Tab Fade In (`.tab-transition`)**: `0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)` with slight vertical translation (`translateY(2px) → translateY(0)`).

### UI Component Primitives Library

Located in `src/components/ui/`, this collection of atomic primitives standardizes design token usage across the app:

* **`Button.tsx`**: Standardized variants (`primary`, `secondary`, `outline`, `danger`, `ghost`) with tactile press feedback (`.ios-press`), loading spinners, and icon slots.
* **`Card.tsx`**: Surface container with `.apple-card` styling, header/body/footer sub-components, and optional hover elevation.
* **`Badge.tsx`**: Status indicator pill supporting variants (`success`, `danger`, `warning`, `info`, `neutral`) and sizes (`sm`, `md`).
* **`Input.tsx` & `Select.tsx`**: Styled form controls with floating labels, error text support, prefix/suffix currency adornments, and clean dark mode styles.
* **`Modal.tsx` (`src/components/Modal.tsx`)**: Canonical draggable form modal frame with hardware-accelerated transitions, pointer drag repositioning, Escape dismiss, and mobile slide-up bottom sheet transitions.
* **`FinancialMetric.tsx`**: Compact tabular metric component rendering label, primary value (`formatINR`), and positive/negative delta badge.
* **`Sparkline.tsx`**: Standalone SVG micro-chart with dynamic gradient fills and mount draw animations.
* **`StatCard.tsx`**: High-level statistical summary card with sparkline slot and subtitle deltas.
* **`QuickAccessShortcuts.tsx`**: Modal or toolbar overlay displaying active keyboard shortcut cheat sheets.
* **`DocumentAttachmentField.tsx`**: Universal document uploader with file validation, 10MB limits, and taxonomy category selector.
* **`AssetRegistryContainer.tsx`**: Standardized wrapper for all asset registries with search filter bar, sorting dropdowns, and count badges.

---

## 3. 🖥️ Layout Architecture: Web / Desktop View

The web view is designed for wide screens (`md: 768px` up to `2xl: 1720px`), emphasizing multi-column dashboards, high data density, sticky navigation, and keyboard accessibility.

```
+---------------------------------------------------------------------------------------------------------------+
|                                      HEADER BAR (Sticky Top, Max-W: 1720px)                                   |
| Logo | Portfolio Name | Global Search (Cmd+K) | Privacy | Net Worth | Market Sync | Alerts | Theme | PIN Lock |
+---------------------------------------------------------------------------------------------------------------+
|                                      GLOBAL ALERTS BANNER (When Active Alerts Exist)                          |
+---------------------------------------------------------------------------------------------------------------+
|                                      FAMILY TAB BAR (Horizontal Scroll)                                       |
| [All Family]  [Personal]  [Spouse]  [Parents]  [+ Add Member]                         [Rename]  [Delete]      |
+-------------------------------+-------------------------------------------------------------------------------+
| DESKTOP SIDEBAR (Sticky Left) | MAIN DASHBOARD CONTENT AREA                                                   |
|                               |                                                                               |
|  📊 All Overview              |  [ SUMMARY CARDS (Net Worth | Invested | Today PnL | Total PnL) ]                 |
|  📈 Stock Holdings            |                                                                               |
|  🏦 Fixed Deposits            |  [ FAMILY MEMBER OVERVIEW CARDS (When 'All' selected) ]                        |
|  🔄 Recurring Deposits        |                                                                               |
|  💰 Mutual Fund SIPs          |  [ 2x2 EQUALIZED DASHBOARD WIDGET GRID (Height: 370px) ]                       |
|  🥇 Physical & Digital Gold   |  +-----------------------------------+-------------------------------------+  |
|  🏢 Real Estate               |  | Net Worth Timeline Chart (SVG)    | Portfolio AI Assistant (Chatbot)    |  |
|  🛡️ Insurance Policies        |  +-----------------------------------+-------------------------------------+  |
|  📁 Document Vault            |  | Asset Allocation (Pie / Donut)    | Asset Performance (Bar Chart)       |  |
|  ⚖️ Tax Harvesting            |  +-----------------------------------+-------------------------------------+  |
|                               |                                                                               |
|                               |  [ PORTFOLIO INSIGHTS & DATA HEALTH METRICS PANEL ]                           |
|                               |                                                                               |
|                               |  [ ACTIVE ASSET REGISTRY TABLE / CONTAINER VIEW ]                             |
+-------------------------------+-------------------------------------------------------------------------------+
```

### Desktop Layout Hierarchy

1. **Header Bar** (`Header.tsx`): Fixed top bar spanning up to `1720px` max container width.
2. **Global Alerts Banner** (`AlertsBanner.tsx`): High-priority notification strip for 52-week price swings, maturities (<30d), and premium dues (<60d).
3. **Family Tab Bar** (`FamilyTabBar.tsx`): Pinned under header, allowing instant portfolio context switching.
4. **Sidebar + Main Content Grid**:
   - Left Sidebar: `w-64`, `sticky top-6`, `self-start` height constraint (prevents vertical white space).
   - Right Main Area: `flex-1 min-w-0`, stacked in vertical order: Summary Cards → Family Member Cards → 2x2 Widget Grid → Portfolio Insights → Asset Category Registry View.

### Header & Global Command Bar

* **Left Section**:
  * App Icon: Blue rounded square (`w-8 h-8 rounded-lg bg-blue-600`) with white trending line SVG.
  * Brand & Context Labels: "Family Wealth" (`text-sm font-extrabold`) over active portfolio sub-label ("Family Portfolio" or member name).
* **Center Section**:
  * **Global Search Bar Launcher** (`SearchBar.tsx`): Prominent search trigger displaying `Cmd/Ctrl + K` badge. Clicking or pressing shortcut launches the global search palette.
* **Right Utilities**:
  * **Net Worth Display** (Desktop only): Formatted INR total next to positive/negative total percentage return badge.
  * **Privacy Eye Toggle** (`Cmd/Ctrl + P`): Button switching between open values and bullet masks (`••••••`).
  * **Market Sync Status Pill**: Dynamic badge displaying "Live", "Syncing...", "Cached (Offline)", or "Stale".
  * **Alerts Notification Bell**: Displays active alert counter badge; triggers dropdown list of price anomalies, maturity warnings, and renewal deadlines.
  * **Data Health Score Indicator**: Small pill triggering the Data Quality Health Diagnostic Modal.
  * **Theme Switcher** (`Cmd/Ctrl + D`): Sun / Moon icon button to toggle Light/Dark mode.
  * **PIN Lock Button** (`Cmd/Ctrl + L`): Instantly locks the session and returns to `PinLockScreen`.
  * **Tap Area Standards**: All desktop header utility buttons enforce a minimum 44px × 44px tap boundary (`min-w-[44px] min-h-[44px] flex items-center justify-center`).

### Global Search Palette (Cmd/Ctrl + K)

* Component: `SearchBar.tsx`
* Activated by clicking the search bar in the header or pressing `Cmd + K` (Mac) / `Ctrl + K` (Windows/Linux).
* Features:
  * **Omni-Search Indexing**: Instant client-side indexing across all family portfolios, stock tickers, FD accounts, RD accounts, Mutual Fund schemes, Gold holdings, Real Estate properties, Insurance policies, and Vault documents.
  * **Category Filter Pills**: Quick filter by `All`, `Stocks`, `Fixed Deposits`, `Gold`, `Real Estate`, `Insurance`, and `Documents`.
  * **Keyboard Navigation**: Full arrow-key navigation (`▲` / `▼`), `Enter` to select and jump directly to asset, `Esc` to close.

### Sticky Desktop Navigation Sidebar

* Component: `DesktopSidebar.tsx`
* Position: `sticky top-6`, constrained with `self-start` to avoid vertical stretching.
* **Sidebar Menu Items**:
  1. 📊 **All Overview** (`'all'`)
  2. 📈 **Stock Holdings** (`'stocks'`)
  3. 🏦 **Fixed Deposits** (`'fd'`)
  4. 🔄 **Recurring Deposits** (`'rd'`)
  5. 💰 **Mutual Fund SIPs** (`'sip'`)
  6. 🥇 **Gold Holdings** (`'gold'`)
  7. 🏢 **Real Estate** (`'real_estate'`)
  8. 🛡️ **Insurance Policies** (`'insurance'`)
  9. 📁 **Document Vault** (`'documents'`)
  10. ⚖️ **Tax Harvesting** (`'tax'`)
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
  1. **Total Net Worth**: Live balance, 24h change indicator, and 7-point Mini Sparkline.
  2. **Total Invested**: Principal capital allocated across all asset classes.
  3. **Today's P&L**: Daily fluctuation with system green/red indicator.
  4. **Total P&L / Returns**: Overall profit/loss with percentage badge and overall yield sparkline.
* **Sparklines**: Mini inline SVG graphs (`Sparkline.tsx`) with animated line-draw on mount (`.animate-sparkline-draw`).

### 2x2 Equalized Dashboard Widget Grid

All four core visualization widgets are constrained to an **equalized height of 370px** inside a `grid-cols-1 lg:grid-cols-2 gap-5` container to maintain strict visual alignment:

1. **Net Worth Timeline Chart** (`NetWorthTimelineChart.tsx`):
   * Interactive SVG line & filled area chart showing historical wealth growth.
   * Date range selector pills: `1M`, `3M`, `6M`, `1Y`, `ALL`.
   * Multi-series toggle: Total Portfolio, Stocks vs FDs, Stocks, FDs.
   * Interactive hover crosshair with exact date and valuation tooltip.
   * Empty state preview: Muted reference curve with glassmorphic badge overlay.
2. **Portfolio Assistant (AI Chatbot)** (`PortfolioAssistant.tsx`):
   * Conversational NLP panel formatted to 370px height matching neighboring charts with internal scroll body (`flex-1 min-h-0 overflow-y-auto`).
   * Features quick suggestion prompt pills, typing indicator, markdown formatting, memoized message rendering (`ChatMessageItem`), `Bot` SVG icon integration, and copy response button.
3. **Asset Allocation Donut Chart** (`PieChart.tsx`):
   * Donut chart representing portfolio breakdown across asset classes (Stocks & ETFs, Fixed Deposits, Recurring Deposits, Mutual Fund SIPs, Gold Holdings, Real Estate).
   * **Dual Legend Breakdown**: Displays both the formatted monetary valuation (`formatINR`) and the composition weight percentage (`%`) without signed `+`/`-` prefixes.
   * **Privacy / Stealth Mode Integration**: Fully respects `PrivacyContext` (`isBalancesHidden`), replacing monetary figures in the donut center, hover tooltips, and legend rows with masked bullet strings (`••••••`).
   * **Interactive Donut Hover**: Hovering over any slice shifts the arc outward (`scale(1.04)`) and updates the center label to display the slice name, weight percentage, and formatted monetary value.
4. **Performance Bar Chart** (`BarChart.tsx`):
   * Bar visualization comparing invested value vs current market value per asset class.

### Portfolio Insights & Data Health Panel

* Component: `InsightsPanel.tsx`
* Metrics Evaluated:
  * **Portfolio Health Score Audit**: Weighted 0-100 score evaluating diversification, emergency liquidity, document completeness, and stale price records. Includes quick trigger to open `DataQualityHealthModal`.
  * **Top 5 Today's Movers**: Displays top 5 daily stock/ETF movers ranked by absolute percentage movement with compact spacing (`space-y-2`) and scaled badge icons.
  * **Allocation Drift Alerts**: Highlights asset classes exceeding target allocation thresholds.
  * **Upcoming Deposit Maturities (30 Days)** & **Insurance Renewals (60 Days)**: Urgency notification cards with direct action buttons.

---

## 4. 📱 Layout Architecture: Mobile View

The mobile view adapts to viewports under `768px`, substituting sidebars with bottom tab bars, touch swipe navigation, collapsible cards, pull-to-refresh gates, and bottom sheet action menus.

```
+-------------------------------------------------------------+
| MOBILE TOP HEADER                                           |
| [Logo] Family Wealth   (Search) (Eye) (Sync) (Bell) (Theme) |
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
| [ 🏠 Home ] [ 📈 Stocks ] [ 💰 SIP & MF ] [ 🏦 Deposits ] [ ☰ More ] |
+-------------------------------------------------------------+
```

### Passcode Lock Screen (iOS 17/18 Style)

* Component: `PinLockScreen.tsx`
* Visual Design:
  * Background: Aurora purple-to-blue gradient overlay with radial soft lights.
  * Clock & Header: Live iOS-style bold time & date display.
  * Animated Padlock Icon: Smoothly toggles between locked and unlocked keyhole states.
  * Keypad: 3x4 grid of circular frosted glass buttons (`backdrop-filter: blur(16px)`), featuring large numeric digits (1-9, 0) and telephone letter sub-labels (ABC, DEF, GHI...).
  * PIN Dots: 4 circular dots that glow soft blue when filled and execute a horizontal shake animation on incorrect passcode input.

### Mobile Top Bar & Family Pill Selector

* Compact Header: Reduced height (`h-12`), showing logo, current portfolio context, search icon trigger, privacy eye toggle, refresh icon, alert bell badge, and dark mode toggle.
* Family Selector: Touch-scrollable horizontal row of pill buttons featuring edge gradient masks (`mask-image: linear-gradient(...)`) indicating off-screen content.

### Mobile Home Wealth Summary View

* Component: `MobileHomeSummary.tsx`
* Optimizations:
  * Defensive text truncation (`truncate`) preventing number wrapping on narrow screens (320px–375px).
  * Collapsible quick category cards displaying total balance, asset count, and daily change per category.
  * Single-pass `useMemo` computation loop ensuring smooth 60FPS scrolling.

### Mobile Bottom Navigation Bar

* Component: `MobileBottomNav.tsx`
* Fixed Position: `fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)]/95 backdrop-blur-xl border-t border-[var(--border-subtle)] shadow-[0_-4px_24px_rgba(0,0,0,0.18)]`.
* Safe Area: Utilizes `.pb-safe` (`padding-bottom: env(safe-area-inset-bottom, 0px)`) to accommodate iOS home indicator bars.
* Nav Items:
  1. **Home**: Directs to overall mobile summary view with unread alert badge counter.
  2. **Stocks**: Directly switches to Stocks & ETF holdings.
  3. **SIP & MF**: Directly switches to Mutual Fund SIP accounts.
  4. **Deposits**: Directly switches to Fixed Deposits registry.
  5. **More (Drawer)**: Opens slide-up bottom sheet with **100% solid opaque background** (`bg-[var(--surface-solid)]`, `#ffffff` light / `#0f172a` dark), `z-[70]` tier, backdrop blur (`z-[60] bg-black/60 backdrop-blur-sm`), and automatic body scroll locking (`document.body.style.overflow = 'hidden'`) to access Recurring Deposits, Gold Holdings, Real Estate, Insurance Policies, Document Vault, and Tax Harvesting without background text bleed-through.

### Mobile Floating Add Menu (FAB & Action Sheet)

* Component: `FloatingAddMenu.tsx`
* Layout: Triggered via the mobile FAB button (`z-50`). Pops up a glassmorphic action sheet presenting all asset entry types (Stock, Fixed Deposit, RD, Mutual Fund SIP, Gold, Real Estate, Insurance Policy, Document).
* Position Customization: Features customizable button positioning (`'right'` | `'center'` | `'left'`) with persistent `localStorage` storage (`finance_fab_position`). Defaulted to **Right side** (`right-2 items-end`) to prevent blocking center card titles and values. Includes an interactive position switcher pill (`[ Left ↙ | Center ⬇ | Right ↘ ]`) inside the menu header bar for instant toggling.
* State Visibility: Automatically hidden when any modal or the More drawer is open (`isHidden={isAnyModalOpen || isMoreDrawerOpen}`).

### Holding Detail Drawer & Responsive Bottom Sheet

* Component: `HoldingDetailDrawer.tsx` & `Drawer.tsx`
* Responsive Adaptation:
  * **Mobile (< 768px)**: Rendered as an Apple-style slide-up **bottom sheet** (`items-end`, `rounded-t-2xl`, touch drag indicator bar, safe-area bottom padding).
  * **Desktop (≥ 768px)**: Rendered as a sleek slide-over **side drawer** (`justify-end`, `max-w-md`, full-height).
* Provides deep dive analysis when tapping any stock or asset:
  * Real-time holding valuation, CMP, quantity, and average purchase price.
  * Unrealized P&L breakdown and today's day-change performance.
  * Target allocation vs actual allocation share.
  * Direct action buttons to edit holding (`EditStockModal`), upload document attachment, or remove holding.

### Mobile Alerts Drawer & Page

* Component: `MobileAlertsView.tsx`
* Features: Touch-optimized list of active system alerts with one-tap dismissals and categorized color badges (Blue for 52-week highs, Amber for lows, Indigo for FD maturity, Rose for Insurance renewal).

### Touch Gestures, PWA Banner & Mobile Performance

* **Touch Swipe Navigation (`useSwipeNavigation.ts`)**: Allows horizontal finger swiping across the main screen to transition between consecutive asset tabs (*Stocks → FDs → RDs → SIPs → Gold*).
* **Pull-to-Refresh (`usePullToRefresh.ts`)**: Dragging down from the top of the mobile home summary triggers an active price sync indicator and re-validates SWR market caches.
* **PWA Install Banner (`PWAInstallBanner.tsx`)**: Unobtrusive bottom prompt alerting mobile web users to add the application to their home screen for standalone offline experience.
* **Render Containment**: Mobile asset cards apply `content-visibility: auto; contain-intrinsic-size: 0 160px;` to maintain 60FPS fluid scrolling.

---

## 5. 🧩 Asset Class Registry Views & Component Specs

### Standardized Asset Registry Shell & Unified Single-Banner Architecture

All 7 non-stock asset classes (`Gold`, `Fixed Deposits`, `Recurring Deposits`, `Mutual Funds & SIPs`, `Real Estate`, `Insurance`, and `Document Vault`) strictly follow the **Unified Single-Banner Architecture**. Rather than repeating banners per member or looping entire views, each asset class renders exactly ONE top banner aggregating all family holdings, followed by the holdings list grouped cleanly by family member (`Rammohan`, `Padmavathi`, and `Sai Laxmi`).

```
+-----------------------------------------------------------------------------------------------+
| UNIFIED FAMILY ASSET BANNER (.apple-card p-2.5 sm:p-3.5)                                      |
|                                                                                               |
| ROW 1: [Icon] Total Family [Asset] [Combined Pill]                [Badge 1]    [Badge 2]     |
|        Aggregated description across family portfolios            (Principal)  (Maturity)     |
|                                                                                               |
| ROW 2: SUMMARY METRICS RIBBON (grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2)             |
|        [ Metric 1 ]        [ Metric 2 ]        [ Metric 3 ]        [ Metric 4 ] (or 5)        |
|                                                                                               |
| ROW 3: FAMILY MEMBERS BREAKDOWN (grid grid-cols-3 gap-1 sm:gap-1.5)                           |
|        [ Rammohan Card ]         [ Padmavathi Card ]        [ Sai Laxmi Card ]                |
|        Avatar + Value            Avatar + Value             Avatar + Value                    |
+-----------------------------------------------------------------------------------------------+
| HOLDINGS REGISTRY (Grouped by Member with sticky section headers)                             |
|  ▼ 👤 Rammohan Holdings (Count & Total Value)                                                 |
|     [ Holding Card 1 ]  [ Holding Card 2 ] ...                                                |
|  ▼ 👤 Padmavathi Holdings (Count & Total Value)                                               |
|     [ Holding Card 1 ]  [ Holding Card 2 ] ...                                                |
|  ▼ 👤 Sai Laxmi Holdings (Count & Total Value)                                                |
|     [ Holding Card 1 ]  [ Holding Card 2 ] ...                                                |
+-----------------------------------------------------------------------------------------------+
```

#### Mobile Compactness & Clean UI Standards
1. **Row 1 Badges**: On mobile (`< 768px`), top metric badges use `flex-1 sm:flex-initial` to share screen width equally (50/50) in a clean compact row with `px-2 py-0.5`, preventing awkward wrapping or text clipping.
2. **Row 2 Metric Ribbon**: Mobile padding is tightly tuned to `p-1.5 sm:p-2` with `gap-1.5 sm:gap-2`. Labels use `text-[9px] uppercase tracking-wider truncate` and values use `text-xs sm:text-sm font-bold tnum truncate`.
3. **Row 3 Member Breakdown (3-Col Grid)**: Uses `grid-cols-3 gap-1 sm:gap-1.5` instead of vertical stacking. On mobile, cards render in a clean vertical flex stack (`flex-col items-start min-w-0 p-1.5`) featuring a 16px avatar, bold name, and truncated value/weight, expanding smoothly to `sm:flex-row sm:items-center sm:justify-between p-2` on desktop. Saves **~65% vertical viewport space** on mobile devices.
4. **1-Click Interactive Filtering**: Clicking any family member's card in Row 3 isolates their holdings below with an active highlight ring (`ring-1 ring-[color]/30`) and reveals an instant *"View All"* button.

---

### Stock & ETF Holdings Table

* **Desktop Component**: `PortfolioTable.tsx`
* **Single-Pass Architecture**: Utilizes `useIsMobile()` to condition table rendering, cutting mounted DOM node count by 50%.
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
  11. **Management Actions**: Dedicated action column pencil button opening `EditStockModal` and delete button triggering `ConfirmModal`.
* **Quick Filter Pills**:
  * **All**: Displays complete stock & ETF portfolio with total asset count badge.
  * **Gainers**: Filters holdings with positive total P&L (`unrealizedPnL > 0`).
  * **Losers**: Filters holdings with negative total P&L (`unrealizedPnL < 0`).
  * **ETFs**: Filters Exchange Traded Funds based on security type tag or name match.
* **Preset Sorting Controls**:
  * Quick sort presets (*Current Value*, *P&L Amount*, *P&L %*, *Today %*, *Allocation %*) with toggleable ascending/descending direction indicators (`▲` / `▼`).

### Fixed Deposits (FD) View & Details Cards

* Component: `FixedDepositView.tsx` & `DepositDetailsCard.tsx`
* **Unified Banner Structure**:
  * **Row 1**: Landmark icon, title, `Combined` badge, Total Principal & Total Maturity badges.
  * **Row 2 (4 Metrics)**: Principal Invested, Current/Maturity Value, Accrued Interest, Active Deposits count.
  * **Row 3 (Member Breakdown)**: 3-column grid (`grid-cols-3`) with Rammohan, Padmavathi, and Sai Laxmi principal and maturity totals.
* **Card Specs**:
  * Bank Name & Logo Badge (e.g., HDFC, ICICI, SBI).
  * Principal Amount vs Projected Maturity Amount split.
  * Interest Rate Pill (`% p.a.`) and strictly Half-Yearly compounding ($n=2$).
  * Progress Bar: Visual bar showing elapsed tenure percentage toward maturity.
  * Document Attachment Badge: Displays linked FD advice certificate with one-click view trigger.
  * Maturity Alert: Highlights in amber when within 30 days of maturity.
  * Share Action: Copies summary snippet to clipboard triggering `useToast` notification.

### Recurring Deposits (RD) View & Installments

* Component: `RDView.tsx`, `RDAccountCard.tsx`, & `RDInstallmentSchedule.tsx`
* **Unified Banner Structure**:
  * **Row 1**: Clock icon, title, `Combined` badge, Total Monthly SIP & Current Value badges.
  * **Row 2 (4 Metrics)**: Total Invested, Current Valuation, Accrued Interest, Monthly Deposit.
  * **Row 3 (Member Breakdown)**: 3-column grid (`grid-cols-3`) showing monthly SIP and current balance per member.
* **Visual Specs**:
  * Monthly Commitment Indicator: Shows monthly deposit requirement and execution date.
  * Accumulated Balance Tracker.
  * Installment Schedule Matrix: Interactive calendar list checking off paid monthly installments vs pending future deposits.
  * Document Attachment Badge: Displays linked RD agreement or receipt.

### Mutual Fund SIP View & Live NAV Tracker

* Component: `SIPView.tsx`, `SIPAccountCard.tsx`, `SIPFormModal.tsx`, `SIPFormFields.tsx`
* **Unified Banner Structure**:
  * **Row 1**: TrendingUp icon, title, `Combined` badge, Monthly Inflow & Current Valuation badges.
  * **Row 2 (4 Metrics)**: Total Invested, Current Valuation, Monthly SIP, Overall Return (P&L and %).
  * **Row 3 (Member Breakdown)**: 3-column grid (`grid-cols-3`) showing monthly SIP and current valuation per member.
* **Features**:
  * Direct integration with AMFI Live Mutual Fund NAV schemes.
  * Displays Scheme Category (Equity, Debt, Hybrid, Index), Monthly SIP Date, and Total Amount Invested.
  * Active / Paused status pill toggle.
  * Document Attachment Badge: Links fund statement or CAS summary.

### Physical & Digital Gold View

* Component: `GoldHoldingView.tsx`, `GoldHoldingCard.tsx`, `GoldFormModal.tsx`
* **Unified Banner Structure**:
  * **Row 1**: Bullion icon, title, `Combined` badge, Live 24K & 22K spot rates with inline calibration trigger (✎), Sync trigger, Total Weight (g), and Total Valuation.
  * **Row 2 (5 Summary Metrics Ribbon)**:
    1. `Family Invested`
    2. `Current Value`
    3. `Family Weight (g)`
    4. `Weight in Tola` (Canonical conversion: $1\text{ tola} = 11.6638\text{ g}$)
    5. `Overall Return` (Monetary gain + percentage return)
  * **Row 3 (Member Breakdown)**: 3-column grid (`grid-cols-3`) showing weight in grams, weight in tola, and valuation per member.
* **Holding Card Specifications**:
  * Supports 3 Sub-types: Sovereign Gold Bonds (SGB), Digital Gold, and Physical Bullion/Jewelry.
  * Tracks Weight in Grams, Weight in Tola, Purchase Rate per Gram, and Live Benchmark Rate (24K Gold per Gram).
  * SGB Interest Earnings Tracker (2.5% p.a. semi-annual payout indicator).
  * Hallmark Certification Badge: One-click preview of hallmark certificate.

### Real Estate Asset Cards

* Component: `RealEstateView.tsx`, `RealEstateCard.tsx`, `RealEstateFormModal.tsx`
* **Unified Banner Structure**:
  * **Row 1**: Building2 icon, title, `Combined` badge, Total Invested & Current Valuation badges.
  * **Row 2 (4 Metrics)**: Total Investment, Current Valuation, Total Properties count, Overall Appreciation.
  * **Row 3 (Member Breakdown)**: 3-column grid (`grid-cols-3`) showing property valuation and invested cost per member.
* **Visual Attributes**:
  * Property Type Tags: Residential, Commercial, Land / Plot.
  * Purchase Value vs Current Estimated Market Valuation.
  * Rental Income Yield: Monthly rental collection metric and annualized yield %.
  * Title Deed Badge: Linked property registration document.

### Insurance Policies View & Renewal Urgency

* Component: `InsuranceView.tsx`, `InsurancePolicyCard.tsx`, `InsuranceFormModal.tsx`
* **Unified Banner Structure**:
  * **Row 1**: Shield icon, title, `Combined` badge, Total Sum Assured & Annual Premium badges.
  * **Row 2 (4 Metrics)**: Total Sum Assured, Annual Premium Outflow, Active Policies count, Renewals Alert (Due Soon warning).
  * **Row 3 (Member Breakdown)**: 3-column grid (`grid-cols-3`) showing sum assured and annual premium per member.
* **Features**:
  * Policy Types: Term Life, Health Insurance, Vehicle Insurance, ULIP / Investment.
  * Sum Assured Coverage Amount vs Annual Premium Cost.
  * Expiry / Premium Due Date: Features urgency badges (Rose tag when due within 60 days).
  * Policy Bond Badge: Linked original policy schedule document.

### Document Vault View & Taxonomy Attachment

* Component: `DocumentVaultView.tsx` & `DocumentAttachmentField.tsx`
* **Unified Banner Structure**:
  * **Row 1**: FileText icon, title, `Combined` badge, Total Files & Categories count badges.
  * **Row 2 (4 Metrics)**: Total Documents, Attached to Assets, General Records, Expiring/Due Soon.
  * **Row 3 (Member Breakdown)**: 3-column grid (`grid-cols-3`) showing document counts per member.
* **Structure**:
  * Taxonomy Categories: `fd_advice`, `policy_schedule`, `title_deed`, `tax_receipt`, `invoice`, `gold_hallmark`, `account_statement`, `general`.
  * Expiration Warning Pills: Highlights identity documents or policies nearing expiration.
  * Secure Download / View action triggers with thumbnail previews.

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
  * Memoized Item Rendering (`ChatMessageItem`): Stops typing from re-rendering the full chat transcript.
  * Markdown Support: Formatted bullet points, bold key figures, and tabular financial summaries.
  * Dynamic Prompt Suggestion Pills: One-tap prompt pills ("Analyze my asset allocation", "Show top risk factors", "Calculate my tax exposure").
  * Inline Icons: Integrated `Bot` and `User` SVG icons from `AppIcons.tsx`.

---

## 6. 🪟 Modal System & Overlay Architecture

All modal dialogs across the application share a single, unified draggable modal frame (`Modal.tsx`) managed through `useModalState.ts`.

```
+-----------------------------------------------------------------------+
| MODAL BACKDROP (Fixed Fullscreen, Backdrop Blur 8px, Z-Index 400)     |
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

### Standard Form Modals Matrix

* **`AddHoldingModal.tsx`**: Add/Edit Stock & ETF holdings (Ticker lookup, quantity, buy price, date, portfolio context).
* **`EditStockModal.tsx`**: Quick quantity and buy price editor.
* **`FDFormModal.tsx`**: Fixed Deposit inputs (Major Indian bank presets datalist, principal, rate %, start date, maturity date, real-time auto-compounding computation).
* **`RDFormModal.tsx`**: Recurring Deposit inputs (Bank datalist, monthly installment, interest rate %, tenure months, quarterly compound solver).
* **`SIPFormModal.tsx`**: Mutual Fund SIP inputs (Top Indian mutual fund scheme datalist with AMFI code & CAGR auto-fill, monthly SIP amount, units owned, fallback valuation).
* **`GoldFormModal.tsx`**: Gold holding inputs (Sub-type, grams weight, hallmark purity chips [24K, 22K/916, 18K, 14K], 1-tap spot rate auto-compute valuation, benchmark).
* **`RealEstateFormModal.tsx`**: Property inputs (Type, valuation, purchase cost, monthly rental).
* **`InsuranceFormModal.tsx`**: Policy inputs (Type, sum assured, premium amount, due date).
* **`AddFamilyModal.tsx`**: Add new family member portfolio (Member name, relationship tag).
* **`RenamePortfolioModal.tsx`**: Rename portfolio alias.
* **`ChangePinModal.tsx`**: Update 4-digit security PIN.

### Smart AI Import — Quarantined Review & Verification Modal

* Component: `SmartImportModal.tsx`
* Features:
  * Drag-and-drop parser for PDF statements (NSDL/CDSL CAS, FD certificates, insurance schedules), images, and spreadsheets.
  * Side-by-side Quarantined Review (stacked on mobile): Shows extracted JSON fields alongside the visual document preview before committing to the database.
  * Interactive category switcher and inline field editor covering all 7 asset classes (FD, RD, SIP, Gold, Real Estate, Insurance, Stocks).
  * Target portfolio owner selector with atomic commit and automated document storage rollback if metadata persistence fails.

### Data Quality Health Diagnostic Modal

* Component: `DataQualityHealthModal.tsx`
* Diagnostic Engine: Powered by `src/utils/dataQuality.ts`.
* Features:
  * Comprehensive audit of portfolio completeness (missing maturity dates, zero valuations, missing document attachments, stale prices).
  * Rolling 30-entry historical score progression graph (`localStorage`).
  * Monthly resolved issue counter tracking maintenance improvements over time.

### Confirmation Dialogs & Context Menus

* **`ConfirmModal.tsx`**: Destruction confirmation dialog for asset/portfolio deletion with danger red primary action button.
* **`ContextMenu.tsx`**: Right-click or long-press contextual dropdown menu for quick actions (Edit, Delete, Duplicate).

### Toast Notification Stack

* Component: `Toast.tsx` & `ToastContext.tsx`
* Position: Top-right on desktop (`top-4 right-4`), top-center on mobile (`top-3`).
* Variants & Durations:
  * Success / Info / Warning: `4,000ms` auto-dismiss with progress countdown.
  * Error: `8,000ms` extended duration ensuring ample time to review error trace diagnostics.
* Auto-Dismiss: Slide-out animation. Completely replaces raw browser `alert()` popups across the entire application.

---

## 7. ⌨️ Keyboard Shortcuts & Quick Access Engine

The application integrates desktop keyboard shortcuts (via `useKeyboardShortcuts.ts`) and quick access overlays (`QuickAccessShortcuts.tsx`) to empower power users:

| Shortcut Combination | Action Triggered | Scope |
| :--- | :--- | :--- |
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd> | Open Global Search Palette (`SearchBar.tsx`) | Global |
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + <kbd>N</kbd> | Open Add Holding / Asset Modal (`AddHoldingModal.tsx`) | Global |
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + <kbd>P</kbd> | Toggle Stealth / Privacy Mode (Mask Balances `••••••`) | Global |
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + <kbd>D</kbd> | Toggle Dark / Light Theme Mode | Global |
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + <kbd>L</kbd> | Lock App Session (Return to `PinLockScreen`) | Global |
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + <kbd>E</kbd> | Open Financial Export & Backup Panel (`ExportPanel.tsx`) | Global |
| <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + <kbd>H</kbd> | Open Data Quality Health Diagnostic Modal | Global |
| <kbd>Esc</kbd> | Close active modal, drawer, search palette, or context menu | Overlay |

---

## 8. ⏳ State Representations & Micro-Interactions

### Shimmer Skeleton Loading States

* Components: `AssetCardSkeleton.tsx`, `ChartSkeleton.tsx`, & `DashboardLoading.tsx`
* CSS Utility: `.shimmer-bg` and `.shimmer-bar`
* Animation: Linear gradient highlight moving left-to-right (`@keyframes shimmerAnimation`) matching the precise layout of actual asset cards and summary tiles to prevent cumulative layout shift (CLS).

### Empty State Guidelines

* Component: `EmptyState.tsx`
* Visuals: Contextual icon enclosed in a soft blue circle, clear title (e.g., "No Fixed Deposits Added"), descriptive subtext, and a prominent call-to-action button ("+ Add Your First FD").

### Privacy / Stealth Mode Masking

* Managed via `PrivacyContext.tsx`.
* When activated via the top header eye icon or `Cmd/Ctrl + P`:
  * Replaces all monetary values (Net Worth, Invested, P&L, Asset Values) with blurred or masked bullet strings (`••••••`).
  * Exposes `aria-label="Amount hidden"` on masked bullet elements for screen reader clarity.
  * Preserves percentage badges and asset count numbers so users can review allocation percentages in public settings without revealing net worth figures.

### Error Boundaries & Offline Fallbacks

* **`ErrorBoundary.tsx` / `SectionErrorBoundary.tsx`**: Catches rendering failures cleanly within individual widgets or tabs without crashing the parent application. Displays a friendly fallback container with a "Retry Section" button.
* **Offline Banner**: Sticky subtle bar indicating internet connection loss, gracefully serving cached portfolio data from IndexedDB (`idb-keyval`).

---

## 9. 🖨️ Print & PDF Export UI Styling

The application includes dedicated `@media print` CSS overrides optimized for clean A4 PDF generation via `ExportPanel.tsx`:

```css
@media print {
  /* Hide non-printable UI elements */
  header, nav, footer, button, input, select,
  [data-quick-actions], [data-search-bar], [data-alerts-banner] {
    display: none !important;
  }

  /* Force background colors and remove card shadows */
  body { background: white !important; color: #0f172a !important; /* matches --text-primary */ }
  .apple-card, .glass-panel { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }

  /* Page break optimization */
  .rounded-2xl, [role="region"], [role="tabpanel"] {
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

## 10. 📐 Responsive Breakpoint Matrix & Summary

> **Breakpoint Architecture Note**: Breakpoint prefixes strictly correspond to Tailwind CSS default theme boundaries (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`). In JavaScript, `useIsMobile()` gates mobile layout branches below `768px` (`max-width: 767px`), seamlessly matching the `md:` breakpoint threshold where the pinned desktop sidebar and multi-column views take effect.

| Breakpoint Target | Width Boundary | Applied Adaptations & Layout Behavior |
| :--- | :--- | :--- |
| **Mobile Compact (`< sm`)** | `< 640px` (with `< 375px` xs sub-tier) | Mobile Home Summary view, horizontal family pill selector, 2-column asset grid, fixed bottom nav bar, swipe gestures active. Compact financial numbers (`text-[20px]`) on `< 375px`. |
| **Mobile Standard / Phablet (`sm`)** | `640px – 767px` | 2-column summary cards, visible header net worth indicator, enlarged chart containers, slide-over modals (within mobile bottom-nav shell). |
| **Tablet / Desktop Small (`md`)** | `768px – 1023px` | Pinned desktop sidebar appears (`w-64`), bottom nav hidden (`useIsMobile` returns false), desktop header active, fluid content area. |
| **Desktop Standard (`lg`)** | `1024px – 1279px` | 2x2 equalized widget grid (370px height), 3-column / 4-column summary metric cards, expanded stock holdings table (11 columns visible without horizontal scrollbar). |
| **Desktop Large (`xl`)** | `1280px – 1535px` | 4-column summary cards (`xl:grid-cols-4`), high-density metrics ribbons, live price badges, chart crosshairs. |
| **Widescreen Desktop (`2xl`)** | `≥ 1536px` | Maximum container width capped at `1720px` (`max-w-[1720px] mx-auto`), centered with full-density metrics panels and insights breakdown. |

---

## 11. ♿ Accessibility & Motion Preferences

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

### 5. WCAG 2.1 Contrast Ratio Requirements (AA / AAA Standards)
Unlike code patterns, contrast compliance requires concrete mathematical measurement:
* **Normal Body & Tabular Text** (< 18pt / 24px regular, < 14pt / 18.66px bold): Must achieve a minimum contrast ratio of **4.5:1** against underlying surfaces (WCAG AA).
* **Large Text & Headings** (≥ 18pt / 24px regular, ≥ 14pt / 18.66px bold): Must achieve a minimum contrast ratio of **3.0:1** against underlying surfaces (WCAG AA).
* **Graphical Objects & Interactive UI Components**: Active tab indicators, slider thumbs, search inputs, and focus outline boundaries must achieve a minimum contrast ratio of **3.0:1** against adjacent background colors.
* **Enhanced AAA Standard**: Primary financial valuation figures (`.text-financial`) and primary titles targeting high visibility aim for a **7.0:1** contrast ratio.

### 6. Enforced Measurement Audit Flags
The following two specific UI scenarios require explicit contrast measurement to prevent silent legibility regressions:
1. **Audit Flag 1 — `--text-tertiary` Contrast (Light & Dark Mode)**:
   * Light mode: `--text-tertiary` (`#64748b`) rendered over `--surface-secondary` (`#f1f5f9`) container surfaces maintains a **4.6:1** contrast ratio (WCAG AA).
   * Dark mode: Elevated to `#8899aa` (over `--surface` `#111827` = **4.8:1** contrast ratio) to resolve sub-4.5:1 contrast failures on timestamps, muted metadata, and table headers.
2. **Audit Flag 2 — Dark Mode `--positive` & `--negative` over `-soft` Backgrounds**:
   * Foreground text and pill badges using `--positive` (`#00b074`) over `--positive-soft` (`rgba(0, 176, 116, 0.15)`) on dark canvas (`#080c14` / `#111827`), and `--negative` (`#df514c`) over `--negative-soft` (`rgba(223, 81, 76, 0.15)`) on dark canvas (`#080c14` / `#111827`), must be measured against the alpha-blended composite surface to ensure a minimum **4.5:1** contrast ratio.
   * Background tint opacity must never dilute or wash out the foreground text luminance in dark mode.

---

> **Note**: This document serves as the authoritative UI/UX design reference for developers, designers, and AI agents modifying or extending the Family Portfolio Tracker user interface.

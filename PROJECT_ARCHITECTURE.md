# 💼 Family Portfolio Tracker — Project Architecture

This document provides a high-level overview of the folder structure, data flow, state management, and database mappings of the Family Portfolio Tracker application. It is designed to help developers and AI agents navigate the codebase efficiently.

---

## 📁 Key File Structures & Domains

### 1. State Management & API Hook
* **[usePortfolioData.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/usePortfolioData.ts)**
  * Source of truth for portfolio assets, net worth snapshots, and CRUD operations.
  * Connects to Supabase Edge Functions via [apiClient.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/apiClient.ts).
  * Manages stock price polling (Yahoo Finance cache proxy) and SIP live NAV pricing (`https://api.mfapi.in/mf/` with 4-hour `sessionStorage` caching).
  * Automatically coordinates state updates and notifications across the application.

### 2. App Shell & Navigation Router
* **[App.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/App.tsx)**
  * Roots the layout, global Dark/Light mode theme state, keyboard shortcuts, swipe tab routing, and responsive layouts.
  * Coordinates layout differences: renders [MobileHomeSummary.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/MobileHomeSummary.tsx) on narrow views, and a multi-panel grid dashboard on desktops.
* **[useSwipeNavigation.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useSwipeNavigation.ts)**
  * Custom hook that encapsulates touch swipe gesture listeners and navigation orders between active asset tabs.
* **[useKeyboardShortcuts.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useKeyboardShortcuts.ts)**
  * Custom hook that isolates window keyboard keydown event listeners (e.g. `Ctrl+Shift+R` to sync stock prices).
* **[useAlerts.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useAlerts.ts)**
  * Contains the core `useAlerts` warning rules, and exports `useDismissibleAlerts` to handle local state alerts dismissals and sessionStorage synchronizations.

### 3. Registry Component Routing
* **[AssetTabContent.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/AssetTabContent.tsx)**
  * Acts as the router that maps the current asset class tab to its corresponding view registry (e.g. FDs/RDs/SIPs map to `FixedDepositView`, properties map to `RealEstateView`).

### 4. Modular Sub-components for FDs/RDs/SSY/SIPs
All timelines, grids, and form inputs for deposits are separated into a dedicated directory:
* **[src/components/fd/](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/fd/)**
  * `DepositDetailsCard.tsx`: Timeline progress bar, actions (Edit/Delete), document badges, and notes.
  * `RDInstallmentSchedule.tsx`: Month-by-month grid list of installments, Paid/Unpaid checkboxes, and monthly contributions updater.
  * `SIPFormFields.tsx`: Inputs for scheme code, units owned, CAGR, expected valuation, and NAV validation triggers.
  * `StandardFormFields.tsx`: Standard input fields and calculations for regular FDs, RDs, and SSY portfolios.

---

## 💾 Database Schema & Custom Types mapping
All items in the FDs, RDs, SSY, and SIPs registries map backend-side to a single table: `fixed_deposits`. They are distinguished in-memory and in queries by the `fd_type` column as follows:

| Asset Tab / UI Mode | `fd_type` Database Value | Interest Compounding Rule |
| :--- | :--- | :--- |
| **Fixed Deposit (FD)** | `'regular'` | Quarterly compounding |
| **Recurring Deposit (RD)** | `'recurring'` or `'rd'` | Quarterly compounding + Monthly installments array |
| **Sukanya Samriddhi (SSY)** | `'ssy'` | Annual compounding on April 1st (Indian financial boundary) |
| **SIP Mutual Fund (SIP)** | `'sip'` | Live valuation NAV lookup, no compounding |

---

## 🧮 Calculations & Formatters
* **[portfolioCalcs.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/portfolioCalcs.ts)**: Handles overall aggregations, drift target offsets, and performer gainers/losers.
* **[formatters.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/formatters.ts)**: Handles Indian currency formatting (INR `₹`), date boundary determinations, and compounded interest calculations (`getFDEffectiveValue`).
* **[chartHelpers.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/chartHelpers.ts)**: Groups the color-coding hex arrays and transforms raw values to donut chart slices.

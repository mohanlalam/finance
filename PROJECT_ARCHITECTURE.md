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

### 3. Registry Component Routing
* **[AssetTabContent.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/AssetTabContent.tsx)**
  * Acts as the router that maps the current asset class tab to its corresponding view registry (e.g. FDs/RDs/SIPs map to `FixedDepositView`, properties map to `RealEstateView`).

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
* **[portfolioCalcs.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/portfolioCalcs.ts)**: Handles overall aggregations, drift target offsets, net worth totals, and performer gainers/losers.
* **[formatters.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/formatters.ts)**: Handles Indian currency formatting (INR `₹`), date boundary determinations, and compounded interest calculations (`getFDEffectiveValue`).

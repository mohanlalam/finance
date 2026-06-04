# 💼 Family Portfolio Tracker — Project Architecture

This document provides a high-level overview of the folder structure, data flow, state management, and database mappings of the Family Portfolio Tracker application. It is designed to help developers and AI agents navigate the codebase efficiently.

---

## 📁 Key File Structures & Domains

### 1. State Management & API Hooks
* **[usePortfolioData.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/usePortfolioData.ts)**
  * Source of truth for portfolio assets, net worth snapshots, and CRUD operations.
  * Connects to Supabase Edge Functions via [apiClient.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/apiClient.ts).
  * Manages stock price polling (Yahoo Finance cache proxy) and coordinates overall state updates across the application.
* **[useRDData.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useRDData.ts)**
  * Dedicated hook wrapping CRUD actions for Recurring Deposits (`rd_account` asset type).
* **[useSIPData.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useSIPData.ts)**
  * Dedicated hook wrapping CRUD actions for Mutual Fund SIPs (`sip_account` asset type), fetching live NAV values from AMFI schemes.
* **[useSSYData.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useSSYData.ts)**
  * Dedicated hook wrapping CRUD actions for Sukanya Samriddhi Yojana accounts (`ssy_account` asset type).

### 2. App Shell & Navigation Router
* **[App.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/App.tsx)**
  * Roots the layout, global Dark/Light mode theme state, keyboard shortcuts, swipe tab routing, and responsive layouts.
  * Coordinates layout differences: renders [MobileHomeSummary.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/MobileHomeSummary.tsx) on narrow views, and a multi-panel grid dashboard on desktops.
* **[useSwipeNavigation.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useSwipeNavigation.ts)**
  * Touch swipe gesture listeners and navigation routing between active asset tabs.
* **[useKeyboardShortcuts.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useKeyboardShortcuts.ts)**
  * Custom hook that isolates window keyboard keydown event listeners (e.g. `Ctrl+Shift+R` to sync stock prices).
* **[useAlerts.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/hooks/useAlerts.ts)**
  * Evaluates warnings (expiring documents, upcoming due dates, portfolio concentration limits) and handles dismissals.

### 3. Registry Component Routing
* **[AssetTabContent.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/AssetTabContent.tsx)**
  * Acts as the main router mapping the active asset class tab to its corresponding view registry (e.g., standard FDs to `FixedDepositView`, RDs to `RDView`, SIPs to `SIPView`, and SSY to `SSYView`).

### 4. Modular UI Components
Component folders are isolated by asset domain to ensure clean separation of concerns:
* **[src/components/fd/](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/fd/)**: Standard Fixed Deposit cards (`DepositDetailsCard.tsx`) and form controls (`StandardFormFields.tsx`).
* **[src/components/rd/](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/rd/)**: Recurring Deposit lists (`RDView.tsx`, `RDAccountCard.tsx`), modals (`RDFormModal.tsx`), and monthly contributions trackers (`RDInstallmentSchedule.tsx`).
* **[src/components/sip/](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/sip/)**: Mutual Fund SIP views (`SIPView.tsx`, `SIPAccountCard.tsx`), modals (`SIPFormModal.tsx`), and live schema lookup fields (`SIPFormFields.tsx`).
* **[src/components/ssy/](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/ssy/)**: SSY girls' ledger views (`SSYView.tsx`, `SSYAccountCard.tsx`), form modals (`SSYFormModal.tsx`), and custom compounding ledger schedules (`SSYSchedule.tsx`).

---

## 💾 Database Schema & Table Mappings

Every deposit registry maps to its own separate database table. This guarantees clean migrations and isolation of relational data:

| Asset Tab / UI Mode | Supabase PostgreSQL Table | Core Compounding / Valuation Rule |
| :--- | :--- | :--- |
| **Fixed Deposit (FD)** | `fixed_deposits` | Quarterly compounding (FD interest rates) |
| **Recurring Deposit (RD)** | `rd_accounts` | Quarterly compounding + Contribution dates array |
| **Sukanya Samriddhi (SSY)** | `ssy_accounts` | Annual compounding on April 1st (Indian financial boundary) |
| **SIP Mutual Fund (SIP)** | `sip_accounts` | Live AMFI NAV scheme price multiplication, no compounding |

---

## 🧮 Calculations & Formatters
* **[portfolioCalcs.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/portfolioCalcs.ts)**: Handles asset allocation aggregations, performance monitoring (gainers/losers), and drift offsets.
* **[formatters.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/formatters.ts)**: Implements Indian currency formats (`₹` INR) and standard FD compounding (`getFDEffectiveValue`).
* **[rdUtils.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/rdUtils.ts)**: Computes elapsed month contributions and quarterly compounding per contribution date.
* **[sipUtils.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/sipUtils.ts)**: Calculates monthly contributions elapsed and retrieves live NAV evaluation limits.
* **[ssyUtils.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/ssyUtils.ts)**: Contains Indian Financial Year calculations, annual SSY compounding rates, and legal deposit range validations.

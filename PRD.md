# 📄 Product Requirements Document (PRD) — Family Portfolio Tracker

**Document Version**: 3.0  
**Status**: Approved & In Production  
**Author**: Engineering & Product Architecture  
**Target Platform**: Progressive Web Application (Desktop, Tablet, iOS & Android Mobile)  

---

## 1. Executive Summary & Product Vision

The **Family Portfolio Tracker** is a privacy-first, offline-resilient, consolidated multi-asset wealth management platform engineered specifically for Indian family portfolios. It delivers institutional-grade financial analytics, zero-latency local calculations, and multi-provider market data integration, all wrapped in the **Antigravity Cyber-Zen & Liquid Glass** visual design aesthetic.

### Core Value Proposition
- **Single Pane of Glass for Family Wealth**: Unifies fragmented assets across equities, mutual funds, term deposits, physical gold, real estate, insurance, and critical financial records into a single coherent dashboard.
- **Privacy & Zero-Knowledge Architecture**: Financial figures, passcodes, and uploaded documents are encrypted locally and protected behind hardware-backed biometrics (WebAuthn FaceID/TouchID/Windows Hello) and fail-closed server-side PIN authentication.
- **Sub-Millisecond Financial Math**: Instant local calculations (< 1ms for 1,000+ assets) powered by pure mathematical functions without cloud dependencies or layout thrashing.
- **Automated Indian Market Calibration**: Automatic quote fetching from Yahoo Finance (Equities), AMFI India (Mutual Fund NAVs), and MCX/IBJA (24K Gold Spot Rates).

---

## 2. Target Personas & Family Architecture

The system natively models family wealth across three canonical member registries, supported by a consolidated overview:

| Family Member | Canonical Key | Primary Investment Focus | UI Identity Token |
| :--- | :--- | :--- | :--- |
| **Rammohan** | `Rammohan` / `personal` | High-growth equities, active SIPs, tech stocks, tax-loss harvesting | Blue theme / Primary avatar |
| **Padmavathi** | `Padmavathi` | Physical gold bullion, sovereign gold bonds, conservative cumulative FDs | Amber theme / Gold badge |
| **Sai Laxmi** | `Sai Laxmi` | Education recurring deposits, balanced mutual funds, long-term health cover | Emerald theme / Violet badge |
| **Family Overview** | `all` | Aggregated household net worth, consolidated asset allocation, multi-policy risk cover | Cyan gradient / "Combined" |

---

## 3. Functional Specifications by Asset Registry

### 3.1 Stocks & Exchange Traded Funds (ETFs)
- **Live Valuation**: Automatic price syncing via Yahoo Finance Edge Function with in-memory TTL caching (2 min) and offline database snapshot fallback.
- **Intraday Analytics**: Method-B intraday delta tracking ($(\text{LTP} - \text{Prev Close}) \times \text{Quantity}$) computing exact daily gain/loss in ₹ and %.
- **Performance Metrics**: Real-time allocation percentage, weighted average purchase cost, 52-week low/high visual range indicators, and unrealized total returns.
- **Display Modes**:
  - **Desktop**: Virtualized high-density table (`react-window`) supporting multi-column sorting (PnL, Value, Today %, Ticker) and quick-search filtering.
  - **Mobile**: 56px interactive touch rows with ticker badges, real-time prices, trailing chevrons, and full `HoldingDetailDrawer` progressive disclosure.

### 3.2 Fixed Deposits (FD)
- **Compounding Standard**: Strictly adheres to Indian banking standard half-yearly compounding ($n = 2$, $A = P(1 + r/200)^{2t}$).
- **Bank Presets**: Autocomplete suggestions for all major Indian scheduled commercial banks (SBI, HDFC, ICICI, Axis, PNB, Kotak, Bank of Baroda).
- **Maturity Progress Timeline**: Dynamic progress bar indicating elapsed tenure vs. remaining days until maturity.
- **Urgent Notification Logic**: Deposits maturing within 30 days are automatically badged with an urgency indicator (`AppBadge variant="urgency"`).

### 3.3 Recurring Deposits (RD)
- **Compounding Standard**: Quarterly compounding per Indian banking regulations ($n = 4$).
- **Installment Tracking**: Tracks total monthly commitment, installments deposited to date, and projected maturity value.
- **One-Click Recording**: 1-tap monthly installment logging updating accrued balance and schedule dates.

### 3.4 Mutual Funds & Systematic Investment Plans (SIP)
- **Automated AMFI NAV Sync**: Automatic scheme quote fetching via AMFI India daily NAV registry using 6-digit scheme codes.
- **Scheme Catalog**: Built-in search datalists for popular Indian mutual funds (Parag Parikh Flexi Cap, Quant Active, Mirae Asset Large Cap, HDFC Top 100, etc.).
- **Accrued SIP Valuation**: Multiplies recorded units by latest NAV, computing invested principal, current market value, and annualized absolute return %.

### 3.5 Gold Holdings & Bullion Vault
- **Live MCX Calibration**: Real-time spot price calibration based on MCX 24K gold rates per gram with manual calibration override.
- **Hallmark Purity Multipliers**:
  - `24K` (99.9% pure bullion) $\rightarrow 1.000$
  - `22K` (91.6% Indian standard jewelry hallmark) $\rightarrow 0.916$
  - `18K` (75.0% designer jewelry hallmark) $\rightarrow 0.750$
  - `14K` (58.5% light jewelry hallmark) $\rightarrow 0.585$
- **Two-Way Calculation**: Dual-mode input dynamically computing Total Cost $\leftrightarrow$ Rate per Gram.
- **Indian Metrics**: Automatic conversion to canonical Tola units ($1\text{ tola} = 11.6638\text{ grams}$).

### 3.6 Real Estate
- **Property Portfolio**: Registry covering residential land parcels, commercial plots, and apartments.
- **Valuation Tracking**: Tracks acquisition purchase price vs. current assessed market value as of date.
- **Yield Calculation**: Computes annual rental income yield % against current capital valuation.
- **Standalone Separation**: Keeps illiquid real estate separated from liquid net worth calculations for accurate cash flow analysis.

### 3.7 Insurance Cover
- **Policy Scope**: Life term assurance, comprehensive family health floaters, critical illness cover, and motor policies.
- **Aggregated Protection Metrics**: Total Sum Assured, Annual Premium Commitment, and Active Policy Count.
- **Renewal Urgency Radar**: Highlights policies requiring renewal within 30 days with pulsing urgency badges and overdue indicators.

### 3.8 Document Vault
- **Zero-Knowledge Web Crypto**: Client-side `AES-GCM-256` + `PBKDF2` (100,000 rounds) document encryption prior to storage transmission.
- **Taxonomy Tagging**: Organizes records by category (`fd_advice`, `policy_schedule`, `title_deed`, `tax_receipt`, `invoice`, `gold_hallmark`, `account_statement`, `general`).
- **Secure Inline Preview**: In-browser document viewer for PDF iframe embedding and high-contrast dark image previews with zero temporary file leaks.

### 3.9 Tax Loss Harvesting & Capital Gains
- **Indian Income Tax Rules (FY 24-25 & FY 25-26)**:
  - **Equity STCG**: 20% on holdings held $< 12$ months.
  - **Equity LTCG**: 12.5% on holdings held $\ge 12$ months (with ₹1.25 Lakh annual exemption limit).
  - **Debt & Physical Gold**: Slab rate taxation according to family member tax bracket.
- **Opportunity Identification**: Real-time scan of all holding positions identifying unrealized losses that can offset realized capital gains before March 31st.
- **Wash Sale Protection**: Warns users of Indian Income Tax Section 94(7) dividend/loss stripping rules.

---

## 4. AI Assistant & Smart Document Import

### 4.1 Smart AI Import (Quarantined Verification Workflow)
- **Zero Silent Database Writes**: Scanned broker statements, bank certificates, and receipts are staged into a quarantine sandbox modal before committing.
- **Visual Evidence Heatmap**: Computes confidence ratings, extracted source snippets, and coordinates for every parsed financial figure.
- **Entity Disambiguation Service**: Pre-assigns extracted documents to `Rammohan`, `Padmavathi`, or `Sai Laxmi` using PAN patterns, folio numbers, and name heuristics.
- **Duplicate Detection**: Identifies potential duplicate certificates or stock transactions before database insertion.

### 4.2 Deterministic NLP Assistant Engine
- **Client-Side Intent Classification**: Evaluates 17 financial intents (`NET_WORTH`, `PERFORMERS`, `MATURITY_TIMELINE`, `ALLOCATION_SPLIT`, `SPECIFIC_GOLD`, `SPECIFIC_FDS`, `INSURANCE_REMINDERS`, `FAMILY_BREAKDOWN`, etc.).
- **Zero Hallucinated Numbers**: Intent handlers strictly extract numbers from live domain state calculations; no LLM generative math is ever trusted for balances.

### 4.3 Conversational Wealth Strategist
- Decomposes multi-clause financial reasoning queries into deterministic pure math domain tool calls (`findTaxHarvestingOpportunities`, `checkInsuranceCommitments`, `auditFixedDepositLock`, `cashFlowDeltaSolver`).
- Outputs structured executive advisory reports with interactive simulation action chips.

---

## 5. Non-Functional Requirements (NFR)

### 5.1 Performance & Frame Budget
- **Sub-Millisecond Calculations**: Portfolio aggregation benchmarks must complete in $< 1\text{ms}$ for 1,000 assets and $< 5\text{ms}$ for 10,000 assets.
- **60 FPS Mobile Interactions**: Touch reactions (`ios-press`, drawer openings, sheet swipes) must execute within 16.6ms frame budgets.
- **Zero-Skeleton Hydration**: App re-open hydrates synchronously from IndexedDB offline cache before initiating network fetches.

### 5.2 Security & Threat Model
- **Fail-Closed Security Gate**: Supabase Edge Functions reject requests (HTTP 503/401) if authentication secrets are missing or unvalidated.
- **Anti-Brute Force Protection**: IP + Device Identifier sliding window limiter (max 5 failed attempts per 5-minute window).
- **Private Storage**: Storage buckets drop all public read/write access; files require signed HMAC URLs (minimum 60s TTL, default 300s).

### 5.3 Offline Resilience
- Full Progressive Web App (PWA) manifest with service worker caching.
- Offline CRUD mutations queued in an offline outbox and synced atomically upon network restoration.

---

## 6. Release Criteria & Milestones

- **Code Quality**: Strict TypeScript compilation (`tsc --noEmit`), zero ESLint errors or warnings.
- **Automated Testing**: 100% pass rate across all 55 test suites (309+ unit & integration tests).
- **Visual Verification**: All 36 desktop and mobile layouts visually verified on real Chrome DevTools viewports (Desktop 1440×900, iPhone 14 Pro 390×844, iPhone SE 375×667).

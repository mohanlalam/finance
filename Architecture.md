# 🏛️ System Architecture — Family Portfolio Tracker

**Document Version**: 3.0  
**Architecture Pattern**: Clean Architecture & Domain-Driven Design (DDD) with Strict Dependency Inversion  
**Runtime Environment**: Progressive Web App (Vite, React 19, TypeScript 5.8, Tailwind CSS, Supabase PostgreSQL & Edge Functions)  

---

## 1. Clean Architecture & Dependency Inversion

The application enforces strict architectural boundaries and unidirectional dependency flow:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        UI Presentation Layer                             │
│     (AppShell, AssetTabContent, Modals, Cards, MobileAssetRegistry)     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ consumes
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Domain Hooks & State Facades                        │
│   (usePortfolioQuery, usePortfolioMutation, usePortfolioRefresh, etc.)   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ invokes
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  Domain Services & Pure Financial Math                  │
│       (portfolioService, portfolioCalculationService, fdCompounding)    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ depends on
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Repository Contracts / Ports                         │
│           (IPortfolioRepository, IDocumentStorageRepository)            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ implemented by
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Infrastructure Implementations                      │
│        (Supabase repositories, SWR, IndexedDB, Web Workers)             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ interacts with
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      External Services & Databases                      │
│     (PostgreSQL, Supabase Edge Functions, Yahoo Finance, AMFI, MCX)     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Strict Layer Boundary Invariants
1. **`src/shared/` & `src/utils/` (Pure Primitives)**: Zero dependencies on React, Supabase, or DOM APIs. Contains date formatting, mathematical helpers, and base error definitions ([`AppError.ts`](src/shared/errors/AppError.ts)).
2. **`src/domains/`**: Encapsulates business logic, domain models, entity interfaces, and pure financial calculations. Domain calculations have **ZERO** imports from React, Supabase, or browser storage APIs.
3. **`src/infrastructure/`**: Adapters and concrete implementations for data storage, cloud persistence, and third-party APIs.
4. **`src/app/` & UI Layer**: Presentation components consuming domain hooks and dispatching actions. UI components never access Supabase SDK or raw storage directly.

---

## 2. State Management & Fine-Grained Context Split

To eliminate cascading re-renders during high-frequency price ticks or background syncs, [`PortfolioContext.tsx`](src/contexts/PortfolioContext.tsx) divides application state into three isolated contexts:

```text
                           ┌───────────────────────────┐
                           │     PortfolioContext      │
                           └─────────────┬─────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ PortfolioEntitiesContext│  │ PortfolioStatusContext  │  │  PortfolioActionContext │
├─────────────────────────┤  ├─────────────────────────┤  ├─────────────────────────┤
│ • portfolios data       │  │ • isLoaded / isLoading  │  │ • addHolding / update   │
│ • activeTab selection   │  │ • isRefreshingPrices    │  │ • addFD / update / del  │
│ • netWorthHistory       │  │ • isMutating lock       │  │ • addSIP / addGold      │
│ • visiblePortfolio      │  │ • stale quote flags     │  │ • addInsurance / addDoc │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

### Context Isolation Rules
- **Write-Only Components** (such as Add/Edit modals) consume `usePortfolioActions()`. They **never** re-render when live market prices update.
- **Read-Only Summaries** consume `usePortfolioEntities()`.
- **Sync Spinners & Liveness Indicators** consume `usePortfolioStatus()`.

---

## 3. Domain Models & Database Schema

The persistent data model is managed via Supabase PostgreSQL, structured to isolate holdings by portfolio while enabling instant cross-family aggregation:

```text
┌─────────────────┐
│   portfolios    │ (id, name, label, owner_name, created_at)
└────────┬────────┘
         │
         ├───< holdings              (id, portfolio_id, ticker, stock_name, qty, avg_price, cached_ltp, cached_today_pct)
         ├───< fixed_deposits        (id, portfolio_id, bank_name, principal_amount, interest_rate, maturity_date, fd_type)
         ├───< rd_accounts           (id, portfolio_id, bank_name, monthly_deposit, interest_rate, start_date, maturity_date)
         ├───< sip_accounts          (id, portfolio_id, fund_name, mf_scheme_code, monthly_sip, units, nav, invested_amount)
         ├───< gold_holdings         (id, portfolio_id, item_name, weight_grams, purity, purchase_price, current_valuation)
         ├───< real_estate           (id, portfolio_id, property_name, property_type, purchase_price, current_valuation, location)
         ├───< insurances            (id, portfolio_id, provider, policy_name, policy_type, sum_assured, premium_amount, renewal_date)
         ├───< documents             (id, portfolio_id, asset_id, name, file_path, file_type, file_size, expiry_date)
         └───< net_worth_history     (id, snapshot_date, total_net_worth, equity_value, fd_value, rd_value, sip_value, gold_value, real_estate_value)
```

---

## 4. Market Data Hub & Multi-Provider Priority Chain

Market quote lookups are coordinated by [`marketDataService.ts`](src/infrastructure/market-data/marketDataService.ts), which manages background polling, request deduplication, in-memory TTL caching, and graceful offline fallback:

```text
                          Incoming Quote Request
                                    │
                                    ▼
                     ┌─────────────────────────────┐
                     │ 1. Active In-Flight Promise │ ──► Return in-flight request
                     └──────────────┬──────────────┘
                                    │ No active request
                                    ▼
                     ┌─────────────────────────────┐
                     │ 2. In-Memory TTL Cache      │ ──► Return cached quote (< 2 min old)
                     └──────────────┬──────────────┘
                                    │ Cache expired / miss
                                    ▼
                     ┌─────────────────────────────┐
                     │ 3. Live External Provider   │
                     │    • Yahoo Finance (Stocks) │
                     │    • AMFI India (Mutual Fds)│
                     │    • MCX / IBJA (Bullion)   │
                     └──────────────┬──────────────┘
                                    │ Network error / Rate limited
                                    ▼
                     ┌─────────────────────────────┐
                     │ 4. Stale Database Snapshot  │ ──► Return last known good price
                     └─────────────────────────────┘
```

---

## 5. Zero-Trust Security & Cryptographic Architecture

### 5.1 Server-Side PIN Authentication (Fail-Closed)
- Client authenticates with a 4-digit PIN hashed via SHA-256 (`crypto.subtle.digest`) transmitted over the `X-App-Pin` header.
- Supabase Edge Functions (`holdings-crud`, `verify-pin`, `snapshot-net-worth`, `gemini-proxy`) validate this hash using constant-time byte comparison (`timingSafeEqual`) against the server environment secret `APP_PIN_HASH`.
- **Fail-Closed Guarantee**: If `APP_PIN_HASH` is unset or unconfigured, the backend returns **HTTP 503 Service Unavailable** immediately.

### 5.2 Anti-Brute Force Rate Limiting
- Composite sliding-window rate limiter keyed on `IP + Client Device Identifier`.
- Allows max 5 failed attempts per 5-minute rolling window before returning **HTTP 429 Too Many Requests**.
- Prevents CGNAT lockout for family members sharing mobile telecom gateways (e.g. Jio/Airtel).

### 5.3 Zero-Trust Client-Side Document Encryption
- Documents uploaded to the Document Vault are encrypted on the user's device prior to network transmission using native Web Crypto (`AES-GCM-256`).
- Keys are derived using `PBKDF2` with 100,000 rounds of SHA-256 based on the master passcode.
- The storage bucket (`investment-documents`) is private (`public = false`) and only accessible via short-lived signed HMAC URLs (minimum 60s TTL, default 300s).

### 5.4 Biometric Hardware Authentication
- WebAuthn integration (`biometrics.ts`) allows 1-second FaceID, TouchID, and Windows Hello platform authentication.
- Cryptographic challenges are stored locally without transmitting biometric credentials across the wire.

---

## 6. Off-Thread Computation & Offline-First Cache

### 6.1 Web Workers (`xirr.worker.ts`)
- Computations requiring heavy numerical solving (such as Newton-Raphson XIRR solvers over thousands of historical cash flows) run inside dedicated Web Workers, ensuring the UI main thread never drops below 60 FPS.

### 6.2 Offline-First PWA Hydration
1. **Boot**: App hydrates immediately and synchronously from IndexedDB (`idb-keyval`) via [`offlineHydration.ts`](src/infrastructure/cache/offlineHydration.ts), displaying full portfolio metrics in $< 50\text{ms}$ with zero skeleton layout shifts.
2. **Network Phase**: SWR issues a background revalidation to Supabase.
3. **Reconciliation**: State updates seamlessly without clearing existing data.
4. **Offline Outbox**: Mutations executed without an internet connection are written to an IndexedDB outbox and replayed in FIFO order upon network reconnection.

# Family Portfolio Tracker — Architecture Refactor & Rewrite Plan

## Purpose

This document is the implementation blueprint for restructuring the Family Portfolio Tracker architecture.

The goal is **not** to rewrite the application. The existing application already has strong domain components, caching, lazy loading, Web Workers, data-quality validation, a centralized design system, and separate database tables for major asset domains.

The goal is to establish clearer boundaries so future features such as Stocks, Broker Sync, Advanced Analytics, Tax Planning, Notifications, AI tools, and Multi-User Security can be added without continually expanding the existing global state/data hooks.

---

# 1. Current Architecture Baseline

The current architecture contains:

- `PortfolioContext.tsx`
- `usePortfolioData.ts`
- Domain-specific asset components for FD, RD, SIP, Gold, Real Estate, Insurance, Documents, etc.
- SWR + IndexedDB caching
- Supabase Edge Functions/API client
- Web Workers for XIRR
- Lazy-loaded registry views
- Centralized UI tokens through `UI.md` and `src/index.css`
- Separate Supabase tables per asset domain
- Data-quality and backup validation systems
- Intent-based AI assistant
- PIN + biometric access gate

The architecture document explicitly identifies `usePortfolioData.ts` as the source of truth for assets, snapshots, database transactions, SWR, IndexedDB invalidation, visibility refresh, recalculation guards, mutation serialization, and API-client integration.

That responsibility is now too broad for long-term maintainability.

---

# 2. Target Architecture

Use the following high-level structure:

```text
src/
│
├── app/
│   ├── App.tsx
│   ├── MainApp.tsx
│   ├── router/
│   └── providers/
│
├── domains/
│   ├── portfolio/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── calculations/
│   │   ├── repositories/
│   │   ├── types/
│   │   └── events/
│   │
│   ├── assets/
│   │   ├── fd/
│   │   ├── rd/
│   │   ├── sip/
│   │   ├── stocks/
│   │   ├── gold/
│   │   ├── realestate/
│   │   ├── insurance/
│   │   └── cash/
│   │
│   ├── performance/
│   ├── taxation/
│   ├── documents/
│   ├── data-quality/
│   ├── notifications/
│   └── ai/
│
├── infrastructure/
│   ├── supabase/
│   ├── market-data/
│   ├── storage/
│   ├── cache/
│   ├── workers/
│   ├── biometrics/
│   └── sync/
│
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   ├── constants/
│   └── design-system/
│
└── styles/
    └── index.css
```

## Architectural rule

Dependency direction should be:

```text
UI
 ↓
Domain Hooks / Controllers
 ↓
Domain Services
 ↓
Repository Interfaces
 ↓
Infrastructure Implementations
 ↓
Supabase / External APIs / IndexedDB
```

Domain code must not directly depend on Supabase, Yahoo Finance, browser storage, or other infrastructure.

---

# 3. P0 — Split `usePortfolioData.ts`

## Problem

`usePortfolioData.ts` currently combines too many responsibilities:

- Data loading
- Database transactions
- SWR
- IndexedDB
- Visibility handling
- Price refreshing
- Recalculation optimization
- Mutation serialization
- API integration

This creates a high-coupling central module.

## Target

Split responsibilities into:

```text
src/domains/portfolio/hooks/
├── usePortfolioQuery.ts
├── usePortfolioMutation.ts
├── usePortfolioRefresh.ts
├── usePortfolioSync.ts
└── usePortfolioState.ts
```

Infrastructure:

```text
src/infrastructure/cache/
├── swrConfig.ts
├── portfolioCache.ts
└── indexedDbCache.ts
```

Services:

```text
src/domains/portfolio/services/
├── portfolioService.ts
├── portfolioCalculationService.ts
└── portfolioSyncService.ts
```

## Rules

`usePortfolioData.ts` should eventually disappear.

Do not duplicate its logic into multiple hooks blindly.

First identify each responsibility, move it to the correct layer, then replace the old hook with the new interfaces.

---

# 4. P0 — Introduce Repository Interfaces

Create repository contracts under:

```text
src/domains/*/repositories/
```

Example:

```ts
export interface FDRepository {
  getAll(portfolioId: string): Promise<FD[]>;
  getById(id: string): Promise<FD | null>;
  create(input: CreateFDInput): Promise<FD>;
  update(id: string, input: UpdateFDInput): Promise<FD>;
  delete(id: string): Promise<void>;
}
```

Infrastructure implementation:

```text
src/infrastructure/supabase/repositories/
├── SupabaseFDRepository.ts
├── SupabaseRDRepository.ts
├── SupabaseSIPRepository.ts
├── SupabaseGoldRepository.ts
├── SupabaseRealEstateRepository.ts
├── SupabaseInsuranceRepository.ts
└── SupabaseDocumentRepository.ts
```

## Important

Components must not call Supabase directly.

Domain services should depend on repository interfaces.

Infrastructure implements those interfaces.

This makes testing and future data-source changes easier.

---

# 5. P0 — Create a Common Asset Domain Model

Create:

```text
src/domains/assets/types/
├── AssetType.ts
├── BaseAsset.ts
├── AssetValue.ts
└── AssetReference.ts
```

Recommended base model:

```ts
export type AssetType =
  | "stock"
  | "mutual_fund"
  | "fd"
  | "rd"
  | "gold"
  | "real_estate"
  | "insurance"
  | "cash";

export interface BaseAsset {
  id: string;
  portfolioId: string;
  assetType: AssetType;
  name: string;
  investedAmount: number;
  currentValue: number;
  createdAt: string;
  updatedAt: string;
}
```

Each domain may extend the base model with domain-specific properties.

Do not force every database field into the common model.

The common model exists for:

- Net worth
- Allocation
- Search
- Analytics
- AI
- Data quality
- Reporting

---

# 6. P0 — Separate Market Data Infrastructure

Current market pricing responsibilities should move into:

```text
src/infrastructure/market-data/
├── types/
│   ├── MarketQuote.ts
│   └── MarketProvider.ts
│
├── yahoo/
├── nse/
├── amfi/
├── mcx/
├── providers/
├── marketDataService.ts
└── marketDataCache.ts
```

Examples of providers:

```text
Yahoo Finance
AMFI
NSE
MCX
```

Domain code should not know which provider supplied a price.

Use an interface such as:

```ts
export interface MarketDataProvider {
  getQuote(symbol: string): Promise<MarketQuote>;
}
```

Then:

```text
Domain
 ↓
MarketDataService
 ↓
Provider
 ↓
External API
```

---

# 7. P0 — Security Architecture

The existing PIN/biometric gate should remain as a UX/access mechanism, but it must not become the long-term database security boundary.

Target:

```text
Supabase Auth
      ↓
Authenticated User
      ↓
Portfolio Ownership
      ↓
RLS
      ↓
PostgreSQL
```

## Database

Add ownership relationships to all user-owned financial records.

Prefer a consistent ownership model such as:

```text
profiles
portfolios
portfolio_members
assets
documents
```

Every financial record must be traceable to an authorized portfolio/user.

## RLS

Every user-owned table should have explicit Row Level Security policies.

Do not rely on:

- React state
- PIN screens
- hidden UI
- client-side filtering

for authorization.

---

# 8. P0 — Add Audit Logging

Create:

```text
audit_logs
```

Suggested fields:

```text
id
user_id
portfolio_id
entity_type
entity_id
action
old_value
new_value
created_at
```

Actions may include:

```text
CREATE
UPDATE
DELETE
IMPORT
RESTORE
BROKER_SYNC
```

Audit logging is particularly important for financial records.

---

# 9. P1 — Reorganize Calculation Architecture

Current calculation utilities should evolve into:

```text
src/domains/
├── performance/
│   ├── calculations/
│   │   ├── xirr.ts
│   │   ├── cagr.ts
│   │   ├── returns.ts
│   │   └── benchmark.ts
│   └── services/
│
├── taxation/
│   ├── calculations/
│   │   ├── capitalGains.ts
│   │   ├── taxHarvesting.ts
│   │   └── financialYear.ts
│   └── services/
│
└── portfolio/
    └── calculations/
        ├── netWorth.ts
        ├── allocation.ts
        ├── concentration.ts
        └── portfolioTotals.ts
```

Asset-specific calculations:

```text
domains/assets/fd/calculations/
domains/assets/rd/calculations/
domains/assets/sip/calculations/
domains/assets/gold/calculations/
domains/assets/realestate/calculations/
```

Calculations should be pure wherever possible.

Example:

```ts
calculateXIRR(cashFlows)
calculateCAGR(initialValue, finalValue, years)
calculateFDMaturity(input)
calculateRDMaturity(input)
calculatePortfolioAllocation(assets)
```

Pure calculation functions should not access:

- React
- Supabase
- localStorage
- IndexedDB
- browser APIs

---

# 10. P1 — Web Worker Boundary

Keep Web Workers.

Current XIRR Worker architecture is a good performance decision.

Standardize it:

```text
src/infrastructure/workers/
├── WorkerPool.ts
├── xirr.worker.ts
└── workerTypes.ts
```

Domain calculations should expose:

```ts
calculateXIRR()
calculateXIRRAsync()
```

The domain should not know how the worker is implemented.

---

# 11. P1 — Document Domain

Create:

```text
src/domains/documents/
├── components/
├── services/
├── repositories/
├── validation/
├── types/
└── documentLinking.ts
```

Infrastructure:

```text
src/infrastructure/storage/
└── SupabaseDocumentStorage.ts
```

Flow:

```text
Asset
 ↓
DocumentReference
 ↓
Document Domain
 ↓
Storage Interface
 ↓
Supabase Storage
```

Keep the existing taxonomy:

```text
fd_advice
policy_schedule
title_deed
tax_receipt
invoice
gold_hallmark
account_statement
general
```

Keep the existing 10MB validation unless a future requirement changes it.

---

# 12. P1 — AI Assistant Refactor

Current intent-based AI should remain, but isolate it.

Target:

```text
src/domains/ai/
├── assistant/
│   ├── assistantService.ts
│   ├── intentClassifier.ts
│   ├── queryParser.ts
│   └── responseGenerator.ts
│
├── intents/
│   ├── portfolioValue.ts
│   ├── performance.ts
│   ├── holdings.ts
│   ├── maturity.ts
│   └── tax.ts
│
├── tools/
│   ├── portfolioTool.ts
│   ├── performanceTool.ts
│   ├── taxTool.ts
│   └── marketTool.ts
│
└── types/
```

Critical rule:

```text
AI
 ↓
Tool
 ↓
Deterministic Domain Service
 ↓
Financial Result
```

Do not allow an LLM to directly modify financial records.

All financial calculations must remain deterministic.

---

# 13. P1 — Broker Sync Architecture

Do not implement broker integration as:

```text
Broker API → Database
```

Use:

```text
Broker
 ↓
Connector
 ↓
Raw Broker Data
 ↓
Normalizer
 ↓
Reconciliation Engine
 ↓
Portfolio Domain
 ↓
Repository
 ↓
Database
```

Create:

```text
src/infrastructure/sync/
├── connectors/
├── normalizers/
├── reconciliation/
├── syncService.ts
└── syncTypes.ts
```

Reconciliation states:

```text
MATCHED
NEW
CHANGED
MISSING
DUPLICATE
CONFLICT
```

This is necessary because imported broker holdings may differ from manually maintained portfolio records.

---

# 14. P1 — Domain Events

Do not introduce full event sourcing.

Introduce lightweight domain events:

```text
AssetCreated
AssetUpdated
AssetDeleted

PortfolioValueChanged
MarketPriceUpdated

DepositMatured
InsuranceRenewalDue

BrokerSyncCompleted
```

Structure:

```text
src/domains/*/events/
```

Events should support:

- Notifications
- Audit logs
- Analytics
- Sync status
- AI insights

without tightly coupling these systems.

---

# 15. P1 — Notifications Domain

Create:

```text
src/domains/notifications/
├── notificationService.ts
├── notificationTypes.ts
├── notificationRules.ts
└── notificationRepository.ts
```

Possible notification rules:

```text
FD maturity approaching
RD installment due
Insurance renewal approaching
Document expiry
Stale market price
Data-quality issue
Broker sync failure
```

Notification logic should consume domain events/rules instead of being embedded inside individual UI components.

---

# 16. P1 — Data Quality Architecture

Keep the existing data-quality engine.

Move it toward:

```text
src/domains/data-quality/
├── rules/
├── healthScore.ts
├── diagnostics.ts
├── history.ts
└── types.ts
```

Rules should be independent:

```text
MissingMaturityDateRule
ZeroValuationRule
MissingDocumentRule
StalePriceRule
DuplicateAssetRule
```

Each rule should return a standardized diagnostic:

```ts
interface DataQualityIssue {
  code: string;
  severity: "info" | "warning" | "critical";
  entityType: string;
  entityId: string;
  message: string;
  fixable: boolean;
}
```

---

# 17. P1 — Backup/Restore Architecture

Keep the current schema validation and duplicate detection.

Move it toward:

```text
src/domains/portfolio/backup/
├── backupSchema.ts
├── backupValidator.ts
├── restoreService.ts
└── migration.ts
```

Important:

Every backup should contain:

```text
schemaVersion
createdAt
applicationVersion
portfolio data
asset data
document references
```

Future schema migrations should be explicit.

Example:

```text
backup v1
 ↓
migration v2
 ↓
migration v3
 ↓
current schema
```

Do not silently reinterpret old backups.

---

# 18. P1 — State Management Rules

Keep the current split:

```text
PortfolioEntitiesContext
PortfolioStatusContext
PortfolioActionContext
```

This is a good pattern.

However, define strict responsibilities:

### Entities

Only:

- Portfolio data
- Assets
- Snapshots
- Derived entity state

### Status

Only:

- Loading
- Refreshing
- Errors
- Staleness
- Sync status
- Mutation lock

### Actions

Only:

- Create
- Update
- Delete
- Refresh
- Sync

Avoid putting calculation logic directly inside React Context.

---

# 19. P1 — UI Architecture

Keep:

```text
AssetRegistryContainer
AssetCardSkeleton
EmptyState
DocumentAttachmentField
QuickAccessShortcuts
```

Move generic UI components to:

```text
src/shared/components/
```

Domain-specific components stay inside their domains.

Example:

```text
shared/components/Button.tsx
shared/components/Modal.tsx

domains/assets/fd/components/FDFormModal.tsx
domains/assets/fd/components/DepositDetailsCard.tsx
```

Rule:

> Shared components must not contain business logic.

---

# 20. P1 — Design System

Keep `UI.md` as the single source of truth.

Do not change this principle.

Maintain:

```text
UI.md
 ↓
Design Tokens
 ↓
src/index.css
 ↓
Shared UI
 ↓
Domain Components
```

No new arbitrary:

- colors
- shadows
- radii
- typography values

without first defining the token.

---

# 21. P2 — Performance Rules

Keep existing optimizations, but introduce evidence-based rules.

Before adding:

- `React.memo`
- `will-change`
- GPU promotion
- virtualization
- `content-visibility`
- prefetching
- worker processing

record the performance reason.

Every optimization should answer:

```text
What problem does this solve?
How was it measured?
What is the expected benefit?
```

Avoid optimization for optimization's sake.

---

# 22. P2 — Testing Architecture

Create:

```text
tests/
├── unit/
│   ├── calculations/
│   ├── taxation/
│   ├── valuation/
│   └── data-quality/
│
├── integration/
│   ├── repositories/
│   ├── sync/
│   └── backup/
│
└── fixtures/
```

Minimum critical coverage:

```text
XIRR
CAGR
FD maturity
RD maturity
SIP valuation
Gold valuation
Portfolio totals
Allocation
Tax calculations
Data quality
Backup validation
Reconciliation
```

Financial calculation tests should include:

- normal values
- zero values
- negative returns
- leap years
- irregular dates
- large values
- invalid input
- floating-point edge cases

---

# 23. P2 — TypeScript Rules

Enable strict TypeScript settings.

Avoid:

```ts
any
```

unless explicitly justified.

Prefer:

```ts
unknown
```

with validation.

Use domain-specific types rather than passing large generic objects between components.

Avoid:

```ts
Record<string, any>
```

for financial data.

---

# 24. P2 — Error Handling

Create standardized application errors:

```text
src/shared/errors/
├── AppError.ts
├── ValidationError.ts
├── RepositoryError.ts
├── SyncError.ts
├── MarketDataError.ts
└── AuthenticationError.ts
```

UI should not display raw technical errors.

Use:

```text
Technical Error
      ↓
Error Mapper
      ↓
User-Friendly Message
```

---

# 25. P2 — Logging

Create a lightweight logger:

```text
src/infrastructure/logging/
└── logger.ts
```

Levels:

```text
debug
info
warn
error
```

Do not scatter `console.log()` throughout production code.

Never log:

- PIN
- authentication tokens
- secrets
- API keys
- private financial document contents

---

# 26. Recommended Database Direction

Current separate tables for each asset class can remain.

Do **not** merge everything into one giant assets table just for architectural symmetry.

Keep:

```text
fixed_deposits
rd_accounts
sip_accounts
gold_holdings
real_estate
insurances
documents
net_worth_history
market_price_cache
```

Add consistent ownership and audit relationships.

Later, if stocks are added:

```text
stock_holdings
stock_transactions
```

If mutual funds need transaction-level tracking:

```text
mf_holdings
mf_transactions
```

Use transaction tables when historical performance/tax calculations require them.

---

# 27. Transaction Ledger — Important Future Addition

For serious performance and tax analysis, eventually add transaction-level data.

Example:

```text
portfolio_transactions
```

Possible transaction types:

```text
BUY
SELL
DIVIDEND
INTEREST
DEPOSIT
WITHDRAWAL
TRANSFER
FEE
TAX
ADJUSTMENT
```

This becomes the foundation for:

- XIRR
- realized P&L
- unrealized P&L
- capital gains
- tax harvesting
- broker reconciliation
- portfolio history

Do not implement the complete ledger unless the feature requires it, but design future asset domains so they can support transactions.

---

# 28. Migration Strategy

Do not rewrite everything at once.

## Phase 1 — Foundation

- [ ] Create new directory structure
- [ ] Create shared domain types
- [ ] Create repository interfaces
- [ ] Create infrastructure interfaces
- [ ] Add architecture dependency rules
- [ ] Add tests for existing critical calculations

## Phase 2 — Portfolio Refactor

- [ ] Split `usePortfolioData.ts`
- [ ] Extract repository operations
- [ ] Extract cache operations
- [ ] Extract refresh/sync operations
- [ ] Preserve existing public behavior
- [ ] Remove old hook only after all consumers migrate

## Phase 3 — Asset Domains

- [ ] Move FD domain
- [ ] Move RD domain
- [ ] Move SIP domain
- [ ] Move Gold domain
- [ ] Move Real Estate domain
- [ ] Move Insurance domain
- [ ] Move Documents domain

Do not change business behavior during the move.

## Phase 4 — Market Data

- [ ] Create MarketDataProvider interface
- [ ] Move Yahoo integration
- [ ] Move AMFI integration
- [ ] Move MCX integration
- [ ] Centralize market cache
- [ ] Add stale-data handling

## Phase 5 — Security

- [ ] Introduce Supabase Auth
- [ ] Define portfolio ownership
- [ ] Add RLS
- [ ] Test unauthorized access
- [ ] Keep PIN/biometric as UX layer
- [ ] Add audit logging

## Phase 6 — AI

- [ ] Extract intent classifier
- [ ] Create domain tools
- [ ] Connect tools to deterministic services
- [ ] Prevent direct AI database mutations
- [ ] Add tests for each intent

## Phase 7 — Broker Sync

- [ ] Create connector interface
- [ ] Create normalizer
- [ ] Create reconciliation engine
- [ ] Add sync status
- [ ] Add conflict handling
- [ ] Add audit events

---

# 29. Dependency Rules

Enforce these rules:

```text
shared
  ↓
domains
  ↓
infrastructure
```

More precisely:

### Shared

Cannot import domains.

### Domain

Can import shared.

Cannot import Supabase/browser infrastructure directly.

### Infrastructure

Can import shared and implement domain interfaces.

### UI

Can import shared and domain modules.

UI should not directly import infrastructure.

---

# 30. Things NOT to Change

Do not unnecessarily replace:

- React
- TypeScript
- Vite
- Supabase
- SWR
- IndexedDB
- Web Workers
- React.lazy
- existing domain-specific asset views
- `UI.md` design-token strategy
- current backup validation concept
- current data-quality concept

The objective is architectural clarity, not technology replacement.

---

# 31. Definition of Done

A refactor is complete only when:

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
- [ ] Existing functionality remains intact
- [ ] Critical calculation tests pass
- [ ] No direct Supabase calls exist inside presentation components
- [ ] Domain logic does not depend on infrastructure
- [ ] No new UI tokens bypass `UI.md`
- [ ] No sensitive data is logged
- [ ] Backup/restore still works
- [ ] Mobile functionality still works
- [ ] PWA functionality still works
- [ ] Lazy-loaded views still work
- [ ] Web Worker calculations still work
- [ ] Data-quality checks still work

---

# 32. Recommended Final Architecture Principle

The project should follow this rule:

> **UI displays state. Hooks orchestrate state. Domain services implement business rules. Repositories abstract persistence. Infrastructure talks to external systems. Calculations remain deterministic and testable.**

The architecture should make it possible to replace:

```text
Supabase
Yahoo Finance
AMFI
MCX
Broker APIs
AI provider
IndexedDB
```

without rewriting the financial domain.

---

# 33. Final Priority

## Must do now

1. Split `usePortfolioData.ts`
2. Introduce repositories
3. Establish domain/infrastructure boundaries
4. Create common asset types
5. Separate market-data infrastructure
6. Establish Auth + RLS architecture
7. Add audit logging

## Do next

8. Refactor calculations
9. Isolate Documents
10. Isolate AI
11. Create broker sync/reconciliation architecture
12. Introduce domain events
13. Add notification architecture

## Do later

14. Transaction ledger
15. Advanced tax engine
16. Advanced portfolio analytics
17. Benchmark analytics
18. Advanced AI capabilities

---

# 34. Most Important Instruction for the Rewrite

**Do not perform a big-bang rewrite.**

For every migration:

```text
Existing implementation
        ↓
Introduce new abstraction
        ↓
Move one responsibility
        ↓
Update consumers
        ↓
Run tests
        ↓
Run TypeScript
        ↓
Run production build
        ↓
Remove old implementation
```

The application should remain functional after every phase.

The primary goal is to reduce coupling and create clean boundaries while preserving existing functionality.

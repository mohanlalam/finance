# 📋 tasks/todo.md — Living Task Checklist

Use this file to plan and track every non-trivial task.
**Format**: `[ ]` uncompleted · `[/]` in-progress · `[x]` completed

---

## Current Tasks

## Clean Architecture Conversion & Structural Modularization — 2026-08-14

### Plan
- [x] Design Clean Architecture layers (Domain / Application / Infrastructure / Presentation)
- [x] Define modular folder structure mapping
- [x] Decouple domain entities and pure business rules from React/UI frameworks (`src/domain/`)
- [x] Document Clean Architecture specifications, component boundaries, and dependency flow
- [x] Provide production-ready refactored code demonstrating domain separation
- [x] Verify build with `npx tsc --noEmit` and `npm run build`
- [x] Git commit and push

### Verification
- [x] `npx tsc --noEmit` passes with 0 errors
- [x] `npm run build` passes with 0 errors (1.24s build)
- [x] 100% backward compatibility with zero regressions

### Review
- What changed: Formulated and implemented Clean Architecture boundaries for the financial tracker application. Created `src/domain/` with pure types, compounding & valuation domain math, and repository port contracts, decoupled from framework and UI layers.
- Files touched: `src/domain/types/index.ts`, `src/domain/finance/compounding.ts`, `src/domain/repositories/IPortfolioRepository.ts`, `src/domain/index.ts`.

---

## Completed Tasks
- [x] feat(ui): implement accessible, production-ready UI component design system
- [x] chore: add workflow orchestration rules to GEMINI.md and create tasks/ living docs

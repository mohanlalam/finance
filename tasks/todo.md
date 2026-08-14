# 📋 tasks/todo.md — Living Task Checklist

Use this file to plan and track every non-trivial task.
**Format**: `[ ]` uncompleted · `[/]` in-progress · `[x]` completed

---

## Current Tasks

## AI Portfolio Assistant UI & UX Modernization — 2026-08-14

### Plan
- [x] Inspect and redesign `src/components/PortfolioAssistant.tsx`
- [x] Upgrade visual hierarchy, typography, and contrast for light & dark modes
- [x] Modernize suggested query chips with categorization and tactile hover states
- [x] Enhance chat input with shortcut badge (`/`), clear button, and accessible controls
- [x] Improve markdown table, list, and matched asset card rendering
- [x] Verify with `npx tsc --noEmit` and `npm run build`
- [x] Git commit and push

### Verification
- [x] `npx tsc --noEmit` passes with 0 errors
- [x] `npm run build` passes with 0 errors (1.49s build)
- [x] Strict 370px dashboard card height preserved

### Review
- What changed: Redesigned and modernized the AI Portfolio Assistant widget with cleaner typography, categorized suggested prompt chips, keyboard shortcut hint (`/`), high-contrast markdown tables/bubbles, and tactile interactive controls.
- Files touched: `src/components/PortfolioAssistant.tsx`.

---

## Completed Tasks
- [x] perf: eliminate closure allocations in intraday PnL loop and optimize calculation hot paths
- [x] feat(arch): introduce clean architecture domain layers and business rule decoupling
- [x] feat(ui): implement accessible, production-ready UI component design system
- [x] chore: add workflow orchestration rules to GEMINI.md and create tasks/ living docs

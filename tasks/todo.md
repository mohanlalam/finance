# 📋 tasks/todo.md — Living Task Checklist

Use this file to plan and track every non-trivial task.
**Format**: `[ ]` uncompleted · `[/]` in-progress · `[x]` completed

---

## Current Tasks

## Senior Frontend UI Design System & Reusable Components — 2026-08-14

### Plan
- [x] Design component architecture, props specifications, and accessibility contracts
- [x] Implement foundational accessible, production-ready UI components in `src/components/ui/`:
  - [x] `Input.tsx` (Form input with label, prefix/suffix, loading, error, clear button, ARIA descriptors)
  - [x] `Select.tsx` (Form select with optgroups, error, helper text, custom chevron, keyboard navigation)
  - [x] `Dialog.tsx` (Accessible Modal with focus trap, ESC listener, ARIA labelledby/describedby, responsive mobile sheet)
  - [x] `Drawer.tsx` (Accessible Drawer/Slide-over with swipe dismiss, body scroll lock, focus trap)
  - [x] `Alert.tsx` (Accessible callout/alert banner with ARIA roles `alert` / `status`, dismissible action)
  - [x] `Tabs.tsx` (WAI-ARIA Tab list with keyboard arrow nav, badge counters, animated indicator)
  - [x] `Tooltip.tsx` (Accessible hover/focus tooltip with smart positioning and ESC dismissal)
  - [x] `StatCard.tsx` (Financial metric card with trend indicator, sparkline slot, skeleton loading)
  - [x] `Table.tsx` (Accessible data table primitives with sticky headers, sort indicators, loading states)
  - [x] `index.ts` (Clean barrel export file)
- [x] Create comprehensive documentation with component architecture, props design, and full usage examples
- [x] Verify with `npx tsc --noEmit` and `npm run build`
- [x] Git commit and push

### Verification
- [x] `npx tsc --noEmit` passes with 0 errors
- [x] `npm run build` passes with 0 errors (1.35s build)
- [x] Proper ARIA attributes, keyboard support, responsive breakpoints, loading skeletons

### Review
- What changed: Built a production-grade, accessible UI component primitive system under `src/components/ui/` covering forms, overlays, feedback, navigation, data display, and financial metric cards.
- Files touched: `Input.tsx`, `Select.tsx`, `Dialog.tsx`, `Drawer.tsx`, `Alert.tsx`, `Tabs.tsx`, `Tooltip.tsx`, `StatCard.tsx`, `Table.tsx`, `index.ts`.
- Accessibility: WAI-ARIA compliant focus trapping, roving tabindex, ARIA live regions, keyboard navigation (ESC, Tab, Arrows), contrast and screen-reader semantics.

---

## Completed Tasks
- [x] Chore: add workflow orchestration rules to GEMINI.md and create tasks/ living docs

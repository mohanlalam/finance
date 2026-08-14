# 📋 tasks/todo.md — Living Task Checklist

Use this file to plan and track every non-trivial task.
**Format**: `[ ]` uncompleted · `[/]` in-progress · `[x]` completed

---

## Current Tasks

## Performance Engineering Optimization Suite — 2026-08-14

### Plan
- [/] Performance Bottleneck Audit across calculation loops, memory allocation, and React renders
- [ ] Eliminate per-call closure allocations and intermediate array copies in `portfolioCalcs.ts`
- [ ] Optimize hot loops in financial calculation utilities (RD, SIP, XIRR solvers)
- [ ] Document performance findings (Bottlenecks, Optimization Strategies, Improved Code)
- [ ] Verify build with `npx tsc --noEmit` and `npm run build`
- [ ] Git commit and push

### Verification
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `npm run build` passes with 0 errors
- [ ] Zero GC allocation regressions on hot rendering paths

---

## Completed Tasks
- [x] feat(arch): introduce clean architecture domain layers and business rule decoupling
- [x] feat(ui): implement accessible, production-ready UI component design system
- [x] chore: add workflow orchestration rules to GEMINI.md and create tasks/ living docs

# 🧠 Architectural & Auditing Lessons Learned

_Last updated: 2026-09-07_

This document captures engineering lessons learned from audits, architectural reviews, and comparative model evaluations across the Family Portfolio Tracker project.

---

## 1. Model Selection & Auditing Philosophy: Flash vs. Frontier Reasoning Models

### The Observation
When prompted with the identical codebase audit instruction:
* **Gemini 3.8 Flash** reported a "clean" bill of health with no significant findings.
* **Claude Sonnet 4.6 (Thinking / Extended Reasoning)** produced two detailed, critical reports:
  * [`audit_report.md`](file:///c:/Users/Ram%20Mohan/.gemini/antigravity-ide/brain/d671ac52-c446-49fa-a0ba-625d8289c43b/audit_report.md) (Identified server-side cold-start rate-limit bypasses, unescaped CSV formula injection, test PIN persistence hazards).
  * [`audit_supplemental.md`](file:///c:/Users/Ram%20Mohan/.gemini/antigravity-ide/brain/d671ac52-c446-49fa-a0ba-625d8289c43b/audit_supplemental.md) (Identified missing CSP headers, unbounded Map memory leaks, missing retry caps on offline queues, `gemini-proxy` rate limiting disparity, and 106 kB monolithic chunk bundling).

---

### Root Causes: Why Did This Disparity Occur?

#### 1. The "Green Tests = Clean Code" Verification Bias
* **What Flash did:** Gemini Flash executed the verification pipeline (`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`). When all 50 test files passed (282 tests) and the compiler returned exit code 0, Flash concluded the codebase was clean and conformed to specifications.
* **The Trap:** Automated unit tests only test what developers thought to test. Tests do not test:
  * What happens when a Deno serverless container goes cold (in-memory rate limit reset).
  * What happens when an offline mutation fails 50 times in a row (zombie queue stall).
  * What happens when a browser tab stays open for 3 months with 500 stock quote updates (unbounded `stalePriceCache` growth).
  * Missing defensive headers like Content Security Policy (`index.html`).

#### 2. Architecture & Purpose: Low-Latency Flash vs. Deep Chain-of-Thought Reasoning
* **Flash Models (Gemini 3.8 Flash):**
  * Engineered for raw execution speed, low latency, and rapid code generation.
  * Defaults to direct execution and affirmative validation rather than adversarial code critique.
  * Excels at implementing tasks, rapid refactoring, running commands, and fixing explicit compilation/test errors.
* **Reasoning / Extended Thinking Models (Sonnet 4.6 with Thinking):**
  * Spends thousands of internal chain-of-thought tokens specifically modeling failure scenarios before emitting an answer.
  * Performs **Adversarial Threat Modeling**: It actively asks *"How can this break?"*, *"What happens if the network is flaky?"*, *"How could an attacker exploit this proxy?"*, and *"Why is this bundle chunk so large?"*.
  * Inspects cross-system boundaries (e.g., how the Vite build splits Rollup chunks, how Edge runtime containers handle state across cold starts).

---

## 2. Auditing Rules for Future Work

1. **Never equate passing tests with security or architectural perfection:**
   * A 100% passing test suite confirms code does what was written; it does not confirm the absence of missing defenses.
2. **Use the Right Model for the Job:**
   * **For Auditing, Threat Modeling & Architecture Design:** Always use **Frontier Reasoning / Thinking Models** (e.g., Claude Sonnet 4.6 Thinking, Gemini Pro with Thinking). Their chain-of-thought actively searches for blind spots.
   * **For Fast Execution, Iteration, Refactoring & Bug Fixing:** **Flash models** (e.g., Gemini 3.8 Flash) are superb, cost-effective, and fast for applying fixes once issues are identified.
3. **Audit Checkpoints to Always Enforce Independently of Model:**
   * **Serverless Edge Functions:** Never use in-memory state (`new Map()`) for security boundaries (rate limiting, auth tracking) because containers are ephemeral. Always use database-backed persistence (`pin_rate_limits`).
   * **Memory Bounds:** Every persistent cache (`Map`, `Set`, `Array`) in a single-page app must have an eviction policy or maximum capacity limit.
   * **Offline Queues:** Any background retry loop must have a `MAX_RETRY_COUNT` and dead-letter / abandon mechanism to prevent queue stalls.
   * **Bundle Size & LCP:** Keep entry / authenticated shell chunks under 50 kB by aggressively lazy-loading drawers, modals, menus, and bottom sheets.
   * **Defensive Web Standards:** Never deploy a financial PWA without a strict `Content-Security-Policy`.

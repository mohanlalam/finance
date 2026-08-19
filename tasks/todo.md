# Implementation Plan: Codebase Enhancements & Bug Fixes

- [x] **Phase 1: Fix Real Bugs & Token Harmonization**
  - [x] Clean up dead 52-week alert code in `useAlerts.ts`, `AlertsBanner.tsx`, `Header.tsx`, and `MobileAlertsView.tsx`
  - [x] Token-harmonize RD & SIP components (`RDAccountCard.tsx`, `SIPAccountCard.tsx`, `RDFormModal.tsx`, `SIPFormModal.tsx`, `SIPFormFields.tsx`, `RDInstallmentSchedule.tsx`, `RDView.tsx`, `SIPView.tsx`) & fix `text-sky-650` typo
- [x] **Phase 2: Implement Feature Enhancements**
  - [x] Add RD maturity alerts to `useAlerts.ts`
  - [x] Add RD tenure countdown & completion progress bar to `RDAccountCard.tsx`
  - [x] Show actual realized P&L % alongside Expected CAGR on `SIPAccountCard.tsx`
  - [x] Add inline expired & expiring-soon badges to `DocumentVaultView.tsx`
  - [x] Add Real Estate rental yield & rental income metrics to `InsightsPanel.tsx`
  - [x] Add RD installment completeness check to `dataQuality.ts`
- [x] **Phase 3: Polish & Verification**
  - [x] Prefix bare `console.error` in `PortfolioAssistant.tsx`
  - [x] Verify `npm run build` and `npm test` pass with 0 errors
  - [x] Commit & push changes to git

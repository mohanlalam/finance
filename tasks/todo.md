# Tasks: Audit Report 4 Remediation

- [x] **Phase 1: Storage & Document Upload Hardening**
  - [x] 1.1 Add 10MB client-side file size limit check in `src/components/DocumentVaultView.tsx` (`handleFilePick`)
  - [x] 1.2 Sanitize storage path in `src/utils/supabaseStorage.ts` to filter out `.` and `..` directory traversal segments
- [x] **Phase 2: PDF Export & iOS Gesture Preservation**
  - [x] 2.1 Refactor PDF report generation in `src/utils/pdfReport.ts` and `src/components/ExportPanel.tsx` to preserve the user-gesture chain and prevent iOS Safari popup blockage
- [x] **Phase 3: Tax Harvesting & Debt/Gold Capital Gains Classification**
  - [x] 3.1 Separate `isDebtOrGold` holdings from equity LTCG/STCG pools in `src/utils/taxUtils.ts` (so they are not blended into the ₹1.25L equity LTCG exemption)
  - [x] 3.2 Update `src/components/TaxHarvestingView.tsx` to accurately display Slab Rate / Debt & Gold capital gains alongside equity STCG/LTCG
- [x] **Phase 4: Form Modal Numerical Upper Bounds & Typing Polish**
  - [x] 4.1 Add upper-bound numerical validation across `FDFormModal.tsx`, `RDFormModal.tsx`, `SIPFormModal.tsx`, `GoldFormModal.tsx`, `RealEstateFormModal.tsx`, and `InsuranceFormModal.tsx`
  - [x] 4.2 Clean up loose `any` callback signatures in `StandardFormFields.tsx` and form modals
- [x] **Phase 5: Interactive Utilities & Design Token Polish**
  - [x] 5.1 Cap ancestor DOM traversal depth (`depth < 6`) in `src/hooks/usePullToRefresh.ts`
  - [x] 5.2 Align Smart AI Import button styling in `src/layouts/DesktopSidebar.tsx` with design system tokens
- [x] **Phase 6: Verification & Test Suite**
  - [x] 6.1 `npx tsc --noEmit` (Passed with 0 errors)
  - [x] 6.2 `npm run lint` (Passed with 0 errors/warnings)
  - [x] 6.3 `npm test` (Passed all 16 test suites, 93 tests)
  - [x] 6.4 `npm run build` (Production build generated successfully)






# Implementation Plan: Backup/Restore Validation, Document Upload Hardening & Health Check Persistence

This implementation addresses three high-value data integrity features:
1. **Backup / Restore Validation & Preview**: Full JSON backup schema verification, counts by asset type, duplicate asset/document detection, missing linked document detection, dry-run simulation, and detailed restore report modal.
2. **Document Upload Hardening & Badging**: Document type taxonomy (`invoice`, `policy_schedule`, `title_deed`, `tax_receipt`, `fd_advice`, `general`), required document hints per asset type, file size (max 10MB) & MIME type validation, clearer upload error reporting, and visual attachment status badges on asset cards.
3. **Health Check Persistence & Trends**: LocalStorage/IndexedDB snapshot persistence for health scores over time, recording last checked timestamps, tracking resolved vs unresolved critical issues, and displaying progress trends.

---

## User Review Required

> [!NOTE]
> All changes are non-destructive and backward compatible with existing backups and document records.

---

## Proposed Changes

### 1. Backup / Restore Validation Engine
#### [NEW] [src/utils/backupValidation.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/backupValidation.ts)
- Comprehensive schema validation for JSON backups (`portfolios` array, holding records, FDs, RDs, SIPs, gold, real estate, insurances, documents).
- Pre-import analysis: asset count breakdown per category, duplicate detection against existing portfolios, missing linked document detection.
- Dry run restore simulation returning exact create vs overwrite vs duplicate stats.
- Detailed post-restore report generator.

#### [MODIFY] [src/components/ExportPanel.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/ExportPanel.tsx)
- Add JSON Backup Restore action with pre-import dry-run inspection modal.
- Shows asset breakdown chips, duplicates warning, unlinked document file warnings.
- Generates post-restore summary report.

---

### 2. Document Upload Hardening & Status Badges
#### [MODIFY] [src/components/ui/DocumentAttachmentField.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/ui/DocumentAttachmentField.tsx)
- Add Document Type Selector dropdown (`fd_advice`, `policy_schedule`, `title_deed`, `tax_receipt`, `invoice`, `gold_hallmark`, `general`).
- Add required document hints tailored to the asset (e.g. "FD Advice", "Insurance Policy Bond", "Title Deed / Tax Receipt", "Hallmark Invoice").
- Strict file validation: max 10MB, allowed types (`.pdf`, `.jpg`, `.png`, `.webp`, `.docx`, `.xlsx`).
- Clear descriptive failure messages if file validation fails.

#### [MODIFY] Asset Cards:
- [src/components/fd/DepositDetailsCard.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/fd/DepositDetailsCard.tsx)
- [src/components/gold/GoldHoldingCard.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/gold/GoldHoldingCard.tsx)
- [src/components/realestate/RealEstateCard.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/realestate/RealEstateCard.tsx)
- [src/components/insurance/InsurancePolicyCard.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/insurance/InsurancePolicyCard.tsx)
  - Add visual **Attachment Status Badge** (`📎 {n} Docs Attached` / `⚠️ No Doc Attached`) on each card header.

---

### 3. Health Check Persistence & Trend Tracking
#### [MODIFY] [src/utils/dataQuality.ts](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/utils/dataQuality.ts)
- Add `saveHealthSnapshot()`, `getHealthHistory()`, `getHealthTrend()`.
- Tracks score over time, resolved issues count, and timestamp of last audit.

#### [MODIFY] [src/components/DataQualityHealthModal.tsx](file:///c:/Users/Ram%20Mohan/OneDrive/Desktop/project%20antigravity/src/components/DataQualityHealthModal.tsx)
- Show Health History Trend strip (e.g., Score History, Last Audit timestamp, Issues resolved this month).

---

## Verification Plan

### Automated Tests
- Create unit tests for backup validator: `src/utils/__tests/backupValidation.test.ts`
- Run `npm run test`
- Run `npm run typecheck`
- Run `npm run build`

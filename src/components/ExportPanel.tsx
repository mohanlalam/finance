import React, { useState, useRef } from 'react';
import { Portfolio } from '../types/portfolio';
import { validateBackupJSON, BackupValidationReport } from '../utils/backupValidation';
export type { ImportRow, ParseResult } from '../domains/portfolio/export/csvImportParser';
import { ImportRow } from '../domains/portfolio/export/csvImportParser';
import { ExportDropdown } from './export/ExportDropdown';
import { BackupRestoreModal } from './export/BackupRestoreModal';
import { CSVImportModal } from './export/CSVImportModal';

export interface ExportPanelProps {
  portfolios: Portfolio[];
  onImportCSV: (rows: ImportRow[], portfolioName: string) => Promise<void>;
  portfolioOptions: { name: string; label: string }[];
}

export default React.memo(function ExportPanel({
  portfolios,
  onImportCSV,
  portfolioOptions,
}: ExportPanelProps) {
  const [showImport, setShowImport] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [backupJSONText, setBackupJSONText] = useState('');
  const [validationReport, setValidationReport] = useState<BackupValidationReport | null>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  function handleRestoreJSONFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Backup file is too large (exceeds 10MB limit).');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setBackupJSONText(text);
      const report = validateBackupJSON(text, portfolios);
      setValidationReport(report);
      setShowRestoreModal(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <>
      <ExportDropdown
        portfolios={portfolios}
        onOpenRestore={() => jsonFileInputRef.current?.click()}
        onOpenImport={() => setShowImport(true)}
      />

      {/* Hidden JSON file input for backup restore */}
      <input
        ref={jsonFileInputRef}
        type="file"
        accept=".json"
        onChange={handleRestoreJSONFileSelect}
        className="hidden"
      />

      {/* Backup Restore Preview Modal */}
      <BackupRestoreModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        portfolios={portfolios}
        backupJSONText={backupJSONText}
        validationReport={validationReport}
        onValidationReportUpdate={setValidationReport}
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        portfolioOptions={portfolioOptions}
        onImportCSV={onImportCSV}
      />
    </>
  );
});

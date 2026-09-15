import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Key,
} from '../icons/AppIcons';
import Modal from '../Modal';
import { Button } from '../ui/Button';
import { Portfolio } from '../../types/portfolio';
import { BackupValidationReport, RestoreExecutionReport } from '../../utils/backupValidation';
import { usePortfolioActions } from '../../contexts/PortfolioContext';
import { verifyPin } from '../../utils/auth';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolios: Portfolio[];
  backupJSONText: string;
  validationReport: BackupValidationReport | null;
  onValidationReportUpdate?: (report: BackupValidationReport | null) => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = React.memo(({
  isOpen,
  onClose,
  portfolios,
  backupJSONText,
  validationReport,
  onValidationReportUpdate,
}) => {
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreReport, setRestoreReport] = useState<RestoreExecutionReport | null>(null);
  const [restorePin, setRestorePin] = useState('');
  const [restorePinError, setRestorePinError] = useState('');

  const { addAsset, addPortfolio } = usePortfolioActions();

  if (!isOpen || !validationReport) return null;

  async function handleExecuteRestore() {
    if (!backupJSONText || !validationReport?.isValid) return;

    if (!restorePin) {
      setRestorePinError('Security PIN is required to authorize restore.');
      return;
    }
    setRestorePinError('');
    setIsRestoring(true);

    try {
      const isPinValid = await verifyPin(restorePin);
      if (!isPinValid) {
        setRestorePinError('Incorrect PIN. Authorization failed.');
        setIsRestoring(false);
        return;
      }

      const parsedData = JSON.parse(backupJSONText);
      const portfoliosToRestore: Portfolio[] = Array.isArray(parsedData)
        ? parsedData
        : Array.isArray(parsedData.portfolios)
        ? parsedData.portfolios
        : Array.isArray(parsedData.data?.portfolios)
        ? parsedData.data.portfolios
        : [];

      let createdAssets = 0;
      const errors: string[] = [];
      const restoredPortfolios: string[] = [];

      for (const p of portfoliosToRestore) {
        const pName = p.name || p.id;
        restoredPortfolios.push(pName);

        // 1. Ensure Portfolio exists or create it
        const exists = portfolios.some(ep => ep.name === pName);
        if (!exists && pName) {
          try {
            await addPortfolio(pName, p.label || pName);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (!msg.toLowerCase().includes('duplicate') && !msg.toLowerCase().includes('already exists')) {
              errors.push(`Portfolio '${pName}': ${msg}`);
            }
          }
        }

        // 2. Restore Stocks
        if (Array.isArray(p.holdings)) {
          for (const h of p.holdings) {
            try {
              const qty = Number(h.qty) || 0;
              const avgPrice = Number(h.avgPrice) || 0;
              await addAsset('stock', pName, {
                stockName: h.stockName || h.ticker,
                ticker: h.ticker,
                yahooSymbol: h.yahooSymbol || `${h.ticker}.NS`,
                qty,
                avgPrice,
                amountInvested: Number(h.amountInvested) || (qty * avgPrice),
                weekLow52: Number(h.weekLow52) || 0,
                weekHigh52: Number(h.weekHigh52) || 0,
              });
              createdAssets++;
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Failed';
              errors.push(`Stock ${h.ticker}: ${msg}`);
            }
          }
        }

        // 3. Restore Fixed Deposits
        if (Array.isArray(p.fixedDeposits)) {
          for (const fd of p.fixedDeposits) {
            try {
              await addAsset('fd', pName, {
                bank_name: fd.bank_name,
                principal_amount: Number(fd.principal_amount) || 0,
                interest_rate: Number(fd.interest_rate) || 0,
                start_date: fd.start_date,
                maturity_date: fd.maturity_date || null,
                maturity_amount: Number(fd.maturity_amount) || Number(fd.principal_amount) || 0,
                status: fd.status || 'active',
                notes: fd.notes,
              });
              createdAssets++;
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Failed';
              errors.push(`FD ${fd.bank_name}: ${msg}`);
            }
          }
        }

        // 4. Restore Gold Holdings
        if (Array.isArray(p.goldHoldings)) {
          for (const g of p.goldHoldings) {
            try {
              await addAsset('gold', pName, {
                item_name: g.item_name,
                purity: g.purity || '24K',
                weight_grams: Number(g.weight_grams) || 0,
                purchase_price: Number(g.purchase_price) || 0,
                current_valuation: Number(g.current_valuation) || Number(g.purchase_price) || 0,
                purchase_date: g.purchase_date,
                notes: g.notes,
              });
              createdAssets++;
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Failed';
              errors.push(`Gold ${g.item_name}: ${msg}`);
            }
          }
        }

        // 5. Restore Real Estate
        if (Array.isArray(p.realEstate)) {
          for (const re of p.realEstate) {
            try {
              await addAsset('real_estate', pName, {
                property_name: re.property_name,
                property_type: re.property_type || 'apartment',
                location: re.location,
                purchase_price: Number(re.purchase_price) || 0,
                current_valuation: Number(re.current_valuation) || Number(re.purchase_price) || 0,
                purchase_date: re.purchase_date,
                monthly_rent: Number(re.monthly_rent) || 0,
                notes: re.notes,
              });
              createdAssets++;
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Failed';
              errors.push(`Property ${re.property_name}: ${msg}`);
            }
          }
        }

        // 6. Restore Insurance
        if (Array.isArray(p.insurances)) {
          for (const ins of p.insurances) {
            try {
              await addAsset('insurance', pName, {
                policy_name: ins.policy_name,
                insurance_type: ins.insurance_type || 'life',
                provider: ins.provider || 'Provider',
                policy_number: ins.policy_number,
                sum_assured: Number(ins.sum_assured) || 0,
                premium_amount: Number(ins.premium_amount) || 0,
                renewal_date: ins.renewal_date,
                notes: ins.notes,
              });
              createdAssets++;
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Failed';
              errors.push(`Insurance ${ins.policy_name}: ${msg}`);
            }
          }
        }

        // 7. Restore Recurring Deposits
        if (Array.isArray(p.rdAccounts)) {
          for (const rd of p.rdAccounts) {
            try {
              await addAsset('rd', pName, {
                bank_name: rd.bank_name,
                monthly_deposit: Number(rd.monthly_deposit) || 0,
                interest_rate: Number(rd.interest_rate) || 0,
                start_date: rd.start_date,
                maturity_date: rd.maturity_date || '',
                maturity_amount: Number(rd.maturity_amount) || 0,
                status: rd.status || 'active',
                notes: rd.notes,
                contributions: Array.isArray(rd.contributions) ? rd.contributions : undefined,
              });
              createdAssets++;
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Failed';
              errors.push(`RD ${rd.bank_name}: ${msg}`);
            }
          }
        }

        // 8. Restore SIP Accounts
        if (Array.isArray(p.sipAccounts)) {
          for (const sip of p.sipAccounts) {
            const rawSip = sip as unknown as Record<string, unknown>;
            try {
              await addAsset('sip', pName, {
                fund_name: typeof rawSip.fund_name === 'string' ? rawSip.fund_name : '',
                monthly_sip: Number(rawSip.monthly_sip || rawSip.monthly_investment) || 0,
                units: Number(rawSip.units || rawSip.qty) || 0,
                start_date: typeof rawSip.start_date === 'string' ? rawSip.start_date : '',
                next_sip_date: typeof rawSip.next_sip_date === 'string' ? rawSip.next_sip_date : null,
                fallback_valuation: Number(rawSip.fallback_valuation) || 0,
                mf_scheme_code: (rawSip.mf_scheme_code || rawSip.scheme_code || rawSip.amfi_code) as string | undefined,
                expected_cagr: Number(rawSip.expected_cagr) || 12,
                notes: typeof rawSip.notes === 'string' ? rawSip.notes : undefined,
              });
              createdAssets++;
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Failed';
              errors.push(`SIP ${typeof rawSip.fund_name === 'string' ? rawSip.fund_name : 'Account'}: ${msg}`);
            }
          }
        }

        // 9. Restore Document Vault Metadata
        if (Array.isArray(p.documents)) {
          for (const doc of p.documents) {
            try {
              await addAsset('document', pName, {
                name: doc.name,
                filePath: doc.file_path,
                fileType: doc.file_type || 'other',
                expiryDate: doc.expiry_date || null,
                linkedAssetType: doc.asset_type || 'general',
                linkedAssetId: doc.asset_id || null,
              });
              createdAssets++;
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Failed';
              errors.push(`Document ${doc.name}: ${msg}`);
            }
          }
        }
      }

      setRestoreReport({
        timestamp: new Date().toISOString(),
        createdAssets,
        updatedAssets: 0,
        skippedDuplicates: 0,
        errors,
        restoredPortfolios,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Restore failed';
      if (onValidationReportUpdate) {
        onValidationReportUpdate({ ...validationReport, schemaErrors: [msg] });
      }
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isRestoring && onClose()}
      title="🛡️ Backup Restore & Schema Validation Preview"
      maxWidth="max-w-xl"
      preventClose={isRestoring}
    >
      <div className="p-5 space-y-4">
        {/* Status Header */}
        <div className={`p-3.5 rounded-[var(--radius-medium)] border flex items-start gap-3 ${
          validationReport.isValid
            ? 'bg-[var(--positive-soft)] border-[var(--positive)]/30 text-[var(--positive)]'
            : 'bg-[var(--negative-soft)] border-[var(--negative)]/30 text-[var(--negative)]'
        }`}>
          {validationReport.isValid ? <ShieldCheck size={20} className="shrink-0 text-[var(--positive)] mt-0.5" /> : <AlertCircle size={20} className="shrink-0 text-[var(--negative)] mt-0.5" />}
          <div className="min-w-0">
            <h4 className="font-bold text-xs">
              {validationReport.isValid ? 'Valid Backup Schema Verified' : 'Invalid Backup File'}
            </h4>
            <p className="text-[11px] mt-0.5 opacity-90">
              {validationReport.isValid
                ? `Contains ${validationReport.counts.totalAssets} records across ${validationReport.portfolioCount} family portfolios (${validationReport.portfolioNames.join(', ')}).`
                : 'The selected file contains errors and cannot be safely restored.'}
            </p>
            {validationReport.exportedAt && (
              <p className="text-[10px] mt-1 font-semibold opacity-75">
                Exported timestamp: {new Date(validationReport.exportedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Counts by Category */}
        {validationReport.isValid && (
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
              Asset Breakdown in Backup
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-[var(--surface-secondary)] rounded border border-[var(--border-subtle)]">
                <span className="font-bold text-[var(--text-primary)] block">{validationReport.counts.stocks}</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">Stocks</span>
              </div>
              <div className="p-2 bg-[var(--surface-secondary)] rounded border border-[var(--border-subtle)]">
                <span className="font-bold text-[var(--text-primary)] block">{validationReport.counts.fixedDeposits}</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">FDs</span>
              </div>
              <div className="p-2 bg-[var(--surface-secondary)] rounded border border-[var(--border-subtle)]">
                <span className="font-bold text-[var(--text-primary)] block">{validationReport.counts.goldHoldings}</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">Gold</span>
              </div>
              <div className="p-2 bg-[var(--surface-secondary)] rounded border border-[var(--border-subtle)]">
                <span className="font-bold text-[var(--text-primary)] block">{validationReport.counts.realEstate}</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">Real Estate</span>
              </div>
              <div className="p-2 bg-[var(--surface-secondary)] rounded border border-[var(--border-subtle)]">
                <span className="font-bold text-[var(--text-primary)] block">{validationReport.counts.insurances}</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">Insurance</span>
              </div>
              <div className="p-2 bg-[var(--surface-secondary)] rounded border border-[var(--border-subtle)]">
                <span className="font-bold text-[var(--text-primary)] block">{validationReport.counts.sipAccounts}</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">SIPs</span>
              </div>
              <div className="p-2 bg-[var(--surface-secondary)] rounded border border-[var(--border-subtle)]">
                <span className="font-bold text-[var(--text-primary)] block">{validationReport.counts.rdAccounts}</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">RDs</span>
              </div>
              <div className="p-2 bg-[var(--surface-secondary)] rounded border border-[var(--border-subtle)]">
                <span className="font-bold text-[var(--text-primary)] block">{validationReport.counts.documents}</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">Documents</span>
              </div>
            </div>
          </div>
        )}

        {/* Warnings / Duplicates */}
        {validationReport.warnings.length > 0 && (
          <div className="p-3 bg-[var(--warning-soft)] border border-[var(--warning)]/30 rounded-[var(--radius-medium)] text-xs text-[var(--warning)] space-y-1">
            <div className="font-bold flex items-center gap-1">
              <AlertTriangle size={14} className="text-[var(--warning)]" />
              <span>Dry-run Diagnostics:</span>
            </div>
            {validationReport.warnings.map((w, idx) => (
              <p key={idx} className="text-[11px] leading-relaxed pl-4">• {w}</p>
            ))}
          </div>
        )}

        {/* Post-Restore Report */}
        {restoreReport && (
          <div className="p-3.5 bg-[var(--positive-soft)] border border-[var(--positive)]/30 rounded-[var(--radius-medium)] text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-[var(--positive)]">
              <CheckCircle size={16} />
              <span>Restore Completed Successfully</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Restored {restoreReport.createdAssets} asset records into {restoreReport.restoredPortfolios.join(', ')}.
            </p>
            {restoreReport.errors.length > 0 && (
              <div className="text-[var(--negative)] text-[10px]">
                {restoreReport.errors.length} items encountered issues: {restoreReport.errors.slice(0, 3).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* PIN Authorization Step */}
        {validationReport.isValid && !restoreReport && (
          <div className="p-3.5 bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] space-y-2">
            <label className="block text-[11px] font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Key size={13} className="text-[var(--accent-blue)]" />
              Enter Security PIN to Authorize Database Restore
            </label>
            <input
              type="password"
              inputMode="numeric"
              placeholder="Enter PIN (e.g. 1234)"
              value={restorePin}
              onChange={(e) => {
                setRestorePin(e.target.value.replace(/\D/g, ''));
                setRestorePinError('');
              }}
              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-small)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]"
              maxLength={10}
            />
            {restorePinError && (
              <p className="text-[11px] text-[var(--negative)] font-semibold flex items-center gap-1">
                <AlertCircle size={13} /> {restorePinError}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <Button
            variant="secondary"
            disabled={isRestoring}
            onClick={onClose}
            className="flex-1 text-xs py-2"
          >
            {restoreReport ? 'Close' : 'Cancel'}
          </Button>
          {!restoreReport && (
            <Button
              variant="primary"
              disabled={isRestoring || !validationReport.isValid}
              onClick={handleExecuteRestore}
              className="flex-1 text-xs py-2 flex items-center justify-center gap-1.5"
            >
              {isRestoring ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={14} />}
              <span>{isRestoring ? 'Restoring Data...' : 'Confirm & Restore'}</span>
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
});

BackupRestoreModal.displayName = 'BackupRestoreModal';

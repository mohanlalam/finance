import React from 'react';
import { SSYAccount, DocumentMetadata, SSYPayload } from '../../types/portfolio';
import { formatINR, getDocumentUrl } from '../../utils/formatters';
import { getSSYEffectiveValue } from '../../utils/ssyUtils';
import { CheckCircle, FileText, Edit2, Trash2, Clock, AlertCircle, StickyNote, Heart } from 'lucide-react';
import SSYSchedule from './SSYSchedule';

interface SSYAccountCardProps {
  account: SSYAccount;
  documents: DocumentMetadata[];
  onOpenEdit: (account: SSYAccount) => void;
  onConfirmDelete: (account: SSYAccount) => void;
  onUpdate: (id: string, payload: Partial<SSYPayload>) => Promise<void>;
}

function calculateCurrentAge(dobString: string): number {
  const dob = new Date(dobString);
  const today = new Date();
  if (isNaN(dob.getTime())) return 0;
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function SSYAccountCard({
  account,
  documents,
  onOpenEdit,
  onConfirmDelete,
  onUpdate,
}: SSYAccountCardProps) {
  // Helper to compute progress bar percentage (21 years maturity)
  const getProgressPercent = (item: SSYAccount) => {
    if (item.status === 'matured') return 100;
    if (!item.maturity_date) return 100;
    const start = new Date(item.start_date).getTime();
    const end = new Date(item.maturity_date).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return ((now - start) / (end - start)) * 100;
  };

  const progress = getProgressPercent(account);
  // Match documents for ssy_account or ssy
  const ssyDocs = documents.filter(
    (d) => (d.asset_type === 'ssy') && d.asset_id === account.id
  );
  const isMatured = account.status === 'matured' || progress >= 100;

  return (
    <div className="glass-panel border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300" role="listitem">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isMatured
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400'
            }`}
          >
            {isMatured ? <CheckCircle size={20} aria-hidden="true" /> : <Heart size={20} aria-hidden="true" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{account.bank_name}</h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isMatured
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400'
                }`}
              >
                {isMatured ? 'Matured' : `${account.interest_rate}% p.a.`}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {account.start_date} &rarr; {account.maturity_date || 'Ongoing'}
            </p>
            {account.girl_dob && (
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
                <span>
                  Girl Child DOB: {account.girl_dob} (Current Age: {calculateCurrentAge(account.girl_dob)} years)
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:text-right">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Target Annual Deposit</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {formatINR(Number(account.annual_deposit))}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Current Valuation</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {formatINR(getSSYEffectiveValue(account))}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center justify-start md:justify-end gap-2">
            {ssyDocs.map((doc) => (
              <a
                key={doc.id}
                href={getDocumentUrl(doc.file_path)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                title={doc.name}
                aria-label={`Open document: ${doc.name}`}
              >
                <FileText size={14} aria-hidden="true" />
              </a>
            ))}
            <button
              onClick={() => onOpenEdit(account)}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
              title="Edit SSY Account"
              aria-label={`Edit SSY Account at ${account.bank_name}`}
            >
              <Edit2 size={14} aria-hidden="true" />
            </button>
            <button
              onClick={() => onConfirmDelete(account)}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
              title="Delete SSY Account"
              aria-label={`Delete SSY Account at ${account.bank_name}`}
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar / Ledger Schedule */}
      <div className="mt-4 space-y-4">
        {/* Maturity, remaining years, auto calculations stats */}
        {(() => {
          const parseISODateUTC = (value: string) => {
            const [year, month, day] = value.split('-').map(Number);
            if (!year || !month || !day) return null;
            return new Date(Date.UTC(year, month - 1, day));
          };

          const getFinancialYearStart = (date: Date) => {
            const year = date.getUTCMonth() >= 3 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
            return new Date(Date.UTC(year, 3, 1));
          };

          const startD = parseISODateUTC(account.start_date);
          const currentFYStart = getFinancialYearStart(new Date());
          const startFYStart = startD ? getFinancialYearStart(startD) : currentFYStart;
          const currentFY = currentFYStart.getUTCFullYear();
          const startFY = startFYStart.getUTCFullYear();
          const elapsedYears = Math.max(0, currentFY - startFY);
          const remainingYears = Math.max(0, 15 - elapsedYears);

          const heatmapData = Array.from({ length: 15 }).map((_, idx) => {
            const fyYear = startFY + idx;
            const fyStartDate = new Date(Date.UTC(fyYear, 3, 1));
            const fyEndDate = new Date(Date.UTC(fyYear + 1, 2, 31));
            
            const fyContributions = (account.contributions || []).filter((c) => {
              const d = parseISODateUTC(c.date);
              if (!d) return false;
              return d.getTime() >= fyStartDate.getTime() && d.getTime() <= fyEndDate.getTime();
            });
            const totalPaid = fyContributions.reduce((sum, c) => sum + c.amount, 0);

            const isFuture = fyStartDate.getTime() > Date.now();
            const isCompliant = totalPaid >= 250;
            const isUnderfunded = totalPaid > 0 && totalPaid < 250;
            const isMissed = !isFuture && totalPaid === 0;

            return {
              fy: `FY ${fyYear}-${String(fyYear + 1).slice(-2)}`,
              totalPaid,
              isFuture,
              isCompliant,
              isUnderfunded,
              isMissed,
            };
          });

          const missedYears = heatmapData.filter((h) => h.isMissed);

          return (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mb-1">
                  <span className="flex items-center gap-1">
                    <Clock size={10} aria-hidden="true" />
                    Maturity Timeline (21 Years)
                  </span>
                  <span>{account.maturity_date ? `${progress.toFixed(0)}% elapsed` : 'Ongoing accumulation'}</span>
                </div>
                {account.maturity_date && (
                  <div
                    className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Maturity timeline progress"
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isMatured ? 'bg-emerald-500' : 'bg-pink-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Missed Deposit Alert */}
              {missedYears.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 rounded-xl p-3 text-[11px] flex items-start gap-2 animate-stitch-fade">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    <strong>Missed Deposit Warning:</strong> No deposits recorded for {missedYears.map((h) => h.fy).join(', ')}. A penalty of ₹50 per missed year will apply to restore status.
                  </span>
                </div>
              )}

              {/* Remaining contribution & auto maturity calculator stats */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/40 rounded-xl p-3 text-xs">
                <div>
                  <p className="text-slate-400 dark:text-slate-500 text-[9px] uppercase tracking-wider">Remaining Deposit Years</p>
                  <p className="font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">{remainingYears} Years</p>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-slate-500 text-[9px] uppercase tracking-wider">Projected Maturity</p>
                  <p className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatINR(account.maturity_amount || 0)}</p>
                </div>
              </div>

              {/* FY heatmap */}
              <div className="space-y-1.5">
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  Annual Contribution Heatmap (15 Years)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {heatmapData.map((h, idx) => {
                    let colorClass = 'bg-slate-200 dark:bg-slate-700/50';
                    let titleText = `${h.fy}: Future Scheduled`;
                    if (h.isCompliant) {
                      colorClass = 'bg-emerald-500 shadow-[0_0_6px_#10B981]';
                      titleText = `${h.fy}: Compliant (Deposited ${formatINR(h.totalPaid)})`;
                    } else if (h.isUnderfunded) {
                      colorClass = 'bg-amber-500 shadow-[0_0_6px_#F59E0B]';
                      titleText = `${h.fy}: Under-funded (Deposited ${formatINR(h.totalPaid)} - Min ₹250)`;
                    } else if (h.isMissed) {
                      colorClass = 'bg-red-500 shadow-[0_0_6px_#EF4444]';
                      titleText = `${h.fy}: Missed (No deposits recorded)`;
                    }
                    return (
                      <div
                        key={idx}
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[7.5px] font-extrabold text-white cursor-help transition-all transform hover:scale-110 ${colorClass}`}
                        title={titleText}
                      >
                        {idx + 1}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {(Number(account.annual_deposit) < 250 || Number(account.annual_deposit) > 150000) && (
          <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-250/50 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 rounded-xl p-3 text-[11px] flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>
              SSY guidelines: Annual deposits must be between ₹250 and ₹1,50,000 per financial year. Adjust this
              account's annual contribution to conform.
            </span>
          </div>
        )}

        <SSYSchedule account={account} onUpdate={onUpdate} />

        {account.notes && (
          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-start gap-1.5">
            <StickyNote size={11} className="shrink-0 mt-0.5" />
            <span className="italic">{account.notes}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default React.memo(SSYAccountCard);

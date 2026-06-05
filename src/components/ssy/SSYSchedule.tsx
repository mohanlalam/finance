import React, { useState, useCallback } from 'react';
import { SSYAccount, SSYPayload } from '../../types/portfolio';
import { calculateSSYMaturityWithRates, SSY_HISTORICAL_RATES } from '../../utils/ssyUtils';
import { Edit2, Check, X, AlertTriangle } from 'lucide-react';

interface SSYScheduleProps {
  account: SSYAccount;
  onUpdate: (id: string, payload: Partial<SSYPayload>) => Promise<void>;
}

const SSY_MIN_FINANCIAL_YEAR_DEPOSIT = 250;
const SSY_MAX_FINANCIAL_YEAR_DEPOSIT = 150000;
const SSY_CONTRIBUTION_YEARS = 15;

function parseISODateUTC(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  return isNaN(date.getTime()) ? null : date;
}

function formatISODateUTC(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addYearsUTC(date: Date, years: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear() + years, date.getUTCMonth(), date.getUTCDate()));
}

function addDaysUTC(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

function getFinancialYearStartUTC(date: Date): Date {
  const year = date.getUTCMonth() >= 3 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
  return new Date(Date.UTC(year, 3, 1));
}

function formatFinancialYear(start: Date): string {
  return `FY ${start.getUTCFullYear()}-${String(start.getUTCFullYear() + 1).slice(-2)}`;
}



function getTodayUTCDate(): Date {
  const today = new Date();
  return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
}

function formatINRCompact(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const LAST_KNOWN_FY = Math.max(...Object.keys(SSY_HISTORICAL_RATES).map(Number));

export function SSYSchedule({ account, onUpdate }: SSYScheduleProps) {
  const [expanded, setExpanded] = useState(false);
  const [payingSlot, setPayingSlot] = useState<{ start: Date; end: Date; index: number } | null>(null);
  const [depositDate, setDepositDate] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [modalError, setModalError] = useState('');

  // Rate editing state
  const [editingRateFY, setEditingRateFY] = useState<number | null>(null);
  const [editRateValue, setEditRateValue] = useState('');
  const [savingRate, setSavingRate] = useState(false);

  const getSSYWindows = useCallback((startDateStr: string): { start: Date; end: Date; index: number }[] => {
    const accountStart = parseISODateUTC(startDateStr);
    if (!accountStart) return [];
    const contributionEnd = addDaysUTC(addYearsUTC(accountStart, SSY_CONTRIBUTION_YEARS), -1);

    const windows: { start: Date; end: Date; index: number }[] = [];
    let fyStart = getFinancialYearStartUTC(accountStart);
    let index = 0;

    while (fyStart.getTime() <= contributionEnd.getTime()) {
      const fyEnd = addDaysUTC(addYearsUTC(fyStart, 1), -1);
      const windowStart = new Date(Math.max(accountStart.getTime(), fyStart.getTime()));
      const windowEnd = new Date(Math.min(contributionEnd.getTime(), fyEnd.getTime()));
      windows.push({ start: windowStart, end: windowEnd, index });
      fyStart = addDaysUTC(fyEnd, 1);
      index++;
    }
    return windows;
  }, []);

  const getPaidContributionsForWindow = useCallback((
    wStart: Date,
    wEnd: Date,
    contributions?: { date: string; amount: number }[]
  ) => {
    if (!contributions) return [];
    return contributions.filter((c) => {
      const cDate = parseISODateUTC(c.date);
      if (!cDate) return false;
      return cDate.getTime() >= wStart.getTime() && cDate.getTime() <= wEnd.getTime();
    });
  }, []);

  const openPaymentModal = (win: { start: Date; end: Date; index: number }) => {
    setPayingSlot(win);
    const today = getTodayUTCDate();
    if (today.getTime() >= win.start.getTime() && today.getTime() <= win.end.getTime()) {
      setDepositDate(formatISODateUTC(today));
    } else {
      setDepositDate(formatISODateUTC(win.start));
    }

    const paidContribs = getPaidContributionsForWindow(win.start, win.end, account.contributions);
    const totalPaid = paidContribs.reduce((sum, c) => sum + c.amount, 0);
    const remaining = SSY_MAX_FINANCIAL_YEAR_DEPOSIT - totalPaid;
    const defaultAmount = Math.min(Number(account.annual_deposit || 150000), Math.max(0, remaining));
    setDepositAmount(defaultAmount.toString());
    setModalError('');
  };

  const handleRecordInstallment = async () => {
    if (!payingSlot) return;
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setModalError('Please enter a valid deposit amount.');
      return;
    }
    if (!depositDate) {
      setModalError('Please enter a valid deposit date.');
      return;
    }
    const depDate = parseISODateUTC(depositDate);
    if (!depDate) {
      setModalError('Please enter a valid deposit date.');
      return;
    }
    if (amt % 50 !== 0) {
      setModalError('SSY deposits must be in multiples of ₹50.');
      return;
    }

    const checkTime = depDate.getTime();
    if (checkTime < payingSlot.start.getTime() || checkTime > payingSlot.end.getTime()) {
      setModalError(`Deposit date must be within this SSY contribution window (${formatISODateUTC(payingSlot.start)} to ${formatISODateUTC(payingSlot.end)}).`);
      return;
    }

    const paidContribs = getPaidContributionsForWindow(payingSlot.start, payingSlot.end, account.contributions);
    const totalPaid = paidContribs.reduce((sum, c) => sum + c.amount, 0);

    if (totalPaid + amt > SSY_MAX_FINANCIAL_YEAR_DEPOSIT) {
      setModalError(
        `Total contributions for a financial year cannot exceed ₹1,50,000. Already paid: ₹${totalPaid.toLocaleString('en-IN')}. Remaining: ₹${(SSY_MAX_FINANCIAL_YEAR_DEPOSIT - totalPaid).toLocaleString('en-IN')}.`
      );
      return;
    }

    const existing = account.contributions || [];
    const updated = [...existing, { date: depositDate, amount: amt }].sort(
      (a, b) => (parseISODateUTC(a.date)?.getTime() ?? 0) - (parseISODateUTC(b.date)?.getTime() ?? 0)
    );

    const { maturityAmount } = calculateSSYMaturityWithRates(
      account.start_date,
      Number(account.annual_deposit || 150000),
      updated,
      account.rate_schedule,
      Number(account.interest_rate) > 0 ? Number(account.interest_rate) : 8.2
    );

    try {
      await onUpdate(account.id, { contributions: updated, maturity_amount: maturityAmount });
      setPayingSlot(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to record installment');
    }
  };

  const handleDeleteContribution = async (contribToDelete: { date: string; amount: number }) => {
    const existing = account.contributions || [];
    let found = false;
    const updated = existing.filter((c) => {
      if (!found && c.date === contribToDelete.date && c.amount === contribToDelete.amount) {
        found = true;
        return false;
      }
      return true;
    });

    const { maturityAmount } = calculateSSYMaturityWithRates(
      account.start_date,
      Number(account.annual_deposit || 150000),
      updated,
      account.rate_schedule,
      Number(account.interest_rate) > 0 ? Number(account.interest_rate) : 8.2
    );

    try {
      await onUpdate(account.id, { contributions: updated, maturity_amount: maturityAmount });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete contribution');
    }
  };

  // ── Rate editing ──
  const startEditRate = (fyStartYear: number, currentRate: number) => {
    setEditingRateFY(fyStartYear);
    setEditRateValue(currentRate.toString());
  };

  const cancelEditRate = () => {
    setEditingRateFY(null);
    setEditRateValue('');
  };

  const saveRateOverride = async (fyStartYear: number) => {
    const newRate = parseFloat(editRateValue);
    if (isNaN(newRate) || newRate <= 0 || newRate > 20) {
      alert('Please enter a valid rate between 0.01% and 20%.');
      return;
    }
    setSavingRate(true);
    const existing = account.rate_schedule || [];
    const updated = existing.filter((r) => r.fyStartYear !== fyStartYear);
    updated.push({ fyStartYear, rate: parseFloat(newRate.toFixed(2)) });

    const { maturityAmount } = calculateSSYMaturityWithRates(
      account.start_date,
      Number(account.annual_deposit),
      account.contributions,
      updated,
      Number(account.interest_rate) > 0 ? Number(account.interest_rate) : 8.2
    );

    try {
      await onUpdate(account.id, { rate_schedule: updated, maturity_amount: maturityAmount });
      setEditingRateFY(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save rate');
    } finally {
      setSavingRate(false);
    }
  };

  const removeRateOverride = async (fyStartYear: number) => {
    const existing = account.rate_schedule || [];
    const updated = existing.filter((r) => r.fyStartYear !== fyStartYear);

    const { maturityAmount } = calculateSSYMaturityWithRates(
      account.start_date,
      Number(account.annual_deposit),
      account.contributions,
      updated,
      Number(account.interest_rate) > 0 ? Number(account.interest_rate) : 8.2
    );

    try {
      await onUpdate(account.id, { rate_schedule: updated, maturity_amount: maturityAmount });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove rate override');
    }
  };

  const getContainerClassName = (totalPaid: number, isFuture: boolean): string => {
    if (totalPaid >= SSY_MIN_FINANCIAL_YEAR_DEPOSIT) {
      return 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.03] border-emerald-500/20 dark:border-emerald-500/10 hover:border-emerald-500/35 transition-all';
    }
    if (isFuture) {
      return 'bg-slate-500/[0.03] dark:bg-slate-500/[0.02] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all';
    }
    return 'bg-amber-500/[0.04] dark:bg-amber-500/[0.03] border-amber-500/20 dark:border-amber-500/10 hover:border-amber-500/35 transition-all';
  };

  const windows = getSSYWindows(account.start_date);
  const now = new Date();

  const { yearlyBreakdown } = calculateSSYMaturityWithRates(
    account.start_date,
    Number(account.annual_deposit),
    account.contributions,
    account.rate_schedule,
    Number(account.interest_rate) > 0 ? Number(account.interest_rate) : 8.2
  );

  return (
    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
      >
        {expanded ? '▲ Hide Deposit Schedule' : '▼ Show Annual Deposit Schedule'}
      </button>

      {expanded && (
        <div className="mt-3 space-y-4">

          {/* ─── Contribution Windows (FY ledger tiles) ─── */}
          <div>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-2">
              Financial Year Contribution Ledgers
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {windows.map((win) => {
                const paidContribs = getPaidContributionsForWindow(win.start, win.end, account.contributions);
                const totalPaid = paidContribs.reduce((sum, c) => sum + c.amount, 0);
                const label = formatFinancialYear(getFinancialYearStartUTC(win.start));
                const yearRange = `${formatISODateUTC(win.start)} to ${formatISODateUTC(win.end)}`;
                const isFuture = win.start.getTime() > now.getTime();
                const isCompliant = totalPaid >= SSY_MIN_FINANCIAL_YEAR_DEPOSIT;
                const isFullyPaid = totalPaid >= SSY_MAX_FINANCIAL_YEAR_DEPOSIT;
                const exceedsMax = totalPaid > SSY_MAX_FINANCIAL_YEAR_DEPOSIT;
                const fyYear = getFinancialYearStartUTC(win.start).getUTCFullYear();
                const override = account.rate_schedule?.find((r) => r.fyStartYear === fyYear);
                const fyRate = override?.rate ?? (SSY_HISTORICAL_RATES[fyYear] ?? (Number(account.interest_rate) || 8.2));

                return (
                  <div
                    key={win.index}
                    className={`rounded-xl border p-2 flex flex-col items-center justify-between text-center gap-1.5 transition-all ${getContainerClassName(totalPaid, isFuture)}`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold tracking-wide">{label}</span>
                      <span className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold">{yearRange}</span>
                      <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">{fyRate}% p.a.</span>
                    </div>
                    {exceedsMax && (
                      <span className="text-[8px] font-bold text-red-600 dark:text-red-400 flex items-center gap-0.5">
                        <AlertTriangle size={8} /> ₹{totalPaid.toLocaleString('en-IN')} (Over limit)
                      </span>
                    )}
                    {!exceedsMax && totalPaid > 0 ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${isFullyPaid ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/10' : 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/10'}`}>
                          ₹{totalPaid.toLocaleString('en-IN')}
                        </span>
                        {!isCompliant && (
                          <span className="text-[8px] font-semibold text-amber-600 dark:text-amber-400">Min ₹250</span>
                        )}
                        {!isFuture && (
                          <button type="button" onClick={() => openPaymentModal(win)} className="text-[9px] text-purple-600 dark:text-purple-400 hover:text-purple-700 font-bold transition-all">
                            Manage
                          </button>
                        )}
                      </div>
                    ) : isFuture ? (
                      <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-600 italic">Scheduled</span>
                    ) : (
                      !exceedsMax && (
                        <button type="button" onClick={() => openPaymentModal(win)} className="text-[9px] font-bold bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-lg transition-all active:scale-95 shadow-sm shadow-purple-500/15">
                          + Pay
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Year-by-Year Growth Table ─── */}
          {yearlyBreakdown.length > 0 && (
            <div>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-2">
                Year-by-Year Growth — click rate to edit future FY rates
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                      <th className="px-3 py-2 text-left font-bold">Financial Year</th>
                      <th className="px-3 py-2 text-right font-bold">Rate</th>
                      <th className="px-3 py-2 text-right font-bold">Deposit</th>
                      <th className="px-3 py-2 text-right font-bold">Interest</th>
                      <th className="px-3 py-2 text-right font-bold">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {yearlyBreakdown.map((row, idx) => {
                      const isContributionYear = idx < SSY_CONTRIBUTION_YEARS;
                      const isMaturityYear = idx === yearlyBreakdown.length - 1;
                      const isEditing = editingRateFY === row.fyStartYear;
                      const hasOverride = account.rate_schedule?.some((r) => r.fyStartYear === row.fyStartYear);
                      const canEditRate = row.fyStartYear > LAST_KNOWN_FY || hasOverride;

                      return (
                        <tr
                          key={row.fy}
                          className={`transition-colors ${
                            isMaturityYear
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 font-bold'
                              : isContributionYear
                              ? 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                              : 'bg-slate-50/30 dark:bg-slate-800/10 text-slate-400 dark:text-slate-500 hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                          }`}
                        >
                          <td className="px-3 py-1.5 text-left">
                            <span className="font-semibold">{row.fy}</span>
                            {isMaturityYear && (
                              <span className="ml-1 text-[8px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1 py-0.5 rounded-full font-bold">Maturity</span>
                            )}
                            {isContributionYear && !isMaturityYear && (
                              <span className="ml-1 text-[8px] text-purple-500 dark:text-purple-400">Yr {idx + 1}/15</span>
                            )}
                          </td>

                          {/* Rate cell — editable for future/overridden FYs */}
                          <td className="px-3 py-1.5 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="1"
                                  max="20"
                                  value={editRateValue}
                                  onChange={(e) => setEditRateValue(e.target.value)}
                                  className="w-14 text-right border border-purple-300 dark:border-purple-700 rounded-md px-1 py-0.5 text-[10px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-400"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  disabled={savingRate}
                                  onClick={() => void saveRateOverride(row.fyStartYear)}
                                  className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                                  title="Save"
                                >
                                  <Check size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditRate}
                                  className="text-slate-400 hover:text-slate-600"
                                  title="Cancel"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1 group">
                                <span className={`font-bold ${hasOverride ? 'text-amber-600 dark:text-amber-400' : 'text-purple-600 dark:text-purple-400'}`}>
                                  {row.interestRate}%
                                </span>
                                {hasOverride && (
                                  <button
                                    type="button"
                                    onClick={() => void removeRateOverride(row.fyStartYear)}
                                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove override"
                                  >
                                    <X size={9} />
                                  </button>
                                )}
                                {/* Show edit button for future FYs and history-overridden ones */}
                                {(canEditRate || row.isFuture) && (
                                  <button
                                    type="button"
                                    onClick={() => startEditRate(row.fyStartYear, row.interestRate)}
                                    className="text-slate-300 dark:text-slate-600 hover:text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Edit rate for this FY"
                                  >
                                    <Edit2 size={9} />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Deposit cell */}
                          <td className="px-3 py-1.5 text-right">
                            {row.depositCapped ? (
                              <span className="text-red-500 dark:text-red-400 font-semibold flex items-center justify-end gap-1">
                                <AlertTriangle size={9} />
                                {formatINRCompact(row.deposit)}
                                <span className="text-[8px] text-red-400">(capped)</span>
                              </span>
                            ) : row.deposit > 0 ? (
                              <span className={`font-semibold ${row.isFuture ? 'text-slate-400 dark:text-slate-500 italic' : 'text-blue-600 dark:text-blue-400'}`}>
                                {formatINRCompact(row.deposit)}
                                {row.isFuture && <span className="ml-0.5 text-[8px]">*</span>}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>

                          <td className="px-3 py-1.5 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                            {formatINRCompact(row.interestEarned)}
                          </td>
                          <td className="px-3 py-1.5 text-right font-bold text-slate-800 dark:text-slate-100">
                            {formatINRCompact(row.closingBalance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 italic leading-snug">
                * Projected using ₹{Number(account.annual_deposit).toLocaleString('en-IN')} target deposit.
                Historical rates used for past FYs (non-editable). Future FY rates use the default interest rate or your overrides.
                Hover a rate to edit it.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── Payment Modal ─── */}
      {payingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 shadow-xl" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPayingSlot(null)} />
          <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 border border-slate-200/50 dark:border-slate-800/50">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mb-1">
              Record SSY Deposit ({formatFinancialYear(getFinancialYearStartUTC(payingSlot.start))})
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">
              Window: {formatISODateUTC(payingSlot.start)} to {formatISODateUTC(payingSlot.end)}
            </p>
            {(() => {
              const fyYear = getFinancialYearStartUTC(payingSlot.start).getUTCFullYear();
              const override = account.rate_schedule?.find((r) => r.fyStartYear === fyYear);
              const rate = override?.rate ?? (SSY_HISTORICAL_RATES[fyYear] ?? (Number(account.interest_rate) || 8.2));
              return (
                <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mb-4">
                  Rate this FY: {rate}% p.a.
                </p>
              );
            })()}

            {/* Existing contributions for this window */}
            {(() => {
              const paidContribs = getPaidContributionsForWindow(payingSlot.start, payingSlot.end, account.contributions);
              const totalPaid = paidContribs.reduce((s, c) => s + c.amount, 0);
              if (paidContribs.length === 0) return null;

              const exceedsMax = totalPaid > SSY_MAX_FINANCIAL_YEAR_DEPOSIT;

              return (
                <div className="mb-4 space-y-1.5 max-h-36 overflow-y-auto border-b border-slate-100 dark:border-slate-700/50 pb-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Deposits recorded this year:</p>
                    <span className={`text-[9px] font-bold ${exceedsMax ? 'text-red-500' : 'text-slate-500'}`}>
                      Total: ₹{totalPaid.toLocaleString('en-IN')} / ₹1,50,000
                    </span>
                  </div>
                  {exceedsMax && (
                    <p className="text-[9px] text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg px-2 py-1 flex items-center gap-1">
                      <AlertTriangle size={9} />
                      Exceeds annual SSY limit! Delete duplicate entries below.
                    </p>
                  )}
                  {paidContribs.map((contrib, idx) => (
                    <div key={`${contrib.date}-${contrib.amount}-${idx}`} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-900/40 px-2.5 py-1 rounded-lg">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">{contrib.date}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          ₹{contrib.amount.toLocaleString('en-IN')}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleDeleteContribution(contrib)}
                          className="text-red-500 hover:text-red-700 text-sm font-bold w-4 h-4 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-950/20"
                          title="Delete this deposit"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="space-y-3">
              {/* Only show add form if there's room */}
              {(getPaidContributionsForWindow(payingSlot.start, payingSlot.end, account.contributions)
                .reduce((s, c) => s + c.amount, 0)) < SSY_MAX_FINANCIAL_YEAR_DEPOSIT && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Deposit Date</label>
                    <input
                      type="date"
                      value={depositDate}
                      min={formatISODateUTC(payingSlot.start)}
                      max={formatISODateUTC(payingSlot.end)}
                      onChange={(e) => setDepositDate(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Amount (₹) — multiples of ₹50, max ₹1,50,000/year
                    </label>
                    <input
                      type="number"
                      min="50"
                      step="50"
                      max={SSY_MAX_FINANCIAL_YEAR_DEPOSIT}
                      value={depositAmount}
                      placeholder="e.g. 10000"
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-colors"
                    />
                  </div>
                </>
              )}

              {modalError && (
                <p className="text-[10px] text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl px-2.5 py-1.5">
                  {modalError}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setPayingSlot(null)} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                  Close
                </button>
                {(getPaidContributionsForWindow(payingSlot.start, payingSlot.end, account.contributions)
                  .reduce((s, c) => s + c.amount, 0)) < SSY_MAX_FINANCIAL_YEAR_DEPOSIT && (
                  <button type="button" onClick={() => void handleRecordInstallment()} className="flex-1 bg-purple-600 text-white text-xs font-semibold rounded-xl py-2 hover:bg-purple-700 transition-all">
                    Save Deposit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(SSYSchedule);

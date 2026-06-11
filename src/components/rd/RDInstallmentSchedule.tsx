import React, { useState, useCallback } from 'react';
import { RDAccount } from '../../types/portfolio';
import { useToast } from '../../contexts/ToastContext';

interface RDInstallmentScheduleProps {
  account: RDAccount;
  onUpdate: (id: string, payload: { contributions: { date: string; amount: number }[] }) => Promise<void>;
}

export function RDInstallmentSchedule({ account, onUpdate }: RDInstallmentScheduleProps) {
  const { addToast } = useToast();
  const [expanded, setExpanded] = useState(false);

  // Helper for RD installment calculation
  const getRDInstallmentMonths = useCallback((startDateStr: string, maturityDateStr: string): Date[] => {
    const start = new Date(startDateStr);
    if (isNaN(start.getTime())) return [];
    
    const end = maturityDateStr ? new Date(maturityDateStr) : new Date();
    const limit = new Date();
    const actualEnd = end.getTime() < limit.getTime() ? end : limit;
    
    const months: Date[] = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endCompare = new Date(actualEnd.getFullYear(), actualEnd.getMonth(), 1);
    
    while (current.getTime() <= endCompare.getTime()) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  }, []);

  const isRDMonthPaid = useCallback((monthDate: Date, contributions?: { date: string; amount: number }[]): boolean => {
    if (!contributions) return false;
    const targetYear = monthDate.getFullYear();
    const targetMonth = monthDate.getMonth();
    
    return contributions.some((c) => {
      const cDate = new Date(c.date);
      return !isNaN(cDate.getTime()) && cDate.getFullYear() === targetYear && cDate.getMonth() === targetMonth;
    });
  }, []);

  const handleRecordInstallment = async (account: RDAccount, targetMonth: Date) => {
    const year = targetMonth.getFullYear();
    const month = String(targetMonth.getMonth() + 1).padStart(2, '0');
    const today = new Date();
    let dateStr = `${year}-${month}-01`;
    if (today.getFullYear() === year && today.getMonth() === targetMonth.getMonth()) {
      dateStr = today.toISOString().split('T')[0];
    }
    
    const existing = account.contributions || [];
    const updated = [...existing, { date: dateStr, amount: Number(account.monthly_deposit) }].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    try {
      await onUpdate(account.id, { contributions: updated });
      addToast('Installment recorded successfully', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to record installment', 'error');
    }
  };

  return (
    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[11px] font-bold text-pink-600 dark:text-pink-400 hover:underline"
      >
        {expanded ? 'Hide Installment Schedule' : 'Show Installment Schedule'}
      </button>
      
      {expanded && (
        <div className="mt-3 space-y-2">
          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
            Monthly Installments
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {getRDInstallmentMonths(account.start_date, account.maturity_date).map((monthDate, idx) => {
              const isPaid = isRDMonthPaid(monthDate, account.contributions);
              const label = monthDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
              
              const today = new Date();
              const currentYear = today.getFullYear();
              const currentMonth = today.getMonth();
              const targetYear = monthDate.getFullYear();
              const targetMonth = monthDate.getMonth();
              const isPastMonth = targetYear < currentYear || (targetYear === currentYear && targetMonth < currentMonth);

              let cardClasses = '';
              if (isPaid) {
                cardClasses = 'bg-emerald-50/30 border-emerald-200 dark:bg-emerald-950/10 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400';
              } else if (isPastMonth) {
                cardClasses = 'bg-rose-50/30 border-rose-200 dark:bg-rose-950/10 dark:border-rose-900/40 text-rose-800 dark:text-rose-400';
              } else {
                cardClasses = 'bg-amber-50/30 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/40 text-amber-800 dark:text-amber-400';
              }

              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-2 flex flex-col items-center justify-between text-center gap-1.5 transition-all ${cardClasses}`}
                >
                  <span className="text-[10px] font-bold tracking-wide">{label}</span>
                  {isPaid ? (
                    <span className="text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md">
                      ✓ Paid
                    </span>
                  ) : (
                    <div className="flex flex-col items-center gap-1 w-full">
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
                        isPastMonth
                          ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                          : 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                      }`}>
                        {isPastMonth ? 'Overdue' : 'Due'}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleRecordInstallment(account, monthDate)}
                        className={`text-[9px] font-extrabold text-white px-2 py-0.5 rounded-md transition-all active:scale-95 shadow-xs ${
                          isPastMonth
                            ? 'bg-rose-600 hover:bg-rose-700'
                            : 'bg-amber-600 hover:bg-amber-700'
                        }`}
                      >
                        + Pay
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(RDInstallmentSchedule);

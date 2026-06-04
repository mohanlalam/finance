import React, { useState, useCallback } from 'react';
import { FixedDeposit } from '../../types/portfolio';

interface RDInstallmentScheduleProps {
  fd: FixedDeposit;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (assetType: string, id: string, payload: any) => Promise<void>;
}

export function RDInstallmentSchedule({ fd, onUpdate }: RDInstallmentScheduleProps) {
  const [expanded, setExpanded] = useState(false);

  // Helper for RD installment calculation
  const getRDInstallmentMonths = useCallback((startDateStr: string, maturityDateStr: string | null): Date[] => {
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

  const handleRecordInstallment = async (fd: FixedDeposit, targetMonth: Date) => {
    const year = targetMonth.getFullYear();
    const month = String(targetMonth.getMonth() + 1).padStart(2, '0');
    const today = new Date();
    let dateStr = `${year}-${month}-01`;
    if (today.getFullYear() === year && today.getMonth() === targetMonth.getMonth()) {
      dateStr = today.toISOString().split('T')[0];
    }
    
    const existing = fd.contributions || [];
    const updated = [...existing, { date: dateStr, amount: fd.principal_amount }].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    try {
      await onUpdate('fd', fd.id, { contributions: updated });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to record installment');
    }
  };

  return (
    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        {expanded ? 'Hide Installment Schedule' : 'Show Installment Schedule'}
      </button>
      
      {expanded && (
        <div className="mt-3 space-y-2">
          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
            Monthly Installments
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {getRDInstallmentMonths(fd.start_date, fd.maturity_date).map((monthDate, idx) => {
              const isPaid = isRDMonthPaid(monthDate, fd.contributions);
              const label = monthDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-2 flex flex-col items-center justify-between text-center gap-1.5 transition-all ${
                    isPaid
                      ? 'bg-emerald-50/30 border-emerald-250 dark:bg-emerald-950/10 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400'
                      : 'bg-slate-50/50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-750 text-slate-500 dark:text-slate-450'
                  }`}
                >
                  <span className="text-[10px] font-bold tracking-wide">{label}</span>
                  {isPaid ? (
                    <span className="text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md">
                      ✓ Paid
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleRecordInstallment(fd, monthDate)}
                      className="text-[9px] font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-0.5 rounded-md transition-all active:scale-95 shadow-xs"
                    >
                      + Pay
                    </button>
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

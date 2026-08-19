import React, { useState, useCallback, useMemo } from 'react';
import { RDAccount } from '../../types/portfolio';
import { useToastActions } from '../../contexts/ToastContext';

interface RDInstallmentScheduleProps {
  account: RDAccount;
  onUpdate: (id: string, payload: { contributions: { date: string; amount: number }[] }) => Promise<void>;
}

export function RDInstallmentSchedule({ account, onUpdate }: RDInstallmentScheduleProps) {
  const { addToast } = useToastActions();
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

  const installmentMonths = useMemo(() => {
    return getRDInstallmentMonths(account.start_date, account.maturity_date);
  }, [getRDInstallmentMonths, account.start_date, account.maturity_date]);

  const paidMonthsSet = useMemo(() => {
    const set = new Set<string>();
    if (account.contributions) {
      account.contributions.forEach((c) => {
        const cDate = new Date(c.date);
        if (!isNaN(cDate.getTime())) {
          const year = cDate.getFullYear();
          const month = String(cDate.getMonth() + 1).padStart(2, '0');
          set.add(`${year}-${month}`);
        }
      });
    }
    return set;
  }, [account.contributions]);

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
    <div className="pt-2 border-t border-[var(--border-subtle)]">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[11px] font-bold text-[var(--accent-blue)] hover:underline ios-press"
      >
        {expanded ? 'Hide Installment Schedule' : 'Show Installment Schedule'}
      </button>
      
      {expanded && (
        <div className="mt-3 space-y-2">
          <p className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">
            Monthly Installments
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {installmentMonths.map((monthDate, idx) => {
              const year = monthDate.getFullYear();
              const month = String(monthDate.getMonth() + 1).padStart(2, '0');
              const monthKey = `${year}-${month}`;
              const isPaid = paidMonthsSet.has(monthKey);
              const label = monthDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
              
              const today = new Date();
              const currentYear = today.getFullYear();
              const currentMonth = today.getMonth();
              const targetYear = monthDate.getFullYear();
              const targetMonth = monthDate.getMonth();
              const isPastMonth = targetYear < currentYear || (targetYear === currentYear && targetMonth < currentMonth);

              let cardClasses = '';
              if (isPaid) {
                cardClasses = 'bg-[var(--positive-soft)] border-[var(--positive)]/30 text-[var(--positive)]';
              } else if (isPastMonth) {
                cardClasses = 'bg-[var(--negative-soft)] border-[var(--negative)]/30 text-[var(--negative)]';
              } else {
                cardClasses = 'bg-[var(--warning-soft)] border-[var(--warning)]/30 text-[var(--warning)]';
              }

              return (
                <div
                  key={idx}
                  className={`rounded-[var(--radius-medium)] border p-2 flex flex-col items-center justify-between text-center gap-1.5 transition-all ${cardClasses}`}
                >
                  <span className="text-[10px] font-bold tracking-wide">{label}</span>
                  {isPaid ? (
                    <span className="text-[9px] font-semibold bg-[var(--positive)]/20 px-1.5 py-0.5 rounded-[var(--radius-small)]">
                      ✓ Paid
                    </span>
                  ) : (
                    <div className="flex flex-col items-center gap-1 w-full">
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-[var(--radius-small)] ${
                        isPastMonth
                          ? 'bg-[var(--negative)]/20 text-[var(--negative)]'
                          : 'bg-[var(--warning)]/20 text-[var(--warning)]'
                      }`}>
                        {isPastMonth ? 'Overdue' : 'Due'}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleRecordInstallment(account, monthDate)}
                        className={`text-[9px] font-extrabold text-white px-2 py-0.5 rounded-[var(--radius-small)] transition-all ios-press shadow-xs ${
                          isPastMonth
                            ? 'bg-[var(--negative)] hover:opacity-90'
                            : 'bg-[var(--warning)] hover:opacity-90'
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

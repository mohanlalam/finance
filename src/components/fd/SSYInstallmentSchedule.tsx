import React, { useState, useCallback } from 'react';
import { FixedDeposit } from '../../types/portfolio';

interface SSYInstallmentScheduleProps {
  fd: FixedDeposit;
  onUpdate: (assetType: string, id: string, payload: unknown) => Promise<void>;
}

export function SSYInstallmentSchedule({ fd, onUpdate }: SSYInstallmentScheduleProps) {
  const [expanded, setExpanded] = useState(false);

  const getSSYWindows = useCallback((startDateStr: string): { start: Date; end: Date; index: number }[] => {
    const start = new Date(startDateStr);
    if (isNaN(start.getTime())) return [];
    
    const windows: { start: Date; end: Date; index: number }[] = [];
    for (let i = 0; i < 15; i++) {
      const wStart = new Date(start.getFullYear() + i, start.getMonth(), start.getDate());
      const wEnd = new Date(start.getFullYear() + i + 1, start.getMonth(), start.getDate());
      windows.push({ start: wStart, end: wEnd, index: i });
    }
    return windows;
  }, []);

  const getPaidContribution = useCallback((
    wStart: Date,
    wEnd: Date,
    contributions?: { date: string; amount: number }[]
  ) => {
    if (!contributions) return null;
    return contributions.find((c) => {
      const cDate = new Date(c.date);
      if (isNaN(cDate.getTime())) return false;
      return cDate.getTime() >= wStart.getTime() && cDate.getTime() < wEnd.getTime();
    }) || null;
  }, []);

  const handleRecordInstallment = async (fd: FixedDeposit, wStart: Date, wEnd: Date) => {
    const today = new Date();
    let dateStr = wStart.toISOString().split('T')[0];
    if (today.getTime() >= wStart.getTime() && today.getTime() < wEnd.getTime()) {
      dateStr = today.toISOString().split('T')[0];
    }
    
    const existing = fd.contributions || [];
    const updated = [...existing, { date: dateStr, amount: Number(fd.principal_amount) }].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    try {
      await onUpdate('fd', fd.id, { contributions: updated });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to record installment');
    }
  };

  const windows = getSSYWindows(fd.start_date);
  const now = new Date();

  return (
    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
      >
        {expanded ? 'Hide Deposit Schedule' : 'Show Annual Deposit Schedule'}
      </button>
      
      {expanded && (
        <div className="mt-3 space-y-2">
          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
            15-Year Contribution Ledgers
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {windows.map((win) => {
              const paidContrib = getPaidContribution(win.start, win.end, fd.contributions);
              const label = `Year ${win.index + 1}`;
              const yearRange = `${win.start.getFullYear()}-${String(win.end.getFullYear()).slice(-2)}`;
              const isFuture = win.start.getTime() > now.getTime();
              
              return (
                <div
                  key={win.index}
                  className={`rounded-xl border p-2 flex flex-col items-center justify-between text-center gap-1.5 transition-all ${
                    paidContrib
                      ? 'bg-emerald-50/30 border-emerald-250 dark:bg-emerald-950/10 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400'
                      : isFuture
                      ? 'bg-slate-50/30 border-dashed border-slate-200 dark:bg-slate-900/10 dark:border-slate-800 text-slate-400 dark:text-slate-650'
                      : 'bg-slate-50/50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-750 text-slate-500 dark:text-slate-450'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-wide">{label}</span>
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold">{yearRange}</span>
                  </div>
                  {paidContrib ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md">
                        ✓ Paid
                      </span>
                      <span className="text-[8px] opacity-70">{paidContrib.date}</span>
                    </div>
                  ) : isFuture ? (
                    <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-600 italic">
                      Scheduled
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleRecordInstallment(fd, win.start, win.end)}
                      className="text-[9px] font-extrabold bg-purple-600 hover:bg-purple-700 text-white px-2 py-0.5 rounded-md transition-all active:scale-95 shadow-xs"
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

export default React.memo(SSYInstallmentSchedule);

import React, { useState, useCallback } from 'react';
import { FixedDeposit } from '../../types/portfolio';

interface SSYInstallmentScheduleProps {
  fd: FixedDeposit;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (assetType: string, id: string, payload: any) => Promise<void>;
}

const SSY_MIN_FINANCIAL_YEAR_DEPOSIT = 250;
const SSY_MAX_FINANCIAL_YEAR_DEPOSIT = 150000;
const SSY_CONTRIBUTION_YEARS = 15;
const SSY_MATURITY_YEARS = 21;

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

/**
 * Recalculates the total cumulative investments and projected compounding maturity amount
 * based on active ledger histories using the standard SSY 21-year rules.
 */
function recalculateSSYMetrics(
  startDateStr: string,
  interestRate: number,
  contributions: { date: string; amount: number }[]
) {
  // 1. Calculate cumulative investments
  const totalInvested = contributions.reduce((sum, c) => sum + c.amount, 0);

  // 2. Compute true SSY compounding interest across the statutory 21-year timeline
  const accountStart = parseISODateUTC(startDateStr);
  if (!accountStart) return { totalInvested, maturityAmount: 0 };

  const rate = interestRate / 100;
  let runningBalance = 0;
  let currentFyStart = getFinancialYearStartUTC(accountStart);

  // Track compounding step-by-step for 21 consecutive financial years
  for (let yearIdx = 0; yearIdx < SSY_MATURITY_YEARS; yearIdx++) {
    const fyEnd = addDaysUTC(addYearsUTC(currentFyStart, 1), -1);

    // Filter contributions that occurred within this specific financial year window
    const fyContributions = contributions.filter((c) => {
      const cDate = parseISODateUTC(c.date);
      if (!cDate) return false;
      return cDate.getTime() >= currentFyStart.getTime() && cDate.getTime() <= fyEnd.getTime();
    });

    const annualDeposit = fyContributions.reduce((sum, c) => sum + c.amount, 0);

    // Apply deposits (only valid during active contribution years context)
    if (yearIdx < SSY_CONTRIBUTION_YEARS) {
      runningBalance += annualDeposit;
    }

    // SSY interest compounds at the end of every financial year
    runningBalance = runningBalance * (1 + rate);

    // Increment financial year cursor
    currentFyStart = addDaysUTC(fyEnd, 1);
  }

  return {
    totalInvested,
    maturityAmount: parseFloat(runningBalance.toFixed(2)),
  };
}

export function SSYInstallmentSchedule({ fd, onUpdate }: SSYInstallmentScheduleProps) {
  const [expanded, setExpanded] = useState(false);
  const [payingSlot, setPayingSlot] = useState<{ start: Date; end: Date; index: number } | null>(null);
  const [depositDate, setDepositDate] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [modalError, setModalError] = useState('');

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

    const paidContribs = getPaidContributionsForWindow(win.start, win.end, fd.contributions);
    const totalPaid = paidContribs.reduce((sum, c) => sum + c.amount, 0);
    const remaining = SSY_MAX_FINANCIAL_YEAR_DEPOSIT - totalPaid;
    // Default to configuration principal value capped at maximum remaining headroom
    const defaultAmount = Math.min(Number(fd.principal_amount || 150000), remaining);
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
      setModalError('SSY deposits must be in multiples of Rs. 50.');
      return;
    }

    const checkTime = depDate.getTime();
    const startCheck = payingSlot.start.getTime();
    const endCheck = payingSlot.end.getTime();

    if (checkTime < startCheck || checkTime > endCheck) {
      const startStr = formatISODateUTC(payingSlot.start);
      const endStr = formatISODateUTC(payingSlot.end);
      setModalError(`Deposit date must be within this SSY contribution window (${startStr} to ${endStr}).`);
      return;
    }

    const paidContribs = getPaidContributionsForWindow(payingSlot.start, payingSlot.end, fd.contributions);
    const totalPaid = paidContribs.reduce((sum, c) => sum + c.amount, 0);

    if (totalPaid + amt > SSY_MAX_FINANCIAL_YEAR_DEPOSIT) {
      setModalError(
        `Total contributions for a financial year cannot exceed ₹1,50,000. Currently paid: ₹${totalPaid.toLocaleString(
          'en-IN'
        )}. Max remaining: ₹${(SSY_MAX_FINANCIAL_YEAR_DEPOSIT - totalPaid).toLocaleString('en-IN')}.`
      );
      return;
    }

    const existing = fd.contributions || [];
    const updated = [...existing, { date: depositDate, amount: amt }].sort(
      (a, b) => (parseISODateUTC(a.date)?.getTime() ?? 0) - (parseISODateUTC(b.date)?.getTime() ?? 0)
    );

    // Dynamically recalculate master properties to fix dashboard metrics components out of sync
    const metrics = recalculateSSYMetrics(fd.start_date, Number(fd.interest_rate || 8.2), updated);

    try {
      await onUpdate('fd', fd.id, {
        contributions: updated,
        // Syncs the Dashboard "TOTAL SSY INVESTED" card
        principal_amount: metrics.totalInvested,
        // Syncs the Dashboard "EST. MATURITY VALUE" card
        maturity_amount: metrics.maturityAmount,
        estMaturityAmount: metrics.maturityAmount
      });
      setPayingSlot(null);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to record installment');
    }
  };

  const handleDeleteContribution = async (contribToDelete: { date: string; amount: number }) => {
    const existing = fd.contributions || [];
    let found = false;
    const updated = existing.filter((c) => {
      if (!found && c.date === contribToDelete.date && c.amount === contribToDelete.amount) {
        found = true;
        return false;
      }
      return true;
    });

    const metrics = recalculateSSYMetrics(fd.start_date, Number(fd.interest_rate || 8.2), updated);

    try {
      await onUpdate('fd', fd.id, {
        contributions: updated,
        principal_amount: metrics.totalInvested,
        maturity_amount: metrics.maturityAmount,
        estMaturityAmount: metrics.maturityAmount
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete contribution');
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

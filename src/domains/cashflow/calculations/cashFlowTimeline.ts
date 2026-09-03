/**
 * cashFlowTimeline.ts — 12-Month Predictive Cash Flow Horizon Calculator
 *
 * Aggregates forward-looking monthly cash inflows and outflows across family portfolios:
 * - Inflows (+): Fixed Deposit maturities, Recurring Deposit payouts, SGB 2.5% semi-annual coupons, Real Estate rent
 * - Outflows (-): Monthly active SIP debits, RD monthly installments, Term/Health insurance premiums
 *
 * Pure function with zero DOM, React, or Supabase dependencies.
 */

import { Portfolio } from '../../../types/portfolio';

export type CashFlowCategory =
  | 'fd_maturity'
  | 'rd_maturity'
  | 'sgb_coupon'
  | 'rental_income'
  | 'sip_outflow'
  | 'rd_outflow'
  | 'insurance_premium';

export interface CashFlowEvent {
  id: string;
  date: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
  type: 'inflow' | 'outflow';
  category: CashFlowCategory;
  categoryLabel: string;
  title: string;
  subtitle: string;
  amount: number;
  portfolioName: string;
}

export interface MonthCashFlow {
  monthKey: string; // YYYY-MM
  monthLabel: string; // e.g. "Sep 2026"
  inflows: number;
  outflows: number;
  netDelta: number;
  cumulativeLiquidity: number;
  events: CashFlowEvent[];
}

export interface MemberCashFlowSummary {
  name: string;
  label: string;
  totalInflow: number;
  totalOutflow: number;
  netDelta: number;
  eventCount: number;
}

export interface CashFlowTimelineResult {
  months: MonthCashFlow[];
  totalInflow12M: number;
  totalOutflow12M: number;
  netCashFlow12M: number;
  reinvestmentPool12M: number;
  memberBreakdown: MemberCashFlowSummary[];
  upcomingEvents: CashFlowEvent[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMonthKey(year: number, monthZeroIndexed: number): string {
  const m = (monthZeroIndexed + 1).toString().padStart(2, '0');
  return `${year}-${m}`;
}

function formatMonthLabel(year: number, monthZeroIndexed: number): string {
  return `${MONTH_NAMES[monthZeroIndexed]} ${year}`;
}

function parseYearMonth(dateStr?: string | null): { year: number; monthZeroIndexed: number; day: number } | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length < 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return { year: y, monthZeroIndexed: m, day: d };
}

/**
 * Calculates a predictive 12-month forward cash flow horizon across all family portfolios.
 */
export function calculateCashFlowTimeline(
  portfolios: Portfolio[],
  referenceDate: Date = new Date()
): CashFlowTimelineResult {
  const events: CashFlowEvent[] = [];

  // Generate the 12 forward month keys starting from referenceDate
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  const monthKeys: { key: string; label: string; year: number; month: number }[] = [];
  const monthMap = new Map<string, CashFlowEvent[]>();

  for (let i = 0; i < 12; i++) {
    const targetDate = new Date(currentYear, currentMonth + i, 1);
    const y = targetDate.getFullYear();
    const m = targetDate.getMonth();
    const key = formatMonthKey(y, m);
    const label = formatMonthLabel(y, m);
    monthKeys.push({ key, label, year: y, month: m });
    monthMap.set(key, []);
  }

  const startMonthKey = monthKeys[0].key;
  const endMonthKey = monthKeys[11].key;

  // Process all portfolios
  for (const p of portfolios) {
    const pName = p.name;

    // 1. Fixed Deposits (Maturity Inflows)
    for (const fd of p.fixedDeposits || []) {
      if (fd.status === 'active' && fd.maturity_date) {
        const parsed = parseYearMonth(fd.maturity_date);
        if (parsed) {
          const mKey = formatMonthKey(parsed.year, parsed.monthZeroIndexed);
          if (mKey >= startMonthKey && mKey <= endMonthKey) {
            const amount = fd.maturity_amount || fd.principal_amount || 0;
            events.push({
              id: `fd_${fd.id}`,
              date: fd.maturity_date,
              monthKey: mKey,
              type: 'inflow',
              category: 'fd_maturity',
              categoryLabel: 'FD Maturity',
              title: `${fd.bank_name || 'Bank'} Fixed Deposit`,
              subtitle: `Maturing @ ${fd.interest_rate}% p.a.`,
              amount,
              portfolioName: pName,
            });
          }
        }
      }
    }

    // 2. Recurring Deposits (Monthly Outflows & Maturity Inflow)
    for (const rd of p.rdAccounts || []) {
      if (rd.status === 'active') {
        const depositDay = 5;
        const parsedMaturity = parseYearMonth(rd.maturity_date);
        const maturityMonthKey = parsedMaturity ? formatMonthKey(parsedMaturity.year, parsedMaturity.monthZeroIndexed) : null;

        // Maturity payout inflow
        if (rd.maturity_date && maturityMonthKey && maturityMonthKey >= startMonthKey && maturityMonthKey <= endMonthKey) {
          events.push({
            id: `rd_mat_${rd.id}`,
            date: rd.maturity_date,
            monthKey: maturityMonthKey,
            type: 'inflow',
            category: 'rd_maturity',
            categoryLabel: 'RD Maturity',
            title: `${rd.bank_name || 'Bank'} Recurring Deposit`,
            subtitle: 'Maturity completion payout',
            amount: rd.maturity_amount || 0,
            portfolioName: pName,
          });
        }

        // Monthly installment outflows up to maturity
        for (const mk of monthKeys) {
          if (!maturityMonthKey || mk.key <= maturityMonthKey) {
            const dayStr = depositDay.toString().padStart(2, '0');
            events.push({
              id: `rd_out_${rd.id}_${mk.key}`,
              date: `${mk.key}-${dayStr}`,
              monthKey: mk.key,
              type: 'outflow',
              category: 'rd_outflow',
              categoryLabel: 'RD Installment',
              title: `${rd.bank_name || 'Bank'} Monthly RD`,
              subtitle: 'Mandatory recurring savings',
              amount: rd.monthly_deposit || 0,
              portfolioName: pName,
            });
          }
        }
      }
    }

    // 3. Mutual Fund SIPs (Monthly Inflow Outflows)
    for (const sip of p.sipAccounts || []) {
      if (sip.monthly_sip > 0) {
        let sipDay = 10;
        if (sip.next_sip_date) {
          const parsed = parseYearMonth(sip.next_sip_date);
          if (parsed) sipDay = parsed.day;
        }
        const dayStr = sipDay.toString().padStart(2, '0');
        for (const mk of monthKeys) {
          events.push({
            id: `sip_out_${sip.id}_${mk.key}`,
            date: `${mk.key}-${dayStr}`,
            monthKey: mk.key,
            type: 'outflow',
            category: 'sip_outflow',
            categoryLabel: 'Mutual Fund SIP',
            title: sip.fund_name,
            subtitle: `Monthly Systematic Investment`,
            amount: sip.monthly_sip,
            portfolioName: pName,
          });
        }
      }
    }

    // 4. SGB Gold Bonds (2.5% Semi-Annual Interest Coupon Inflows)
    for (const gold of p.goldHoldings || []) {
      const isSgb = gold.purity?.toLowerCase() === 'sgb' || gold.item_name?.toLowerCase().includes('sgb');
      if (isSgb) {
        const parsedPurchase = parseYearMonth(gold.purchase_date);
        const purchaseRate = gold.purchase_price && gold.weight_grams ? gold.purchase_price / gold.weight_grams : 5000;
        const semiAnnualCoupon = gold.weight_grams * purchaseRate * (0.025 / 2);

        if (parsedPurchase && semiAnnualCoupon > 0) {
          const couponMonth1 = parsedPurchase.monthZeroIndexed;
          const couponMonth2 = (couponMonth1 + 6) % 12;
          const couponDay = parsedPurchase.day.toString().padStart(2, '0');

          for (const mk of monthKeys) {
            if (mk.month === couponMonth1 || mk.month === couponMonth2) {
              events.push({
                id: `sgb_coupon_${gold.id}_${mk.key}`,
                date: `${mk.key}-${couponDay}`,
                monthKey: mk.key,
                type: 'inflow',
                category: 'sgb_coupon',
                categoryLabel: 'SGB Semi-Annual Coupon',
                title: gold.item_name || 'Sovereign Gold Bond',
                subtitle: 'Govt of India 2.5% p.a. Semi-Annual Interest',
                amount: Math.round(semiAnnualCoupon),
                portfolioName: pName,
              });
            }
          }
        }
      }
    }

    // 5. Real Estate Rental Income (Monthly Inflows)
    for (const prop of p.realEstate || []) {
      if (prop.monthly_rent && prop.monthly_rent > 0) {
        for (const mk of monthKeys) {
          events.push({
            id: `rent_${prop.id}_${mk.key}`,
            date: `${mk.key}-01`,
            monthKey: mk.key,
            type: 'inflow',
            category: 'rental_income',
            categoryLabel: 'Rental Yield',
            title: prop.property_name,
            subtitle: `${prop.location || 'Real Estate'} • Rental Inflow`,
            amount: prop.monthly_rent,
            portfolioName: pName,
          });
        }
      }
    }

    // 6. Insurance Premiums (Annual Renewal Outflows)
    for (const ins of p.insurances || []) {
      if (ins.premium_amount && ins.premium_amount > 0 && ins.renewal_date) {
        const parsed = parseYearMonth(ins.renewal_date);
        if (parsed) {
          // Annual policy renewal recurs on that month
          const targetRenewalMonth = parsed.monthZeroIndexed;
          const renewalDay = parsed.day.toString().padStart(2, '0');

          for (const mk of monthKeys) {
            if (mk.month === targetRenewalMonth) {
              events.push({
                id: `ins_out_${ins.id}_${mk.key}`,
                date: `${mk.key}-${renewalDay}`,
                monthKey: mk.key,
                type: 'outflow',
                category: 'insurance_premium',
                categoryLabel: 'Insurance Premium',
                title: ins.policy_name,
                subtitle: `${ins.provider} • Annual Renewal`,
                amount: ins.premium_amount,
                portfolioName: pName,
              });
            }
          }
        }
      }
    }
  }

  // Sort events by date
  events.sort((a, b) => a.date.localeCompare(b.date));

  // Populate monthMap
  for (const ev of events) {
    const list = monthMap.get(ev.monthKey);
    if (list) {
      list.push(ev);
    }
  }

  // Build MonthCashFlow objects
  let cumulative = 0;
  let totalInflow12M = 0;
  let totalOutflow12M = 0;
  let reinvestmentPool12M = 0;

  const months: MonthCashFlow[] = monthKeys.map((mk) => {
    const evs = monthMap.get(mk.key) || [];
    let inflows = 0;
    let outflows = 0;

    for (const e of evs) {
      if (e.type === 'inflow') {
        inflows += e.amount;
        if (e.category === 'fd_maturity' || e.category === 'rd_maturity') {
          reinvestmentPool12M += e.amount;
        }
      } else {
        outflows += e.amount;
      }
    }

    totalInflow12M += inflows;
    totalOutflow12M += outflows;
    const netDelta = inflows - outflows;
    cumulative += netDelta;

    return {
      monthKey: mk.key,
      monthLabel: mk.label,
      inflows,
      outflows,
      netDelta,
      cumulativeLiquidity: cumulative,
      events: evs,
    };
  });

  // Calculate Family Member Breakdowns
  const memberMap = new Map<string, MemberCashFlowSummary>();
  for (const p of portfolios) {
    memberMap.set(p.name, {
      name: p.name,
      label: p.label,
      totalInflow: 0,
      totalOutflow: 0,
      netDelta: 0,
      eventCount: 0,
    });
  }

  for (const ev of events) {
    const m = memberMap.get(ev.portfolioName);
    if (m) {
      m.eventCount += 1;
      if (ev.type === 'inflow') {
        m.totalInflow += ev.amount;
      } else {
        m.totalOutflow += ev.amount;
      }
      m.netDelta = m.totalInflow - m.totalOutflow;
    }
  }

  const memberBreakdown = Array.from(memberMap.values());

  return {
    months,
    totalInflow12M,
    totalOutflow12M,
    netCashFlow12M: totalInflow12M - totalOutflow12M,
    reinvestmentPool12M,
    memberBreakdown,
    upcomingEvents: events,
  };
}

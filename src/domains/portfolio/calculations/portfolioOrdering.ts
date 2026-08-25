import { Portfolio } from '../../../types/portfolio';

const PORTFOLIO_ORDER_PRIORITY: Record<string, number> = {
  rammohan: 0,
  ram_mohan: 0,
  ram: 0,
  personal: 0,
  self: 0,
  me: 0,
  padmavathi: 1,
  mother: 1,
  sai_laxmi: 2,
  sailaxmi: 2,
  sai: 2,
  wife: 2,
};

/**
 * Normalizes a string by stripping punctuation and casing.
 */
function normalizeKey(str?: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Determines portfolio rank based on predefined family priority.
 * Guaranteed: Rammohan is ALWAYS 1st.
 */
export function getPortfolioPriority(portfolio: Pick<Portfolio, 'name' | 'label'>): number {
  const nameKey = normalizeKey(portfolio.name);
  const labelKey = normalizeKey(portfolio.label);

  if (nameKey.includes('rammohan') || labelKey.includes('rammohan')) {
    return 0;
  }
  if (PORTFOLIO_ORDER_PRIORITY[nameKey] !== undefined) {
    return PORTFOLIO_ORDER_PRIORITY[nameKey];
  }
  if (PORTFOLIO_ORDER_PRIORITY[labelKey] !== undefined) {
    return PORTFOLIO_ORDER_PRIORITY[labelKey];
  }

  return 99;
}

/**
 * Sorts portfolios canonically across the entire app.
 * Always places Rammohan first, followed by Padmavathi, Sai Laxmi, and other family members.
 */
export function sortPortfolios(portfolios: Portfolio[]): Portfolio[] {
  if (!portfolios || portfolios.length <= 1) return portfolios || [];

  return [...portfolios].sort((a, b) => {
    const aPriority = getPortfolioPriority(a);
    const bPriority = getPortfolioPriority(b);

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    return (a.label || a.name || '').localeCompare(b.label || b.name || '');
  });
}

import { getFinancialYear } from './financialYear';

export interface CapitalGainsRates {
  equitySTCG: number; // 20% (post-July 2024) or 15% (pre-July 2024)
  equityLTCG: number; // 12.5% (post-July 2024) or 10% (pre-July 2024)
  ltcgExemption: number; // ₹1,25,000 or ₹1,00,000
}

/**
 * Pre-Budget 2024 rates (applicable up to FY 2023-24):
 * Equity STCG: 15%, Equity LTCG: 10%, Exemption: ₹1,00,000
 */
export const INDIAN_TAX_RATES_PRE_2024: CapitalGainsRates = {
  equitySTCG: 0.15,
  equityLTCG: 0.10,
  ltcgExemption: 100000,
};

/**
 * Finance Act (No. 2) 2024 rates (applicable from July 23, 2024 / FY 2024-25 onwards):
 * Equity STCG: 20%, Equity LTCG: 12.5%, Exemption: ₹1,25,000
 */
export const INDIAN_TAX_RATES_2024: CapitalGainsRates = {
  equitySTCG: 0.20,
  equityLTCG: 0.125,
  ltcgExemption: 125000,
};

/**
 * Returns the statutory capital gains rates for a given fiscal year string (e.g. "FY 2023-24", "FY 2024-25").
 */
export function getTaxRatesForFY(fyString?: string): CapitalGainsRates {
  if (!fyString) return INDIAN_TAX_RATES_2024;
  const match = fyString.match(/(\d{4})/);
  if (match) {
    const startYear = parseInt(match[1], 10);
    if (startYear < 2024) {
      return INDIAN_TAX_RATES_PRE_2024;
    }
  }
  return INDIAN_TAX_RATES_2024;
}

/**
 * Returns the statutory capital gains rates for a given transaction date.
 */
export function getTaxRatesForDate(date: Date = new Date()): CapitalGainsRates {
  const budgetCutoff = new Date(2024, 6, 23); // July 23, 2024
  if (date.getTime() < budgetCutoff.getTime()) {
    return INDIAN_TAX_RATES_PRE_2024;
  }
  const fyInfo = getFinancialYear(date);
  return getTaxRatesForFY(fyInfo.financialYear);
}

export function calculateEquityCapitalGainsTax(
  stcgGross: number,
  ltcgGross: number,
  rates: CapitalGainsRates = INDIAN_TAX_RATES_2024
): { stcgTax: number; ltcgTax: number; taxableLtcg: number; totalTax: number } {
  const stcgTax = Math.max(0, stcgGross) * rates.equitySTCG;
  const taxableLtcg = Math.max(0, Math.max(0, ltcgGross) - rates.ltcgExemption);
  const ltcgTax = taxableLtcg * rates.equityLTCG;
  const totalTax = stcgTax + ltcgTax;

  return { stcgTax, ltcgTax, taxableLtcg, totalTax };
}

export interface CapitalGainsRates {
  equitySTCG: number; // 20%
  equityLTCG: number; // 12.5%
  ltcgExemption: number; // ₹1,25,000
}

export const INDIAN_TAX_RATES_2024: CapitalGainsRates = {
  equitySTCG: 0.20,
  equityLTCG: 0.125,
  ltcgExemption: 125000,
};

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

import { RealEstate } from '../../../../types/portfolio';

export interface RealEstateTotals {
  totalInvested: number;
  totalValuation: number;
  totalPnL: number;
  totalPnLPct: number;
  totalAnnualRent: number;
  overallRentalYieldPct: number;
}

/**
 * Calculates purchase/invested amount for a real estate property.
 */
export function calculateRealEstateInvested(property: RealEstate): number {
  if (!property) return 0;
  const price = Number(property.purchase_price);
  return !isNaN(price) && price > 0 ? price : 0;
}

/**
 * Calculates current market valuation for a real estate property.
 * Falls back to purchase price if valuation is not explicitly set.
 */
export function calculateRealEstateValuation(property: RealEstate): number {
  if (!property) return 0;
  const val = Number(property.current_valuation);
  if (!isNaN(val) && val > 0) return val;
  const purchase = Number(property.purchase_price);
  return !isNaN(purchase) && purchase > 0 ? purchase : 0;
}

/**
 * Calculates P&L and P&L percentage for a real estate property.
 */
export function calculateRealEstatePnL(property: RealEstate): { pnl: number; pnlPct: number } {
  const invested = calculateRealEstateInvested(property);
  const current = calculateRealEstateValuation(property);
  const pnl = current - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
  return { pnl, pnlPct };
}

/**
 * Calculates annual rental yield percentage for a real estate property.
 * Formula: (Monthly Rent * 12 / Purchase Price) * 100
 */
export function calculateRentalYield(property: RealEstate): number {
  if (!property) return 0;
  const rent = Number(property.monthly_rent);
  const purchase = calculateRealEstateInvested(property);
  if (isNaN(rent) || rent <= 0 || purchase <= 0) return 0;
  return (rent * 12 / purchase) * 100;
}

/**
 * Calculates aggregated totals across a list of real estate properties.
 */
export function calculateRealEstateTotals(properties: RealEstate[]): RealEstateTotals {
  if (!Array.isArray(properties) || properties.length === 0) {
    return {
      totalInvested: 0,
      totalValuation: 0,
      totalPnL: 0,
      totalPnLPct: 0,
      totalAnnualRent: 0,
      overallRentalYieldPct: 0,
    };
  }

  let totalInvested = 0;
  let totalValuation = 0;
  let totalAnnualRent = 0;

  for (const p of properties) {
    const inv = calculateRealEstateInvested(p);
    const val = calculateRealEstateValuation(p);
    const rent = Number(p.monthly_rent);

    totalInvested += inv;
    totalValuation += val;
    if (!isNaN(rent) && rent > 0) {
      totalAnnualRent += rent * 12;
    }
  }

  const totalPnL = totalValuation - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const overallRentalYieldPct = totalInvested > 0 ? (totalAnnualRent / totalInvested) * 100 : 0;

  return {
    totalInvested,
    totalValuation,
    totalPnL,
    totalPnLPct,
    totalAnnualRent,
    overallRentalYieldPct,
  };
}

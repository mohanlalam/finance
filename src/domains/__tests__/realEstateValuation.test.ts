import { describe, it, expect } from 'vitest';
import {
  calculateRealEstateInvested,
  calculateRealEstateValuation,
  calculateRealEstatePnL,
  calculateRentalYield,
  calculateRealEstateTotals,
} from '../assets/real-estate/calculations/realEstateValuation';
import { RealEstate } from '../../types/portfolio';

const mockProperties: RealEstate[] = [
  {
    id: 'prop-1',
    portfolio_id: 'p-1',
    property_name: 'Green Villa',
    property_type: 'house',
    location: 'Bangalore',
    purchase_price: 5000000,
    current_valuation: 7500000,
    monthly_rent: 25000,
  },
  {
    id: 'prop-2',
    portfolio_id: 'p-1',
    property_name: 'Commercial Plot',
    property_type: 'commercial',
    location: 'Hyderabad',
    purchase_price: 3000000,
    current_valuation: 3500000,
    monthly_rent: 0,
  },
];

describe('realEstateValuation', () => {
  it('calculates invested and current valuation with fallbacks', () => {
    expect(calculateRealEstateInvested(mockProperties[0])).toBe(5000000);
    expect(calculateRealEstateValuation(mockProperties[0])).toBe(7500000);

    const noValuationProp: RealEstate = {
      id: 'prop-3',
      portfolio_id: 'p-1',
      property_name: 'Plot',
      property_type: 'plot',
      purchase_price: 2000000,
      current_valuation: 0,
      monthly_rent: 0,
    };
    expect(calculateRealEstateValuation(noValuationProp)).toBe(2000000);
  });

  it('calculates P&L and P&L % correctly', () => {
    const { pnl, pnlPct } = calculateRealEstatePnL(mockProperties[0]);
    expect(pnl).toBe(2500000);
    expect(pnlPct).toBe(50);
  });

  it('calculates annual rental yield percentage correctly', () => {
    // 25,000 * 12 = 300,000 / 5,000,000 = 6%
    expect(calculateRentalYield(mockProperties[0])).toBe(6);
    expect(calculateRentalYield(mockProperties[1])).toBe(0);
  });

  it('aggregates totals across properties correctly', () => {
    const totals = calculateRealEstateTotals(mockProperties);
    expect(totals.totalInvested).toBe(8000000);
    expect(totals.totalValuation).toBe(11000000);
    expect(totals.totalPnL).toBe(3000000);
    expect(totals.totalPnLPct).toBeCloseTo(37.5, 1);
    expect(totals.totalAnnualRent).toBe(300000);
    expect(totals.overallRentalYieldPct).toBeCloseTo(3.75, 2);
  });
});

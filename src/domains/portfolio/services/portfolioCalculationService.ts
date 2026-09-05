import { Portfolio } from '../../../types/portfolio';
import { calculateAggregatedPortfolioTotals } from '../calculations/portfolioTotals';
import { getFDInvestedAmount, getFDEffectiveValue } from '../../assets/fd/calculations/fdCompounding';
import { getRDInvestedAmount, getRDEffectiveValue } from '../../assets/rd/calculations/rdCompounding';
import { getSIPInvestedAmount, getSIPEffectiveValue } from '../../assets/sip/calculations/sipValuation';
import { calculateRealEstateValuation } from '../../assets/real-estate/calculations/realEstateValuation';
import { calculateGoldValuation } from '../../assets/gold/calculations/goldValuation';

export class PortfolioCalculationService {
  recalculateSinglePortfolio(portfolio: Portfolio): Portfolio {
    let stockInvested = 0;
    let stockCurrent = 0;
    const holdings = portfolio.holdings || [];
    for (let i = 0; i < holdings.length; i++) {
      const h = holdings[i];
      stockInvested += h.amountInvested;
      stockCurrent += h.currentValue;
    }

    let fdInvested = 0;
    let fdCurrent = 0;
    const fds = portfolio.fixedDeposits || [];
    for (let i = 0; i < fds.length; i++) {
      const f = fds[i];
      fdInvested += getFDInvestedAmount(f);
      fdCurrent += getFDEffectiveValue(f);
    }

    let rdInvested = 0;
    let rdCurrent = 0;
    const rds = portfolio.rdAccounts || [];
    for (let i = 0; i < rds.length; i++) {
      const r = rds[i];
      rdInvested += getRDInvestedAmount(r);
      rdCurrent += getRDEffectiveValue(r);
    }

    let sipInvested = 0;
    let sipCurrent = 0;
    const sips = portfolio.sipAccounts || [];
    for (let i = 0; i < sips.length; i++) {
      const s = sips[i];
      sipInvested += getSIPInvestedAmount(s);
      sipCurrent += getSIPEffectiveValue(s);
    }

    let goldCurrent = 0;
    const gold = portfolio.goldHoldings || [];
    const healedGold = gold.map((g) => {
      const w = Number(g.weight_grams) || 0;
      const rawVal = Number(g.current_valuation) || 0;
      const isCorrupt = w > 0 && rawVal > 0 && rawVal / w < 2000;
      if (w > 0 && (rawVal <= 0 || isCorrupt)) {
        const liveVal = calculateGoldValuation(w, g.purity);
        return { ...g, current_valuation: liveVal, currentValuation: liveVal };
      }
      return g;
    });
    for (let i = 0; i < healedGold.length; i++) {
      const g = healedGold[i];
      goldCurrent += Number(g.current_valuation) || 0;
    }

    let reCurrent = 0;
    const re = portfolio.realEstate || [];
    for (let i = 0; i < re.length; i++) {
      const r = re[i];
      reCurrent += calculateRealEstateValuation(r);
    }

    // Financial Net Worth calculates purely from financial & deposit holdings:
    // Stocks + Fixed Deposits + Recurring Deposits + SIP / Mutual Funds.
    // Gold & Real Estate are tracked separately on their dedicated asset pages.
    const totalInvested = stockInvested + fdInvested + rdInvested + sipInvested;
    const totalCurrentValue = stockCurrent + fdCurrent + rdCurrent + sipCurrent;
    const totalPnL = totalCurrentValue - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    return {
      ...portfolio,
      goldHoldings: healedGold,
      totalInvested,
      totalCurrentValue,
      totalPnL,
      totalPnLPercent,
      stocksValue: stockCurrent,
      fdValue: fdCurrent,
      rdValue: rdCurrent,
      sipValue: sipCurrent,
      goldValue: goldCurrent,
      realEstateValue: reCurrent,
    };
  }

  applyLivePrices(
    portfolios: Portfolio[],
    priceMap: Record<string, { ltp: number; todayPct: number }>
  ): Portfolio[] {
    return portfolios.map((portfolio) => {
      const updatedHoldings = portfolio.holdings.map((h) => {
        const live = priceMap[h.yahooSymbol];
        if (!live) return h;
        const currentValue = h.qty * live.ltp;
        const unrealizedPnL = currentValue - h.amountInvested;
        const pnlPercent = h.amountInvested > 0 ? (unrealizedPnL / h.amountInvested) * 100 : 0;
        return {
          ...h,
          ltp: live.ltp,
          currentValue,
          unrealizedPnL,
          pnlPercent,
          todayPnLPercent: live.todayPct,
        };
      });

      // Skip recalculation if no holding changed
      if (updatedHoldings.every((h, i) => h === portfolio.holdings[i])) {
        return portfolio;
      }

      return this.recalculateSinglePortfolio({
        ...portfolio,
        holdings: updatedHoldings,
      });
    });
  }

  applyLiveMFNavs(
    portfolios: Portfolio[],
    navMap: Record<string, number>,
    staleSchemes: Set<string>
  ): Portfolio[] {
    return portfolios.map((portfolio) => {
      const origSips = portfolio.sipAccounts || [];
      const updatedSips = origSips.map((s) => {
        if (s.mf_scheme_code && navMap[s.mf_scheme_code] !== undefined) {
          const nav = navMap[s.mf_scheme_code];
          const units = Number(s.units || 0);
          const currentValue = units * nav;
          const navIsStale = staleSchemes.has(s.mf_scheme_code);
          return { ...s, fallback_valuation: currentValue, navIsStale, liveNav: nav };
        } else if (s.mf_scheme_code) {
          return { ...s, navIsStale: true };
        }
        return s;
      });

      if (updatedSips.every((s, i) => s === origSips[i])) {
        return portfolio;
      }

      return this.recalculateSinglePortfolio({
        ...portfolio,
        sipAccounts: updatedSips,
      });
    });
  }

  calculateAggregatedTotals(portfolios: Portfolio[]) {
    return calculateAggregatedPortfolioTotals(portfolios);
  }
}

export const portfolioCalculationService = new PortfolioCalculationService();

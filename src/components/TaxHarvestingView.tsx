import React from 'react';
import { Portfolio } from '../types/portfolio';
import { calculateTaxHarvesting, TAX_DISCLAIMER } from '../utils/taxUtils';
import { formatINR } from '../utils/formatters';
import { TrendingDown, ShieldAlert } from './icons/AppIcons';

interface TaxHarvestingViewProps {
  portfolio: Portfolio | null;
  portfolios: Portfolio[];
}

export default function TaxHarvestingView({ portfolio, portfolios }: TaxHarvestingViewProps) {
  const holdings = React.useMemo(() => {
    if (portfolio) return portfolio.holdings;
    return portfolios.flatMap(p => p.holdings);
  }, [portfolio, portfolios]);

  const taxData = React.useMemo(() => calculateTaxHarvesting(holdings), [holdings]);
  const ltcgExemptionLimit = 125000;
  const exemptionProgress = Math.min(100, (taxData.ltcgExemptionUsed / ltcgExemptionLimit) * 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="apple-card p-5 bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[var(--accent-blue-soft)] rounded-[var(--radius-pill)]">
            <ShieldAlert size={18} className="text-[var(--accent-blue)]" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-primary)]">Tax Loss Harvesting</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Sell these holdings before March 31st to offset taxable gains and save up to <span className="font-bold text-[var(--positive)]">{formatINR(taxData.potentialTaxSavings)}</span> in taxes.
            </p>
            <div className="mt-2 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface-secondary)] inline-block px-2 py-1 rounded-[var(--radius-small)] border border-[var(--border-subtle)]">
              Financial Year 2025–26 (Apr 2025 – Mar 2026)
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-[var(--warning-soft)] border border-[var(--warning)]/30 rounded-[var(--radius-medium)] flex items-center gap-2">
          <span className="text-[var(--warning)] text-sm font-semibold">⚠️ Wash Sale Alert: Re-buying sold stock within 30 days may disallow tax loss benefit</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="apple-card p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-[var(--text-tertiary)]">Estimated Tax Liability</span>
          <p className="text-xl font-bold text-[var(--text-primary)] mt-2 tnum">{formatINR(taxData.totalEstimatedTax)}</p>
        </div>
        <div className="apple-card p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-[var(--text-tertiary)]">LTCG Exemption Used</span>
            <span className="text-xs font-bold text-[var(--accent-blue)] tnum">{formatINR(taxData.ltcgExemptionUsed)} / 1.25L</span>
          </div>
          <div className="w-full bg-[var(--surface-secondary)] rounded-[var(--radius-pill)] h-2 mt-auto overflow-hidden">
            <div className="bg-[var(--accent-blue)] h-2 rounded-[var(--radius-pill)] transition-all duration-500" style={{ width: `${exemptionProgress}%` }}></div>
          </div>
        </div>
        <div className="apple-card p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-[var(--text-tertiary)]">Harvestable Loss Potential</span>
          <p className="text-xl font-bold text-[var(--negative)] mt-2 tnum">{formatINR(taxData.harvestableLosses)}</p>
        </div>
        <div className="apple-card p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-[var(--text-tertiary)]">Potential Tax Savings</span>
          <p className="text-xl font-bold text-[var(--positive)] mt-2 tnum">{formatINR(taxData.potentialTaxSavings)}</p>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${taxData.unrealizedDebtOrGold !== 0 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
        <div className="apple-card p-4">
          <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">STCG Breakdown (Equity)</h4>
          <div className="flex justify-between items-center text-sm border-b border-[var(--border-subtle)] pb-2 mb-2">
            <span className="text-[var(--text-secondary)]">Unrealized STCG</span>
            <span className="font-semibold tnum text-[var(--text-primary)]">{formatINR(taxData.unrealizedSTCG)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-[var(--text-tertiary)]">
            <span>Tax Rate</span>
            <span className="font-semibold text-[var(--text-secondary)]">20%</span>
          </div>
        </div>
        <div className="apple-card p-4">
          <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">LTCG Breakdown (Equity)</h4>
          <div className="flex justify-between items-center text-sm border-b border-[var(--border-subtle)] pb-2 mb-2">
            <span className="text-[var(--text-secondary)]">Unrealized LTCG</span>
            <span className="font-semibold tnum text-[var(--text-primary)]">{formatINR(taxData.unrealizedLTCG)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-[var(--text-tertiary)]">
            <span>Tax Rate</span>
            <span className="font-semibold text-[var(--text-secondary)]">12.5% (over ₹1.25L)</span>
          </div>
        </div>
        {taxData.unrealizedDebtOrGold !== 0 && (
          <div className="apple-card p-4">
            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">Debt &amp; Gold ETFs</h4>
            <div className="flex justify-between items-center text-sm border-b border-[var(--border-subtle)] pb-2 mb-2">
              <span className="text-[var(--text-secondary)]">Unrealized Gain/Loss</span>
              <span className="font-semibold tnum text-[var(--text-primary)]">{formatINR(taxData.unrealizedDebtOrGold)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-[var(--text-tertiary)]">
              <span>Tax Rate</span>
              <span className="font-semibold text-[var(--text-secondary)]">Individual Slab Rate</span>
            </div>
          </div>
        )}
      </div>

      <div className="apple-card overflow-hidden">
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h3 className="font-bold text-[var(--text-primary)]">Harvesting Opportunities</h3>
          <span className="text-xs font-semibold bg-[var(--surface-secondary)] text-[var(--text-secondary)] px-2 py-1 rounded-[var(--radius-pill)] border border-[var(--border-subtle)]">
            {taxData.opportunities.length} Holdings
          </span>
        </div>
        {taxData.opportunities.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center">
            <ShieldAlert size={32} className="text-[var(--positive)] mb-3" />
            <h4 className="text-[var(--text-primary)] font-bold mb-1">No Harvestable Losses</h4>
            <p className="text-sm text-[var(--text-tertiary)]">All your holdings are currently in profit, or you have no stock holdings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[var(--surface-secondary)] text-[var(--text-tertiary)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ticker</th>
                  <th className="px-4 py-3 font-semibold text-right">Current Loss</th>
                  <th className="px-4 py-3 font-semibold">Holding Type</th>
                  <th className="px-4 py-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {taxData.opportunities.map((opp, idx) => (
                  <tr key={`${opp.holding.id || opp.holding.ticker}-${idx}`} className="hover:bg-[var(--surface-secondary)]/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{opp.holding.ticker}</td>
                    <td className="px-4 py-3 text-right font-bold text-[var(--negative)] tnum">{formatINR(opp.unrealizedPnL)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-[var(--radius-pill)] border ${
                        opp.isDebtOrGold
                          ? 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                          : opp.isLTCG
                          ? 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] border-[var(--accent-blue)]/30'
                          : 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/30'
                      }`}>
                        {opp.isDebtOrGold ? 'Slab Rate' : opp.isLTCG ? 'LTCG' : 'STCG'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--positive)] bg-[var(--positive-soft)] border border-[var(--positive)]/30 px-2 py-1 rounded-[var(--radius-small)]">
                        <TrendingDown size={12} />
                        Harvest Opportunity
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-[var(--text-tertiary)]">
        {TAX_DISCLAIMER}
      </div>
    </div>
  );
}

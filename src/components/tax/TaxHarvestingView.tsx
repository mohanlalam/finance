import React from 'react';
import { Portfolio } from '../../types/portfolio';
import { calculateTaxHarvesting, TAX_DISCLAIMER } from '../../domains/taxation/calculations/taxHarvesting';
import { formatINR } from '../../utils/formatters';
import { TrendingDown, ShieldAlert } from '../icons/AppIcons';
import { getFamilyMemberConfig } from '../../utils/familyMemberConfig';

interface TaxHarvestingViewProps {
  portfolio: Portfolio | null;
  portfolios: Portfolio[];
}

export default function TaxHarvestingView({ portfolio, portfolios }: TaxHarvestingViewProps) {
  const holdings = React.useMemo(() => {
    if (portfolio) {
      return (portfolio.holdings || []).map((h) => ({
        ...h,
        portfolio_id: h.portfolio_id || portfolio.id,
        portfolio_name: portfolio.name,
        portfolio_label: portfolio.label || portfolio.name,
      }));
    }
    return portfolios.flatMap((p) =>
      (p.holdings || []).map((h) => ({
        ...h,
        portfolio_id: h.portfolio_id || p.id,
        portfolio_name: p.name,
        portfolio_label: p.label || p.name,
      }))
    );
  }, [portfolio, portfolios]);

  const taxData = React.useMemo(() => calculateTaxHarvesting(holdings), [holdings]);

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* Unified Family Tax Loss Harvesting Banner */}
      <div className="apple-card p-2.5 sm:p-3.5 bg-[var(--surface)] border border-[var(--border-subtle)] space-y-2 sm:space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 border-b border-[var(--border-subtle)] pb-2 sm:pb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[var(--radius-small)] bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <TrendingDown size={15} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                  Tax Loss Harvesting &amp; Optimization
                </h3>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 sm:py-0.5 rounded-[var(--radius-pill)] bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 uppercase tracking-wider shrink-0">
                  {portfolio ? portfolio.label : 'Combined'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[var(--text-tertiary)] truncate">
                Indian FY25-26 Capital Gains (STCG 20%, LTCG 12.5% &gt; ₹1.25L) &amp; Loss Harvesting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface-secondary)] px-2.5 py-1 rounded-[var(--radius-small)] border border-[var(--border-subtle)]">
              FY 2025–26 (Apr 2025 – Mar 2026)
            </div>
          </div>
        </div>

        {/* 4 Summary Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-xs">
          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Estimated Tax</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] tnum mt-0.5 block truncate">
              {formatINR(taxData.totalEstimatedTax)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">LTCG Exemption</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--accent-blue)] tnum mt-0.5 block truncate">
              {formatINR(taxData.ltcgExemptionUsed)} / 1.25L
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--negative)]/30">
            <span className="text-[10px] font-bold text-[var(--negative)] uppercase tracking-wider block truncate">Harvestable Losses</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--negative)] tnum mt-0.5 block truncate">
              {formatINR(taxData.harvestableLosses)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--positive)]/30">
            <span className="text-[10px] font-bold text-[var(--positive)] uppercase tracking-wider block truncate">Potential Savings</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--positive)] tnum mt-0.5 block truncate">
              {formatINR(taxData.potentialTaxSavings)}
            </span>
          </div>
        </div>
      </div>

      <div className="apple-card p-4 sm:p-5 bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[var(--accent-blue-soft)] rounded-[var(--radius-pill)]">
            <ShieldAlert size={18} className="text-[var(--accent-blue)]" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-primary)]">Tax Optimization Guide</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Sell these holdings before March 31st to offset taxable gains and save up to <span className="font-bold text-[var(--positive)]">{formatINR(taxData.potentialTaxSavings)}</span> in taxes.
            </p>
          </div>
        </div>
        <div className="mt-3 p-2.5 bg-[var(--warning-soft)] border border-[var(--warning)]/30 rounded-[var(--radius-medium)] flex items-center gap-2">
          <span className="text-[var(--warning)] text-xs sm:text-sm font-semibold">⚠️ Wash Sale Alert: Re-buying sold stock within 30 days may disallow tax loss benefit</span>
        </div>
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
            <p className="text-sm font-semibold text-[var(--text-secondary)]">No Tax Loss Harvesting Opportunities</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-md">
              All holdings are in profit or no tax-loss harvesting candidates found in this portfolio.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-secondary)]/50 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                  <th className="px-4 py-3">Stock / Asset</th>
                  {!portfolio && <th className="px-4 py-3">Owner</th>}
                  <th className="px-4 py-3 text-right">Holding Value</th>
                  <th className="px-4 py-3 text-right">Unrealized Loss</th>
                  <th className="px-4 py-3 text-center">Tax Category</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
                {taxData.opportunities.map((opp) => {
                  const memberName = opp.holding.portfolio_label || opp.holding.portfolio_name;
                  const memberConfig = memberName ? getFamilyMemberConfig(memberName) : null;
                  const rowKey = `${opp.holding.id || opp.holding.ticker}-${opp.holding.portfolio_id || memberName || ''}`;

                  return (
                    <tr key={rowKey} className="hover:bg-[var(--surface-secondary)]/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[var(--negative)]"></div>
                          <span>{opp.holding.ticker}</span>
                        </div>
                      </td>
                      {!portfolio && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          {memberConfig && memberName ? (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${memberConfig.bg} ${memberConfig.text}`}>
                              {memberConfig.icon}
                              <span>{memberName}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--text-tertiary)]">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right font-medium tnum text-[var(--text-secondary)]">
                        {formatINR(opp.holding.currentValue)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold tnum text-[var(--negative)]">
                        {formatINR(Math.abs(opp.unrealizedPnL))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-[var(--radius-pill)] border ${
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
                          Harvest
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-xs text-[var(--text-secondary)] font-medium leading-relaxed px-4">
        {TAX_DISCLAIMER}
      </div>
    </div>
  );
}

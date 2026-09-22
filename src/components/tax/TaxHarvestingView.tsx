import React from 'react';
import { Portfolio } from '../../types/portfolio';
import { calculateTaxHarvesting, TAX_DISCLAIMER } from '../../domains/taxation/calculations/taxHarvesting';
import { formatINR } from '../../utils/formatters';
import { TrendingDown, ShieldAlert, ChevronRight } from '../icons/AppIcons';
import { getFamilyMemberConfig } from '../../utils/familyMemberConfig';
import { useIsMobile } from '../../hooks/useIsMobile';
import MobileAssetRegistry from '../ui/MobileAssetRegistry';
import AppBadge from '../ui/AppBadge';
import EmptyState from '../EmptyState';

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

  const isMobile = useIsMobile();
  const [mobileSearch, setMobileSearch] = React.useState('');
  const [mobileFilter, setMobileFilter] = React.useState('all');

  const filteredOpportunities = React.useMemo(() => {
    let opps = taxData.opportunities;
    if (mobileFilter === 'stcg') {
      opps = opps.filter((o) => !o.isLTCG && !o.isDebtOrGold);
    } else if (mobileFilter === 'ltcg') {
      opps = opps.filter((o) => o.isLTCG);
    } else if (mobileFilter === 'slab') {
      opps = opps.filter((o) => o.isDebtOrGold);
    }

    if (mobileSearch.trim()) {
      const q = mobileSearch.toLowerCase();
      opps = opps.filter(
        (o) =>
          o.holding.ticker.toLowerCase().includes(q) ||
          (o.holding.stockName && o.holding.stockName.toLowerCase().includes(q))
      );
    }
    return opps;
  }, [taxData.opportunities, mobileFilter, mobileSearch]);

  if (isMobile) {
    const filterOptions = [
      { id: 'all', label: 'All', count: taxData.opportunities.length },
      { id: 'stcg', label: 'STCG', count: taxData.opportunities.filter((o) => !o.isLTCG && !o.isDebtOrGold).length },
      { id: 'ltcg', label: 'LTCG', count: taxData.opportunities.filter((o) => o.isLTCG).length },
    ];

    return (
      <MobileAssetRegistry
        title="Tax Harvesting"
        question="How much loss can be harvested?"
        heroValue={formatINR(taxData.harvestableLosses)}
        heroSubtitle="Offset taxable capital gains before March 31st"
        icon={<TrendingDown size={16} />}
        primaryBadge={
          taxData.potentialTaxSavings > 0 ? (
            <AppBadge variant="positive">
              Save up to {formatINR(taxData.potentialTaxSavings)}
            </AppBadge>
          ) : (
            <AppBadge variant="info">
              All Holdings Optimal
            </AppBadge>
          )
        }
        secondaryMetrics={[
          { label: 'Estimated Tax', value: formatINR(taxData.totalEstimatedTax) },
          {
            label: 'LTCG Exemption',
            value: `${formatINR(taxData.ltcgExemptionUsed)} / 1.25L`,
          },
        ]}
        filterOptions={filterOptions}
        selectedFilter={mobileFilter}
        onSelectFilter={setMobileFilter}
        searchPlaceholder="Search opportunities by ticker..."
        searchValue={mobileSearch}
        onSearchChange={setMobileSearch}
        isEmpty={filteredOpportunities.length === 0}
        emptyState={
          <EmptyState
            type="default"
            title="No harvesting opportunities"
            description="All your holdings are currently profitable or no tax-loss harvesting candidates found."
          />
        }
      >
        <div className="bg-[var(--surface)] rounded-[var(--radius-large)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] shadow-xs">
          {filteredOpportunities.map((opp) => {
            const memberName = opp.holding.portfolio_label || opp.holding.portfolio_name;
            const tag = opp.isDebtOrGold ? 'Slab' : opp.isLTCG ? 'LTCG' : 'STCG';
            const loss = Math.abs(opp.unrealizedPnL);
            const taxSaved = loss * (opp.isDebtOrGold ? 0.30 : opp.isLTCG ? 0.125 : 0.20);

            return (
              <div
                key={`tax-${opp.holding.id || opp.holding.ticker}`}
                className="p-3.5 flex items-center justify-between gap-3 min-h-[56px] ios-press hover:bg-[var(--surface-secondary)]/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-rose-500/15 text-rose-600 dark:text-rose-400">
                    <TrendingDown size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">
                        {opp.holding.ticker}
                      </h4>
                      <AppBadge variant="info">
                        {tag}
                      </AppBadge>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] font-medium mt-0.5 truncate">
                      {opp.holding.qty} shares &bull; Value {formatINR(opp.holding.currentValue)}
                      {memberName && ` &bull; ${memberName}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold text-[var(--negative)] tnum">
                      -{formatINR(loss)}
                    </div>
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tnum mt-0.5">
                      Save ~{formatINR(taxSaved)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-[var(--radius-small)] bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-xs ios-press cursor-pointer shrink-0"
                  >
                    <span>Harvest</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </MobileAssetRegistry>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-2 sm:pb-6">
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
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:py-0.5 rounded-[var(--radius-pill)] bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 uppercase tracking-wider shrink-0">
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
          <>
            {/* Mobile View: Compact Touch Cards (< md) */}
            <div className="md:hidden p-2.5 sm:p-3 space-y-2.5">
              {taxData.opportunities.map((opp) => {
                const memberName = opp.holding.portfolio_label || opp.holding.portfolio_name;
                const memberConfig = getFamilyMemberConfig(opp.holding.portfolio_name || memberName || '');
                const rowKey = `m-${opp.holding.id || opp.holding.ticker}-${opp.holding.portfolio_id || memberName || ''}`;

                return (
                  <div key={rowKey} className="p-3.5 space-y-2.5 bg-[var(--surface)] rounded-[var(--radius-medium)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] mobile-asset-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-[var(--negative)] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-[var(--text-primary)]">{opp.holding.ticker}</span>
                            <span className="text-[11px] text-[var(--text-tertiary)] font-normal">
                              ({opp.holding.qty} shares)
                            </span>
                          </div>
                          {opp.holding.stockName && opp.holding.stockName !== opp.holding.ticker && (
                            <p className="text-[11px] text-[var(--text-tertiary)] font-normal truncate max-w-[200px]">
                              {opp.holding.stockName}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[var(--radius-pill)] border shrink-0 ${
                        opp.isDebtOrGold
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700'
                          : opp.isLTCG
                          ? 'bg-sky-100 dark:bg-sky-950/70 text-sky-900 dark:text-sky-200 border-sky-300 dark:border-sky-800'
                          : 'bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                      }`}>
                        {opp.isDebtOrGold ? 'Slab Rate' : opp.isLTCG ? 'LTCG' : 'STCG'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1.5 border-t border-[var(--border-subtle)]/60">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">Holding Value</span>
                        <span className="font-semibold text-[var(--text-secondary)] tnum">
                          {formatINR(opp.holding.currentValue)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">Unrealized Loss</span>
                        <span className="font-bold text-[var(--negative)] tnum">
                          -{formatINR(Math.abs(opp.unrealizedPnL))}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {!portfolio && memberName ? (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${memberConfig.bg} ${memberConfig.text}`}>
                          {memberConfig.icon}
                          <span>{memberName}</span>
                        </span>
                      ) : <div />}
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] px-3 py-1.5 rounded-[var(--radius-small)] shadow-xs transition-all cursor-pointer select-none ios-press"
                      >
                        <TrendingDown size={13} />
                        <span>Harvest Opportunity</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Full Data Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
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
                    const memberConfig = getFamilyMemberConfig(opp.holding.portfolio_name || memberName || '');
                    const rowKey = `${opp.holding.id || opp.holding.ticker}-${opp.holding.portfolio_id || memberName || ''}`;

                    return (
                      <tr key={rowKey} className="hover:bg-[var(--surface-secondary)]/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--negative)] shrink-0"></div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold">{opp.holding.ticker}</span>
                                <span className="text-[11px] text-[var(--text-tertiary)] font-normal">
                                  ({opp.holding.qty} shares)
                                </span>
                              </div>
                              {opp.holding.stockName && opp.holding.stockName !== opp.holding.ticker && (
                                <p className="text-[11px] text-[var(--text-tertiary)] font-normal truncate max-w-[220px]">
                                  {opp.holding.stockName}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        {!portfolio && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            {memberName ? (
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
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-[var(--radius-pill)] border ${
                            opp.isDebtOrGold
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700'
                              : opp.isLTCG
                              ? 'bg-sky-100 dark:bg-sky-950/70 text-sky-900 dark:text-sky-200 border-sky-300 dark:border-sky-800'
                              : 'bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                          }`}>
                            {opp.isDebtOrGold ? 'Slab Rate' : opp.isLTCG ? 'LTCG' : 'STCG'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] px-3 py-1 rounded-[var(--radius-small)] shadow-xs transition-all cursor-pointer select-none ios-press"
                          >
                            <TrendingDown size={12} />
                            <span>Harvest</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 text-center text-xs text-[var(--text-secondary)] font-medium leading-relaxed px-4">
        {TAX_DISCLAIMER}
      </div>
    </div>
  );
}

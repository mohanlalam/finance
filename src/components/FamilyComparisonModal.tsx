import React, { useMemo } from 'react';
import { Portfolio, PortfolioName } from '../types/portfolio';
import { formatINR, formatPercent, getFDEffectiveValue } from '../utils/formatters';
import { getRDEffectiveValue } from '../utils/rdUtils';
import { getSIPEffectiveValue } from '../utils/sipUtils';
import { TrendingUp, TrendingDown, ArrowUpRight } from './icons/AppIcons';
import Modal from './Modal';
import { Button } from './ui/Button';

interface FamilyComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolios: Portfolio[];
  onSelectPortfolio: (name: PortfolioName) => void;
}

export function FamilyComparisonModal({
  isOpen,
  onClose,
  portfolios,
  onSelectPortfolio,
}: FamilyComparisonModalProps) {
  // Aggregate stats across all family members
  const stats = useMemo(() => {
    const totalFamilyNetWorth = portfolios.reduce((sum, p) => sum + p.totalCurrentValue, 0);
    const totalFamilyInvested = portfolios.reduce((sum, p) => sum + p.totalInvested, 0);
    const totalFamilyPnL = totalFamilyNetWorth - totalFamilyInvested;

    return {
      totalFamilyNetWorth,
      totalFamilyInvested,
      totalFamilyPnL,
      members: portfolios.map((p) => {
        const netWorthShare = totalFamilyNetWorth > 0 ? (p.totalCurrentValue / totalFamilyNetWorth) * 100 : 0;
        
        // Asset breakdown values
        const stocksVal = (p.holdings || []).reduce((s, h) => s + (h.currentValue || 0), 0);
        const fdVal = (p.fixedDeposits || []).reduce((s, f) => s + getFDEffectiveValue(f), 0);
        const rdVal = (p.rdAccounts || []).reduce((s, r) => s + getRDEffectiveValue(r), 0);
        const sipVal = (p.sipAccounts || []).reduce((s, m) => s + getSIPEffectiveValue(m), 0);
        const goldVal = (p.goldHoldings || []).reduce((s, g) => s + (g.current_valuation || 0), 0);
        const realEstateVal = (p.realEstate || []).reduce((s, r) => s + (r.current_valuation || 0), 0);

        const assetCount =
          (p.holdings?.length || 0) +
          (p.fixedDeposits?.length || 0) +
          (p.rdAccounts?.length || 0) +
          (p.sipAccounts?.length || 0) +
          (p.goldHoldings?.length || 0) +
          (p.realEstate?.length || 0);

        return {
          portfolio: p,
          netWorthShare,
          stocksVal,
          fdVal,
          rdVal,
          sipVal,
          goldVal,
          realEstateVal,
          assetCount,
        };
      }),
    };
  }, [portfolios]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Family Members Comparison">
      <div className="space-y-6">
        {/* Header Ribbon Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)]">
          <div>
            <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              Total Family Net Worth
            </span>
            <div className="text-lg font-bold text-[var(--text-primary)] tnum">
              {formatINR(stats.totalFamilyNetWorth)}
            </div>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              Total Invested Capital
            </span>
            <div className="text-lg font-bold text-[var(--text-primary)] tnum">
              {formatINR(stats.totalFamilyInvested)}
            </div>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              Overall Unrealized P&L
            </span>
            <div className={`text-lg font-bold flex items-center gap-1 tnum ${
              stats.totalFamilyPnL >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'
            }`}>
              {stats.totalFamilyPnL >= 0 ? <TrendingUp size={16} aria-hidden="true" /> : <TrendingDown size={16} aria-hidden="true" />}
              {stats.totalFamilyPnL >= 0 ? '+' : ''}{formatINR(stats.totalFamilyPnL)}
            </div>
          </div>
        </div>

        {/* Member Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.members.map(({ portfolio: p, netWorthShare, stocksVal, fdVal, rdVal, sipVal, goldVal, realEstateVal, assetCount }) => {
            const isPositive = p.totalPnL >= 0;
            return (
              <div
                key={p.id}
                className="apple-card p-4 flex flex-col justify-between hover:shadow-[var(--shadow-card)] transition-all duration-200"
              >
                <div>
                  {/* Member Name and Share */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] flex items-center justify-center font-bold text-xs uppercase">
                        {p.label.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[var(--text-primary)]">{p.label}</h4>
                        <span className="text-[11px] text-[var(--text-tertiary)]">
                          {assetCount} asset{assetCount === 1 ? '' : 's'} · {netWorthShare.toFixed(1)}% of family
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onSelectPortfolio(p.name as PortfolioName);
                        onClose();
                      }}
                      className="text-xs text-[var(--accent-blue)]"
                    >
                      View <ArrowUpRight size={12} className="ml-1" />
                    </Button>
                  </div>

                  {/* Valuation & PnL Metrics */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-lg bg-[var(--surface-secondary)]">
                    <div>
                      <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Current Value</span>
                      <div className="text-sm font-bold text-[var(--text-primary)] tnum">{formatINR(p.totalCurrentValue)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Total P&L</span>
                      <div className={`text-sm font-bold flex items-center gap-0.5 tnum ${isPositive ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                        {isPositive ? '+' : ''}{formatINR(p.totalPnL)} ({formatPercent(p.totalPnLPercent)})
                      </div>
                    </div>
                  </div>

                  {/* Asset Allocation Breakdown Strip */}
                  <div className="space-y-1 mt-3">
                    <div className="flex justify-between text-[10px] font-semibold text-[var(--text-tertiary)]">
                      <span>Asset Allocation</span>
                      <span>{formatINR(p.totalCurrentValue)}</span>
                    </div>
                    {p.totalCurrentValue > 0 ? (
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden">
                        {stocksVal > 0 && (
                          <div
                            style={{ width: `${(stocksVal / p.totalCurrentValue) * 100}%` }}
                            className="bg-blue-500 h-full"
                            title={`Stocks: ${formatINR(stocksVal)}`}
                          />
                        )}
                        {fdVal > 0 && (
                          <div
                            style={{ width: `${(fdVal / p.totalCurrentValue) * 100}%` }}
                            className="bg-purple-500 h-full"
                            title={`FDs: ${formatINR(fdVal)}`}
                          />
                        )}
                        {sipVal > 0 && (
                          <div
                            style={{ width: `${(sipVal / p.totalCurrentValue) * 100}%` }}
                            className="bg-emerald-500 h-full"
                            title={`SIP: ${formatINR(sipVal)}`}
                          />
                        )}
                        {goldVal > 0 && (
                          <div
                            style={{ width: `${(goldVal / p.totalCurrentValue) * 100}%` }}
                            className="bg-amber-400 h-full"
                            title={`Gold: ${formatINR(goldVal)}`}
                          />
                        )}
                        {realEstateVal > 0 && (
                          <div
                            style={{ width: `${(realEstateVal / p.totalCurrentValue) * 100}%` }}
                            className="bg-teal-500 h-full"
                            title={`Real Estate: ${formatINR(realEstateVal)}`}
                          />
                        )}
                        {rdVal > 0 && (
                          <div
                            style={{ width: `${(rdVal / p.totalCurrentValue) * 100}%` }}
                            className="bg-cyan-400 h-full"
                            title={`RDs: ${formatINR(rdVal)}`}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
                    )}
                  </div>
                </div>

                {/* Legend badges */}
                <div className="flex flex-wrap gap-2 text-[10px] text-[var(--text-tertiary)] pt-3 border-t border-[var(--border-subtle)] mt-3">
                  {stocksVal > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Stocks {((stocksVal / p.totalCurrentValue) * 100).toFixed(0)}%</span>}
                  {fdVal > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> FDs {((fdVal / p.totalCurrentValue) * 100).toFixed(0)}%</span>}
                  {sipVal > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> SIPs {((sipVal / p.totalCurrentValue) * 100).toFixed(0)}%</span>}
                  {goldVal > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Gold {((goldVal / p.totalCurrentValue) * 100).toFixed(0)}%</span>}
                  {realEstateVal > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> Realty {((realEstateVal / p.totalCurrentValue) * 100).toFixed(0)}%</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

export default React.memo(FamilyComparisonModal);

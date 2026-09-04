import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, Wifi, WifiOff, Plus } from '../icons/AppIcons';
import { Portfolio, PortfolioName, FetchStatus } from '../../types/portfolio';
import PortfolioTable from '../PortfolioTable';
import EmptyState from '../EmptyState';
import { formatINR, formatPercent, pnlColor } from '../../utils/formatters';
import { sortPortfolios } from '../../domains/portfolio/calculations/portfolioOrdering';
import { calcHoldingTodayPnL } from '../../domains/portfolio/calculations/portfolioTotals';
import { getFamilyMemberConfig } from '../../utils/familyMemberConfig';

interface PortfolioOption {
  name: string;
  label: string;
}

interface StocksViewProps {
  portfolios: Portfolio[];
  portfolioName: PortfolioName;
  portfolioOptions: PortfolioOption[];
  priceStatus: FetchStatus;
  onAddHoldingClick: () => void;
  onDeleteStock: (holdingId: string) => Promise<void>;
  onUpdateStock: (holdingId: string, qty: number, avgPrice: number) => Promise<void>;
}

export default function StocksView({
  portfolios,
  portfolioName,
  priceStatus,
  onAddHoldingClick,
  onDeleteStock,
  onUpdateStock,
}: StocksViewProps) {
  const [selectedMember, setSelectedMember] = useState<string>(portfolioName || 'all');

  useEffect(() => {
    setSelectedMember(portfolioName || 'all');
  }, [portfolioName]);

  // Aggregate Family Stock totals across all family members
  const familyStocksSummary = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;
    let totalTodayPnL = 0;

    const ordered = sortPortfolios(portfolios || []);
    const memberBreakdown = ordered.map((p) => {
      let memberInvested = 0;
      let memberCurrent = 0;
      let memberTodayPnL = 0;

      const holdings = p.holdings || [];
      for (const h of holdings) {
        memberInvested += Number(h.amountInvested) || 0;
        memberCurrent += Number(h.currentValue) || 0;
        memberTodayPnL += calcHoldingTodayPnL(h);
      }

      totalInvested += memberInvested;
      totalCurrent += memberCurrent;
      totalTodayPnL += memberTodayPnL;

      const memberPnL = memberCurrent - memberInvested;
      const memberPnLPct = memberInvested > 0 ? (memberPnL / memberInvested) * 100 : 0;
      const prevVal = memberCurrent - memberTodayPnL;
      const memberTodayPnLPct = prevVal > 0 ? (memberTodayPnL / prevVal) * 100 : 0;

      return {
        name: p.name,
        label: p.label || p.name,
        invested: memberInvested,
        current: memberCurrent,
        pnl: memberPnL,
        pnlPct: memberPnLPct,
        todayPnL: memberTodayPnL,
        todayPnLPct: memberTodayPnLPct,
        count: holdings.length,
        holdings,
      };
    });

    const totalPnL = totalCurrent - totalInvested;
    const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const prevDayVal = totalCurrent - totalTodayPnL;
    const totalTodayPnLPct = prevDayVal > 0 ? (totalTodayPnL / prevDayVal) * 100 : 0;
    const totalCount = memberBreakdown.reduce((sum, m) => sum + m.count, 0);

    return {
      totalInvested,
      totalCurrent,
      totalPnL,
      totalPnLPct,
      totalTodayPnL,
      totalTodayPnLPct,
      totalCount,
      memberBreakdown,
    };
  }, [portfolios]);

  const activeMember = useMemo(() => {
    if (selectedMember === 'all') return null;
    return familyStocksSummary.memberBreakdown.find((m) => m.name === selectedMember) || null;
  }, [selectedMember, familyStocksSummary.memberBreakdown]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Unified Family Stocks & ETFs Banner */}
      <div className="apple-card p-2.5 sm:p-3.5 bg-[var(--surface)] border border-[var(--border-subtle)] space-y-2 sm:space-y-3">
        {/* Row 1: Identity & Real-Time Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 border-b border-[var(--border-subtle)] pb-2 sm:pb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[var(--radius-small)] bg-sky-500/20 text-sky-500 border border-sky-500/30 flex items-center justify-center shrink-0">
              <TrendingUp size={15} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                  Total Family Stocks &amp; ETFs
                </h3>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 sm:py-0.5 rounded-[var(--radius-pill)] bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 uppercase tracking-wider shrink-0">
                  Combined
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[var(--text-tertiary)] truncate">
                Aggregated equity and ETF holdings across family portfolios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {priceStatus === 'success' && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--positive)] bg-[var(--positive-soft)] px-2 py-0.5 rounded-[var(--radius-small)]">
                <Wifi size={11} />
                Live prices
              </span>
            )}
            {priceStatus === 'error' && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-secondary)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded-[var(--radius-small)]">
                <WifiOff size={11} />
                Snapshot data
              </span>
            )}
            <span className="text-[11px] font-medium text-[var(--text-tertiary)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded-[var(--radius-small)] hidden sm:inline-block">
              {familyStocksSummary.totalCount} stocks &bull; Click column to sort
            </span>
            <button
              onClick={onAddHoldingClick}
              className="flex items-center gap-1.5 bg-[var(--accent-blue)] hover:brightness-110 text-white text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-small)] transition-colors shadow-xs ios-press cursor-pointer"
            >
              <Plus size={13} />
              Add Holding
            </button>
          </div>
        </div>

        {/* Row 2: 4 Summary Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-xs">
          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Principal Invested</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] tnum mt-0.5 block truncate">
              {formatINR(familyStocksSummary.totalInvested)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Current Valuation</span>
            <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] tnum mt-0.5 block truncate">
              {formatINR(familyStocksSummary.totalCurrent)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Overall Return</span>
            <span className={`text-xs sm:text-sm font-bold tnum mt-0.5 block truncate ${pnlColor(familyStocksSummary.totalPnL)}`}>
              {familyStocksSummary.totalPnL >= 0 ? '+' : ''}{formatINR(familyStocksSummary.totalPnL)} ({formatPercent(familyStocksSummary.totalPnLPct)})
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">Today&apos;s Change</span>
            <span className={`text-xs sm:text-sm font-bold tnum mt-0.5 block truncate ${pnlColor(familyStocksSummary.totalTodayPnL)}`}>
              {familyStocksSummary.totalTodayPnL >= 0 ? '+' : ''}{formatINR(familyStocksSummary.totalTodayPnL)} ({formatPercent(familyStocksSummary.totalTodayPnLPct)})
            </span>
          </div>
        </div>

        {/* Row 3: Family Members Breakdown: 3 compact columns on mobile */}
        {familyStocksSummary.memberBreakdown.length > 0 && (
          <div className="pt-1.5 sm:pt-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-1 sm:mb-1.5">
              <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">
                Family Members Breakdown
              </span>
              <div className="flex items-center gap-1.5">
                {selectedMember !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedMember('all')}
                    className="text-[10px] font-bold text-[var(--accent-blue)] hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                )}
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  {familyStocksSummary.totalCount} Total Stocks
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
              {familyStocksSummary.memberBreakdown.map((m) => {
                const config = getFamilyMemberConfig(m.name);
                const isSelected = selectedMember === m.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setSelectedMember((prev) => (prev === m.name ? 'all' : m.name))}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-1.5 sm:p-2 min-h-[44px] justify-center rounded-[var(--radius-small)] border transition-all cursor-pointer text-left ios-press min-w-0 ${
                      isSelected
                        ? 'bg-[var(--surface-secondary)] border-sky-500 ring-1 ring-sky-500/30 shadow-xs'
                        : 'bg-[var(--surface)] border-[var(--border-subtle)] hover:border-sky-500/40'
                    }`}
                    title={`Click to filter ${m.label}'s stock holdings`}
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                        {config.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-[10.5px] sm:text-xs font-bold text-[var(--text-primary)] truncate">
                            {m.label}
                          </p>
                          {isSelected && (
                            <span className="hidden xs:inline text-[8px] font-bold px-1 rounded bg-sky-500/20 text-sky-700 dark:text-sky-400">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[9.5px] sm:text-[10px] text-[var(--text-tertiary)] hidden sm:block">
                          {m.count} stock{m.count === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0 mt-1 sm:mt-0">
                      {m.count === 0 ? (
                        <span className="text-[10.5px] sm:text-xs text-[var(--text-tertiary)] font-normal block">—</span>
                      ) : (
                        <>
                          <p className="text-[10.5px] sm:text-xs font-bold text-[var(--text-primary)] tnum truncate">
                            {formatINR(m.current)}
                          </p>
                          <p className={`text-[9.5px] sm:text-[10px] font-semibold tnum truncate ${pnlColor(m.pnl)}`}>
                            {m.pnl >= 0 ? '+' : ''}{formatINR(m.pnl)}
                          </p>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Holdings Registry Content */}
      {familyStocksSummary.totalCount === 0 ? (
        <EmptyState
          type="stocks"
          title="No stock holdings yet"
          description="Add stocks or ETFs to start tracking live prices and P&L."
          actionButton={
            <button
              onClick={onAddHoldingClick}
              className="inline-flex items-center gap-1.5 bg-[var(--accent-blue)] hover:brightness-110 text-white text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-small)] transition-colors shadow-sm ios-press cursor-pointer"
            >
              <Plus size={13} />
              Add Holding
            </button>
          }
        />
      ) : selectedMember !== 'all' ? (
        <div>
          {activeMember && (
            <div className="px-3.5 sm:px-4 py-2 bg-[var(--surface-secondary)]/60 flex items-center justify-between border border-[var(--border-subtle)] rounded-t-[var(--radius-small)]">
              <div className="flex items-center gap-2">
                {(() => {
                  const cfg = getFamilyMemberConfig(activeMember.name);
                  return (
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.text}`}>
                      {cfg.icon}
                    </div>
                  );
                })()}
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {activeMember.label}&apos;s Stocks &amp; ETFs
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  {activeMember.count}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember('all')}
                className="text-xs text-[var(--accent-blue)] hover:underline font-semibold cursor-pointer"
              >
                Show All Family
              </button>
            </div>
          )}
          {activeMember?.count === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-tertiary)] italic bg-[var(--surface)] border border-t-0 border-[var(--border-subtle)] rounded-b-[var(--radius-small)]">
              No stock holdings recorded for this member.
            </div>
          ) : (
            <PortfolioTable
              holdings={activeMember?.holdings || []}
              totalInvested={activeMember?.invested || 0}
              totalCurrentValue={activeMember?.current || 0}
              totalPnL={activeMember?.pnl || 0}
              totalPnLPercent={activeMember?.pnlPct || 0}
              onDelete={onDeleteStock}
              onUpdate={onUpdateStock}
              hideOverviewRibbon={true}
            />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {familyStocksSummary.memberBreakdown.map((m) => {
            const config = getFamilyMemberConfig(m.name);
            return (
              <div key={m.name} className="space-y-1.5">
                <div className="px-3.5 sm:px-4 py-2 bg-[var(--surface-secondary)]/60 flex items-center justify-between border border-[var(--border-subtle)] rounded-t-[var(--radius-small)]">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${config.bg} ${config.text}`}>
                      {config.icon}
                    </div>
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {m.label}&apos;s Stocks &amp; ETFs
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                      {m.count}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-[var(--text-primary)] tnum">
                      {formatINR(m.current)}
                    </span>
                    <span className={`text-[11px] font-semibold tnum ${pnlColor(m.pnl)}`}>
                      {m.pnl >= 0 ? '+' : ''}{formatINR(m.pnl)} ({formatPercent(m.pnlPct)})
                    </span>
                  </div>
                </div>
                {m.count === 0 ? (
                  <div className="px-4 py-4 text-center text-xs text-[var(--text-tertiary)] italic bg-[var(--surface)] border border-t-0 border-[var(--border-subtle)] rounded-b-[var(--radius-small)]">
                    No stock holdings for {m.label}
                  </div>
                ) : (
                  <PortfolioTable
                    holdings={m.holdings}
                    totalInvested={m.invested}
                    totalCurrentValue={m.current}
                    totalPnL={m.pnl}
                    totalPnLPercent={m.pnlPct}
                    onDelete={onDeleteStock}
                    onUpdate={onUpdateStock}
                    hideOverviewRibbon={true}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

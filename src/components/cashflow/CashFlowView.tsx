import { useState, useMemo } from 'react';
import {
  Calendar,
  TrendingUp,
  Clock,
  Landmark,
  Shield,
  Coins,
  Home,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from '../icons/AppIcons';
import { Portfolio } from '../../types/portfolio';
import {
  calculateCashFlowTimeline,
  CashFlowCategory,
} from '../../domains/cashflow/calculations/cashFlowTimeline';
import {
  generateReinvestmentMatrix,
} from '../../domains/cashflow/calculations/reinvestmentPlaybook';
import { formatINR, pnlColor } from '../../utils/formatters';
import { getFamilyMemberConfig } from '../../utils/familyMemberConfig';

interface CashFlowViewProps {
  portfolios: Portfolio[];
}

export default function CashFlowView({ portfolios }: CashFlowViewProps) {
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedOpportunityId, setExpandedOpportunityId] = useState<string | null>(null);

  // Compute 12-month forward timeline
  const timeline = useMemo(() => {
    return calculateCashFlowTimeline(portfolios);
  }, [portfolios]);

  // Compute reinvestment matrix
  const reinvestment = useMemo(() => {
    return generateReinvestmentMatrix(portfolios, 180);
  }, [portfolios]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return timeline.upcomingEvents.filter((ev) => {
      const matchMember = selectedMember === 'all' || ev.portfolioName === selectedMember;
      const matchMonth = selectedMonthKey === 'all' || ev.monthKey === selectedMonthKey;
      const matchCat =
        categoryFilter === 'all'
          ? true
          : categoryFilter === 'inflows'
          ? ev.type === 'inflow'
          : categoryFilter === 'outflows'
          ? ev.type === 'outflow'
          : ev.category === categoryFilter;
      return matchMember && matchMonth && matchCat;
    });
  }, [timeline.upcomingEvents, selectedMember, selectedMonthKey, categoryFilter]);

  const getCategoryIcon = (cat: CashFlowCategory) => {
    switch (cat) {
      case 'fd_maturity':
        return <Landmark size={13} className="text-indigo-600 dark:text-indigo-400" />;
      case 'rd_maturity':
      case 'rd_outflow':
        return <Clock size={13} className="text-purple-600 dark:text-purple-400" />;
      case 'sip_outflow':
        return <TrendingUp size={13} className="text-teal-600 dark:text-teal-400" />;
      case 'sgb_coupon':
        return <Coins size={13} className="text-amber-600 dark:text-amber-400" />;
      case 'rental_income':
        return <Home size={13} className="text-emerald-600 dark:text-emerald-400" />;
      case 'insurance_premium':
        return <Shield size={13} className="text-rose-600 dark:text-rose-400" />;
      default:
        return <Calendar size={13} className="text-[var(--accent-blue)]" />;
    }
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* 1. Unified Single-Banner Header */}
      <div className="apple-card p-2.5 sm:p-3.5 space-y-2.5 sm:space-y-3">
        {/* Row 1: Identity & Subtitle */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[var(--radius-small)] bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Calendar size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                  Predictive Cash Flow &amp; Reinvestment Matrix
                </h3>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 sm:py-0.5 rounded-[var(--radius-pill)] bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 uppercase tracking-wider shrink-0">
                  Combined
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[var(--text-tertiary)] truncate">
                12-month forward predictive liquidity, recurring commitments &amp; auto-maturity tax playbook
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: 4 Summary Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-xs">
          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">
              12M Projected Inflow
            </span>
            <span className="text-xs sm:text-sm font-bold text-[var(--positive)] tnum mt-0.5 block truncate">
              +{formatINR(timeline.totalInflow12M)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">
              12M Total Outflows
            </span>
            <span className="text-xs sm:text-sm font-bold text-[var(--negative)] tnum mt-0.5 block truncate">
              -{formatINR(timeline.totalOutflow12M)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">
              Net Liquidity Delta
            </span>
            <span className={`text-xs sm:text-sm font-bold tnum mt-0.5 block truncate ${pnlColor(timeline.netCashFlow12M)}`}>
              {timeline.netCashFlow12M >= 0 ? '+' : ''}{formatINR(timeline.netCashFlow12M)}
            </span>
          </div>

          <div className="p-1.5 sm:p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">
              Upcoming Reinvest Pool
            </span>
            <span className="text-xs sm:text-sm font-bold text-indigo-700 dark:text-indigo-400 tnum mt-0.5 block truncate">
              {formatINR(timeline.reinvestmentPool12M)}
            </span>
          </div>
        </div>

        {/* Row 3: Family Members Breakdown: 3 compact columns on mobile */}
        {timeline.memberBreakdown.length > 0 && (
          <div className="pt-1.5 sm:pt-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-1 sm:mb-1.5">
              <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">
                Family Members Cash Flow Breakdown
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
                  {timeline.upcomingEvents.length} Total Cash Events
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
              {timeline.memberBreakdown.map((m) => {
                const config = getFamilyMemberConfig(m.name);
                const isSelected = selectedMember === m.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setSelectedMember((prev) => (prev === m.name ? 'all' : m.name))}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-1.5 sm:p-2 min-h-[44px] justify-center rounded-[var(--radius-small)] border transition-all cursor-pointer text-left ios-press min-w-0 ${
                      isSelected
                        ? 'bg-[var(--surface-secondary)] border-blue-500 ring-1 ring-blue-500/30 shadow-xs'
                        : 'bg-[var(--surface)] border-[var(--border-subtle)] hover:border-blue-500/40'
                    }`}
                    title={`Click to filter ${m.label}'s cash flows`}
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
                            <span className="hidden xs:inline text-[8px] font-bold px-1 rounded bg-blue-500/20 text-blue-700 dark:text-blue-400">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[9.5px] sm:text-[10px] text-[var(--text-tertiary)] hidden sm:block">
                          {m.eventCount} event{m.eventCount === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0 mt-1 sm:mt-0">
                      <p className={`text-[10.5px] sm:text-xs font-bold tnum truncate ${pnlColor(m.netDelta)}`}>
                        {m.netDelta >= 0 ? '+' : ''}{formatINR(m.netDelta)}
                      </p>
                      <p className="text-[9.5px] sm:text-[10px] font-semibold text-[var(--text-secondary)] tnum truncate">
                        In: {formatINR(m.totalInflow)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Interactive 12-Month Timeline Matrix */}
      <div className="apple-card p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500" />
            <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
              12-Month Inflow &amp; Outflow Matrix
            </h4>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="flex items-center gap-1 text-[var(--positive)]">
              <span className="w-2 h-2 rounded-full bg-[var(--positive)]" />
              <span>Inflow</span>
            </span>
            <span className="flex items-center gap-1 text-[var(--negative)]">
              <span className="w-2 h-2 rounded-full bg-[var(--negative)]" />
              <span>Outflow</span>
            </span>
            {selectedMonthKey !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedMonthKey('all')}
                className="font-bold text-[var(--accent-blue)] underline ml-1 cursor-pointer"
              >
                Reset Month
              </button>
            )}
          </div>
        </div>

        {/* 12-Month Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {timeline.months.map((m) => {
            const isSelected = selectedMonthKey === m.monthKey;
            return (
              <button
                key={m.monthKey}
                type="button"
                onClick={() => setSelectedMonthKey((prev) => (prev === m.monthKey ? 'all' : m.monthKey))}
                className={`p-2 rounded-[var(--radius-small)] border text-left transition-all cursor-pointer ios-press ${
                  isSelected
                    ? 'bg-[var(--surface-secondary)] border-[var(--accent-blue)] ring-1 ring-[var(--accent-blue)]/30'
                    : 'bg-[var(--surface)] border-[var(--border-subtle)] hover:border-[var(--accent-blue)]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10.5px] font-bold text-[var(--text-primary)]">
                    {m.monthLabel.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-[var(--text-tertiary)]">
                    {m.monthLabel.split(' ')[1]}
                  </span>
                </div>

                <div className="space-y-0.5 text-[9.5px] tnum">
                  <div className="flex items-center justify-between text-[var(--positive)] font-semibold">
                    <span>In:</span>
                    <span>+{formatINR(m.inflows)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[var(--negative)] font-semibold">
                    <span>Out:</span>
                    <span>-{formatINR(m.outflows)}</span>
                  </div>
                  <div className={`flex items-center justify-between font-bold pt-1 border-t border-[var(--border-subtle)] ${pnlColor(m.netDelta)}`}>
                    <span>Net:</span>
                    <span>{m.netDelta >= 0 ? '+' : ''}{formatINR(m.netDelta)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Auto-Maturity Reinvestment Playbook Matrix */}
      {reinvestment.opportunities.length > 0 && (
        <div className="apple-card p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                <Sparkles size={12} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                  Auto-Maturity Reinvestment Matrix &amp; Tax Arbitrage
                </h4>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {reinvestment.maturingCount} deposit{reinvestment.maturingCount === 1 ? '' : 's'} coming due totaling{' '}
                  <span className="font-bold text-indigo-700 dark:text-indigo-400">
                    {formatINR(reinvestment.totalUpcomingMaturitiesAmount)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {reinvestment.opportunities.map((opp) => {
              const isExpanded = expandedOpportunityId === opp.id;
              return (
                <div
                  key={opp.id}
                  className="rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface-secondary)]/30 overflow-hidden"
                >
                  <div
                    onClick={() => setExpandedOpportunityId((prev) => (prev === opp.id ? null : opp.id))}
                    className="p-2.5 sm:p-3 flex items-center justify-between flex-wrap gap-2 cursor-pointer hover:bg-[var(--surface-secondary)]/70 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-[var(--radius-small)] bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Landmark size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {opp.title}
                          </p>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400">
                            Matures in {opp.daysToMaturity} days ({opp.maturityDate})
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-tertiary)]">
                          Owner: <span className="font-semibold text-[var(--text-primary)]">{opp.ownerLabel}</span> • Currently @ {opp.currentInterestRate}% p.a.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[10px] text-[var(--text-tertiary)] block uppercase font-bold">Maturing Value</span>
                        <span className="text-xs sm:text-sm font-bold text-[var(--positive)] tnum">
                          {formatINR(opp.maturityAmount)}
                        </span>
                      </div>
                      <div className="text-[var(--text-tertiary)]">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* Reinvestment Options Grid */}
                  {isExpanded && (
                    <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--surface)] space-y-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Tactical Reinvestment Paths &amp; Family Tax Arbitrage
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {opp.playbookOptions.map((opt, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface-secondary)]/40 flex flex-col justify-between space-y-2"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-400">
                                  {opt.badge}
                                </span>
                                <span className="text-xs font-bold text-[var(--positive)] tnum">
                                  {opt.expectedPreTaxReturn}% p.a.
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-[var(--text-primary)] mb-1">
                                {opt.title}
                              </h5>
                              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed mb-1.5">
                                {opt.rationale}
                              </p>
                              <div className="p-1.5 rounded bg-[var(--surface)] border border-[var(--border-subtle)] text-[9.5px] text-[var(--text-tertiary)]">
                                <span className="font-semibold text-[var(--text-primary)]">Tax Strategy:</span>{' '}
                                {opt.taxImplication}
                              </div>
                            </div>

                            {/* Recommended Split */}
                            <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1">
                              <span className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] block">
                                Recommended Family Split:
                              </span>
                              {opt.recommendedMemberSplit.map((s, sIdx) => (
                                <div key={sIdx} className="flex items-center justify-between text-[9.5px]">
                                  <span className="font-semibold text-[var(--text-primary)]">
                                    {s.memberName} ({s.percentage}%)
                                  </span>
                                  <span className="font-bold text-[var(--text-primary)] tnum">
                                    {formatINR(s.allocationAmount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Chronological Cash Flow Events Table */}
      <div className="apple-card overflow-hidden">
        <div className="px-3 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--surface-secondary)] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-[var(--text-primary)]">
              Detailed Events Schedule ({filteredEvents.length})
            </h4>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1 flex-wrap">
            {([
              { id: 'all', label: 'All' },
              { id: 'inflows', label: 'Inflows Only' },
              { id: 'outflows', label: 'Outflows Only' },
              { id: 'fd_maturity', label: 'FD Maturities' },
              { id: 'sip_outflow', label: 'SIP Debits' },
              { id: 'insurance_premium', label: 'Insurances' },
            ] as const).map((filter) => {
              const isActive = categoryFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setCategoryFilter(filter.id)}
                  className={`px-2 py-0.5 rounded-[var(--radius-pill)] text-[10px] font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--accent-blue)] text-white shadow-xs'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-blue)]/50'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="divide-y divide-[var(--border-subtle)] max-h-96 overflow-y-auto">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-tertiary)]">
              No cash flow events found matching the selected filters.
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const memberConfig = getFamilyMemberConfig(ev.portfolioName);
              const isInflow = ev.type === 'inflow';
              return (
                <div
                  key={ev.id}
                  className="p-2.5 sm:px-3 sm:py-2.5 flex items-center justify-between hover:bg-[var(--surface-secondary)]/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                      {getCategoryIcon(ev.category)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] sm:text-xs font-bold text-[var(--text-primary)] truncate">
                          {ev.title}
                        </span>
                        <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-tertiary)] uppercase">
                          {ev.categoryLabel}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-[var(--text-tertiary)] truncate">
                        {ev.date} • {ev.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${memberConfig.bg} ${memberConfig.text}`} title={ev.portfolioName}>
                      {memberConfig.icon}
                    </div>
                    <div className="text-right">
                      <span className={`text-xs sm:text-sm font-bold tnum ${isInflow ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                        {isInflow ? '+' : '-'}{formatINR(ev.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

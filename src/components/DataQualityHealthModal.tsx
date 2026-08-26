import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  ChevronRight,
  Activity
} from './icons/AppIcons';
import Modal from './Modal';
import { Button } from './ui/Button';
import {
  HealthIssue,
  PortfolioHealthSummary,
  saveHealthSnapshot,
  getHealthHistory,
  getMonthlyResolvedCount,
  HealthSnapshot
} from '../utils/dataQuality';
import { AssetTab } from '../types/portfolio';

interface DataQualityHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthSummary: PortfolioHealthSummary;
  onNavigateAsset?: (tab: AssetTab) => void;
  onRefreshPrices?: () => void;
  isLoadingPrices?: boolean;
}

type HealthFilter = 'all' | 'critical' | 'documents' | 'overdue' | 'valuations';

export default function DataQualityHealthModal({
  isOpen,
  onClose,
  healthSummary,
  onNavigateAsset,
  onRefreshPrices,
  isLoadingPrices = false,
}: DataQualityHealthModalProps) {
  const [activeFilter, setActiveFilter] = useState<HealthFilter>('all');
  const [history, setHistory] = useState<HealthSnapshot[]>([]);
  const [resolvedThisMonth, setResolvedThisMonth] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const updated = saveHealthSnapshot(healthSummary);
      setHistory(updated.length > 0 ? updated : getHealthHistory());
      setResolvedThisMonth(getMonthlyResolvedCount());
    }
  }, [isOpen, healthSummary]);

  const { score, totalChecks, passedChecks, issues, criticalCount, warningCount, infoCount } = healthSummary;

  const filteredIssues = issues.filter(issue => {
    if (activeFilter === 'critical') return issue.severity === 'critical';
    if (activeFilter === 'documents') return issue.category === 'document';
    if (activeFilter === 'overdue') return issue.category === 'deposit' || issue.category === 'sip' || issue.category === 'insurance';
    if (activeFilter === 'valuations') return issue.category === 'valuation' || issue.category === 'market_data';
    return true;
  });

  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-[var(--positive)] bg-[var(--positive-soft)] border-[var(--positive)]/30';
    if (s >= 70) return 'text-[var(--warning)] bg-[var(--warning-soft)] border-[var(--warning)]/30';
    return 'text-[var(--negative)] bg-[var(--negative-soft)] border-[var(--negative)]/30';
  };

  const getScoreBadge = (s: number) => {
    if (s >= 95) return { grade: 'A+', label: 'Excellent Data Quality', icon: <ShieldCheck size={20} className="text-[var(--positive)]" /> };
    if (s >= 85) return { grade: 'A', label: 'Healthy & Verified', icon: <ShieldCheck size={20} className="text-[var(--positive)]" /> };
    if (s >= 70) return { grade: 'B', label: 'Minor Issues Detected', icon: <AlertTriangle size={20} className="text-[var(--warning)]" /> };
    return { grade: 'C', label: 'Action Required', icon: <ShieldAlert size={20} className="text-[var(--negative)]" /> };
  };

  const badge = getScoreBadge(score);

  const handleAction = (issue: HealthIssue) => {
    if (issue.id === 'market-stale-price-sync' && onRefreshPrices) {
      onRefreshPrices();
      return;
    }
    if (onNavigateAsset) {
      onNavigateAsset(issue.assetTab);
      onClose();
    }
  };

  const lastSnapshot = history.length > 1 ? history[history.length - 2] : null;
  const scoreDiff = lastSnapshot ? score - lastSnapshot.score : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🛡️ Portfolio Data Quality & Health Check"
      maxWidth="max-w-2xl"
    >
      <div className="p-5 space-y-5">
        {/* Score & Summary Banner */}
        <div className={`p-4 rounded-[var(--radius-large)] border flex flex-col sm:flex-row items-center justify-between gap-4 ${getScoreColor(score)}`}>
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm flex flex-col items-center justify-center border border-inherit shrink-0">
              <span className="text-xl font-black leading-none">{score}</span>
              <span className="text-[10px] font-bold opacity-70">/ 100</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm">
                {badge.icon}
                <span>{badge.label} (Grade {badge.grade})</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {passedChecks} of {totalChecks} data integrity checks passed across all portfolios.
              </p>
              {lastSnapshot && (
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Activity size={12} className="text-blue-500" />
                    Last audit: {new Date(lastSnapshot.timestamp).toLocaleDateString()}
                  </span>
                  {scoreDiff !== 0 && (
                    <span className={`font-bold ${scoreDiff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      ({scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff} pts vs previous)
                    </span>
                  )}
                  {resolvedThisMonth > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      • {resolvedThisMonth} fixed this month
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onRefreshPrices && (
              <Button
                variant="secondary"
                onClick={onRefreshPrices}
                disabled={isLoadingPrices}
                className="text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <RefreshCw size={13} className={isLoadingPrices ? 'animate-spin' : ''} />
                <span>Sync Prices</span>
              </Button>
            )}
          </div>
        </div>

        {/* Severity Metrics Strip */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-[var(--radius-medium)]">
            <span className="text-red-600 dark:text-red-400 font-bold text-base block">{criticalCount}</span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Critical Issues</span>
          </div>
          <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-[var(--radius-medium)]">
            <span className="text-amber-600 dark:text-amber-400 font-bold text-base block">{warningCount}</span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Warnings</span>
          </div>
          <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-[var(--radius-medium)]">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-base block">{infoCount}</span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Missing Docs / Info</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'all', label: `All (${issues.length})` },
            { id: 'critical', label: `Critical (${criticalCount})` },
            { id: 'overdue', label: 'Overdue & Maturities' },
            { id: 'documents', label: 'Missing Docs' },
            { id: 'valuations', label: 'Prices & Values' },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id as HealthFilter)}
              className={`shrink-0 px-3 py-1.5 rounded-[var(--radius-medium)] font-bold text-[11px] transition-all ios-press ${
                activeFilter === f.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Issues List */}
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
          {filteredIssues.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-700/50 rounded-[var(--radius-large)] space-y-2">
              <CheckCircle2 size={32} className="text-emerald-500 mx-auto" />
              <h5 className="text-sm font-bold text-[var(--text-primary)]">Everything Looks Clean!</h5>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                No issues detected in this category. Your portfolio records, valuations, and linked vault documents are in great shape.
              </p>
            </div>
          ) : (
            filteredIssues.map(issue => (
              <div
                key={issue.id}
                className="p-3.5 bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-blue-400 dark:hover:border-blue-600 rounded-[var(--radius-medium)] flex items-start justify-between gap-3 transition-colors group"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="mt-0.5 shrink-0">
                    {issue.severity === 'critical' && <AlertCircle size={16} className="text-red-500" />}
                    {issue.severity === 'warning' && <AlertTriangle size={16} className="text-amber-500" />}
                    {issue.severity === 'info' && (issue.category === 'document' ? <FileCheck size={16} className="text-blue-500" /> : <Info size={16} className="text-blue-400" />)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[var(--text-primary)]">{issue.title}</span>
                      {issue.portfolioLabel && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 font-medium">
                          {issue.portfolioLabel}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                        {issue.assetTab}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                      {issue.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAction(issue)}
                  className="shrink-0 flex items-center justify-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline px-3.5 py-2.5 min-h-[44px] min-w-[44px] rounded-[var(--radius-small)] bg-blue-50 dark:bg-blue-950/50 group-hover:bg-blue-600 group-hover:text-white transition-all ios-press touch-manipulation cursor-pointer"
                >
                  <span>{issue.actionLabel || 'Fix'}</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer tip */}
        <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
          <span>Tip: Complete records and linked receipts protect your family's estate planning.</span>
          <Button variant="secondary" onClick={onClose} className="text-xs py-2.5 px-4 min-h-[44px]">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

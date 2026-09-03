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
      <div className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-5">
        {/* Score & Summary Banner */}
        <div className={`p-4 rounded-[var(--radius-large)] border flex flex-col sm:flex-row items-center justify-between gap-4 ${getScoreColor(score)}`}>
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-[var(--radius-large)] bg-[var(--surface)] shadow-xs flex flex-col items-center justify-center border border-inherit shrink-0">
              <span className="text-xl font-black leading-none text-[var(--text-primary)] tnum">{score}</span>
              <span className="text-[10px] font-bold text-[var(--text-tertiary)] opacity-80">/ 100</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm">
                {badge.icon}
                <span className="text-[var(--text-primary)]">{badge.label} (Grade {badge.grade})</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {passedChecks} of {totalChecks} data integrity checks passed across all portfolios.
              </p>
              {lastSnapshot && (
                <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-tertiary)] flex-wrap">
                  <span className="flex items-center gap-1">
                    <Activity size={12} className="text-[var(--accent-blue)]" />
                    Last audit: {new Date(lastSnapshot.timestamp).toLocaleDateString()}
                  </span>
                  {scoreDiff !== 0 && (
                    <span className={`font-bold tnum ${scoreDiff > 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                      ({scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff} pts vs previous)
                    </span>
                  )}
                  {resolvedThisMonth > 0 && (
                    <span className="text-[var(--positive)] font-medium">
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
          <div className="p-2.5 bg-[var(--negative-soft)] border border-[var(--negative)]/30 rounded-[var(--radius-medium)]">
            <span className="text-[var(--negative)] font-bold text-base block tnum">{criticalCount}</span>
            <span className="text-[11px] text-[var(--text-secondary)] font-medium">Critical Issues</span>
          </div>
          <div className="p-2.5 bg-[var(--warning-soft)] border border-[var(--warning)]/30 rounded-[var(--radius-medium)]">
            <span className="text-[var(--warning)] font-bold text-base block tnum">{warningCount}</span>
            <span className="text-[11px] text-[var(--text-secondary)] font-medium">Warnings</span>
          </div>
          <div className="p-2.5 bg-[var(--accent-blue-soft)] border border-[var(--accent-blue)]/30 rounded-[var(--radius-medium)]">
            <span className="text-[var(--accent-blue)] font-bold text-base block tnum">{infoCount}</span>
            <span className="text-[11px] text-[var(--text-secondary)] font-medium">Missing Docs / Info</span>
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
              className={`shrink-0 px-3 py-1.5 rounded-[var(--radius-medium)] font-bold text-[11px] transition-all ios-press cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-[var(--accent-blue)] text-white shadow-xs'
                  : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Issues List */}
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
          {filteredIssues.length === 0 ? (
            <div className="p-8 text-center bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-large)] space-y-2">
              <CheckCircle2 size={32} className="text-[var(--positive)] mx-auto" />
              <h5 className="text-sm font-bold text-[var(--text-primary)]">Everything Looks Clean!</h5>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                No issues detected in this category. Your portfolio records, valuations, and linked vault documents are in great shape.
              </p>
            </div>
          ) : (
            filteredIssues.map(issue => (
              <div
                key={issue.id}
                className="p-3.5 bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-blue)]/50 rounded-[var(--radius-medium)] flex items-start justify-between gap-3 transition-colors group"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="mt-0.5 shrink-0">
                    {issue.severity === 'critical' && <AlertCircle size={16} className="text-[var(--negative)]" />}
                    {issue.severity === 'warning' && <AlertTriangle size={16} className="text-[var(--warning)]" />}
                    {issue.severity === 'info' && (issue.category === 'document' ? <FileCheck size={16} className="text-[var(--accent-blue)]" /> : <Info size={16} className="text-[var(--accent-blue)]" />)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[var(--text-primary)]">{issue.title}</span>
                      {issue.portfolioLabel && (
                        <span className="px-1.5 py-0.5 rounded-[var(--radius-small)] text-[10px] bg-[var(--surface-secondary)] text-[var(--text-secondary)] font-medium">
                          {issue.portfolioLabel}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded-[var(--radius-small)] text-[9px] uppercase font-bold tracking-wider bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]">
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
                  className="shrink-0 flex items-center justify-center gap-1 text-xs font-bold text-[var(--accent-blue)] hover:underline px-3.5 py-2.5 min-h-[44px] min-w-[44px] rounded-[var(--radius-small)] bg-[var(--accent-blue-soft)] group-hover:bg-[var(--accent-blue)] group-hover:text-white transition-all ios-press touch-manipulation cursor-pointer"
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
          <span className="font-semibold text-[var(--text-secondary)]">Audit Status: Healthy</span>
        </div>
      </div>
    </Modal>
  );
}

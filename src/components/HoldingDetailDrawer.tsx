import React, { useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Pencil, Trash2, Share2, ExternalLink } from './icons/AppIcons';
import { Holding } from '../types/portfolio';
import { formatINR, formatNumber, formatPercent } from '../utils/formatters';
import { usePrivacy } from '../contexts/PrivacyContext';
import { calcHoldingTodayPnL } from '../domains/portfolio/calculations/portfolioTotals';


interface HoldingDetailDrawerProps {
  holding: Holding | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (holding: Holding) => void;
  onDelete?: (holding: Holding) => void;
  onShare?: (holding: Holding) => void;
}

export const HoldingDetailDrawer: React.FC<HoldingDetailDrawerProps> = ({
  holding,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onShare,
}) => {
  const { isBalancesHidden } = usePrivacy();
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';

    // Auto-focus first interactive element
    const rafId = requestAnimationFrame(() => {
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable && focusable.length > 0) focusable[0].focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(rafId);
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen || !holding) return null;

  const renderVal = (val: number, formatter = formatINR) => {
    if (isBalancesHidden) return '••••••';
    return formatter(val);
  };

  const isUp = (holding.todayPnLPercent ?? 0) >= 0;
  const isOverallProfit = (holding.unrealizedPnL ?? 0) >= 0;
  const todayPnLAmount = calcHoldingTodayPnL(holding);

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-stretch justify-center sm:justify-end" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[var(--backdrop-overlay)] backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-Over Drawer Container (Desktop) & Bottom Sheet (Mobile) */}
      <div 
        ref={drawerRef}
        className="relative z-10 w-full sm:max-w-md max-h-[88vh] sm:max-h-full h-auto sm:h-full bg-[var(--surface)] border-t sm:border-t-0 sm:border-l border-[var(--border-subtle)] rounded-t-2xl sm:rounded-none shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 animate-slide-in pb-safe"
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-10 h-1 rounded-full bg-[var(--border-subtle)] mx-auto mt-2.5 mb-1 sm:hidden" aria-hidden="true" />

        {/* Drawer Header */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface-secondary)]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-small)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] font-bold text-xs flex items-center justify-center shrink-0 border border-[var(--border-subtle)] uppercase">
              {holding.ticker.slice(0, 2)}
            </div>
            <div>
              <h2 id="drawer-title" className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                {holding.ticker}
              </h2>
              <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[220px]">
                {holding.stockName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] rounded-[var(--radius-small)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors ios-press touch-manipulation cursor-pointer"
            aria-label="Close holding details drawer"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Real-time Price & Day Movement */}
          <div className="apple-card p-4">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">
              Live Market Price (LTP)
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)] tnum">
                ₹{formatNumber(holding.ltp)}
              </span>
              <div className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-[var(--radius-pill)] tnum ${
                isUp ? 'bg-[var(--positive-soft)] text-[var(--positive)]' : 'bg-[var(--negative-soft)] text-[var(--negative)]'
              }`}>
                {isUp ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={12} aria-hidden="true" />}
                <span>
                  {isUp ? '+' : ''}{formatINR(todayPnLAmount)} ({formatPercent(holding.todayPnLPercent ?? 0)})
                </span>
              </div>
            </div>
          </div>

          {/* Holdings Valuation Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
              Your Position
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="apple-card p-3">
                <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Quantity</span>
                <span className="text-sm font-bold text-[var(--text-primary)] tnum mt-0.5 block">
                  {renderVal(holding.qty, (v) => formatNumber(v, 0))} shares
                </span>
              </div>

              <div className="apple-card p-3">
                <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Average Price</span>
                <span className="text-sm font-bold text-[var(--text-primary)] tnum mt-0.5 block">
                  {isBalancesHidden ? '••••••' : `₹${formatNumber(holding.avgPrice)}`}
                </span>
              </div>

              <div className="apple-card p-3">
                <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Total Invested</span>
                <span className="text-sm font-bold text-[var(--text-primary)] tnum mt-0.5 block">
                  {renderVal(holding.amountInvested)}
                </span>
              </div>

              <div className="apple-card p-3">
                <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Current Value</span>
                <span className="text-sm font-bold text-[var(--text-primary)] tnum mt-0.5 block">
                  {renderVal(holding.currentValue)}
                </span>
              </div>
            </div>

            {/* Overall P&L Banner */}
            <div className={`apple-card p-3.5 flex items-center justify-between border ${
              isOverallProfit ? 'border-[var(--positive)]/20 bg-[var(--positive-soft)]' : 'border-[var(--negative)]/20 bg-[var(--negative-soft)]'
            }`}>
              <div>
                <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">
                  Total Profit &amp; Loss
                </span>
                <span className={`text-base font-bold tnum ${isOverallProfit ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                  {isBalancesHidden ? '••••••' : <>{isOverallProfit ? '+' : ''}{formatINR(holding.unrealizedPnL)}</>}
                </span>
              </div>

              <span className={`text-xs font-bold px-2 py-1 rounded-[var(--radius-pill)] tnum ${
                isOverallProfit ? 'bg-[var(--positive)] text-white' : 'bg-[var(--negative)] text-white'
              }`}>
                {isBalancesHidden ? '••••••' : formatPercent(holding.pnlPercent)}
              </span>
            </div>
          </div>

          {/* Yahoo Finance External Link */}
          {holding.yahooSymbol && (
            <a
              href={`https://finance.yahoo.com/quote/${encodeURIComponent(holding.yahooSymbol)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-[var(--radius-medium)] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ios-press"
            >
              <span className="flex items-center gap-2">
                <ExternalLink size={14} aria-hidden="true" />
                View Detailed Chart on Yahoo Finance
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)] font-bold">{holding.yahooSymbol}</span>
            </a>
          )}
        </div>

        {/* Drawer Action Footer */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--surface)] flex items-center gap-2.5">
          {onShare && (
            <button
              onClick={() => onShare(holding)}
              className="flex-1 py-2.5 px-3 rounded-[var(--radius-medium)] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] text-xs font-bold text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-colors ios-press"
            >
              <Share2 size={14} aria-hidden="true" />
              Share
            </button>
          )}

          {onEdit && (
            <button
              onClick={() => {
                onClose();
                onEdit(holding);
              }}
              className="flex-1 py-2.5 px-3 rounded-[var(--radius-medium)] bg-[var(--accent-blue)] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-opacity hover:opacity-90 ios-press"
            >
              <Pencil size={14} aria-hidden="true" />
              Edit Holding
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => {
                onClose();
                onDelete(holding);
              }}
              className="py-2.5 px-3 rounded-[var(--radius-medium)] border border-[var(--negative)]/30 text-[var(--negative)] hover:bg-[var(--negative-soft)] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ios-press"
              title="Delete holding"
              aria-label="Delete holding"
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(HoldingDetailDrawer);

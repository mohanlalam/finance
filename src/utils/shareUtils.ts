import { Holding } from '../types/portfolio';
import { formatINR, formatNumber, formatPercent } from './formatters';

export async function shareHolding(holding: Holding, addToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void) {
  const isGain = holding.unrealizedPnL >= 0;
  const pnlPrefix = isGain ? '+' : '';
  const formattedDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const text = `Check out my holding in ${holding.ticker} (${holding.stockName}):
Qty: ${formatNumber(holding.qty)}
Invested: ${formatINR(holding.amountInvested)}
Current Value: ${formatINR(holding.currentValue)}
P&L: ${pnlPrefix}${formatINR(holding.unrealizedPnL)} (${formatPercent(holding.pnlPercent)})

Date: ${formattedDate}

— Shared via Family Wealth Tracker`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `${holding.ticker} Holding Summary`,
        text: text,
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        copyToClipboard(text, addToast);
      }
    }
  } else {
    copyToClipboard(text, addToast);
  }
}

export async function sharePortfolioSummary(summary: { name: string; totalValue: number; totalPnL: number; totalPnLPercent: number }, addToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void) {
  const isGain = summary.totalPnL >= 0;
  const pnlPrefix = isGain ? '+' : '';
  const formattedDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const text = `Portfolio Summary (${summary.name}):
Total Value: ${formatINR(summary.totalValue)}
Total P&L: ${pnlPrefix}${formatINR(summary.totalPnL)} (${formatPercent(summary.totalPnLPercent)})

Date: ${formattedDate}

— Shared via Family Wealth Tracker`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Portfolio Summary: ${summary.name}`,
        text: text,
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        copyToClipboard(text, addToast);
      }
    }
  } else {
    copyToClipboard(text, addToast);
  }
}

function copyToClipboard(text: string, addToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void) {
  navigator.clipboard.writeText(text)
    .then(() => {
      if (addToast) addToast('Copied to clipboard', 'success');
    })
    .catch(() => {
      if (addToast) addToast('Failed to copy', 'error');
    });
}

export async function shareAssetSummary(title: string, details: string, addToast?: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void) {
  const formattedDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const text = `${details}

Date: ${formattedDate}

— Shared via Family Wealth Tracker`;

  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        copyToClipboard(text, addToast);
      }
    }
  } else {
    copyToClipboard(text, addToast);
  }
}

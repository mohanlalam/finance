import { Portfolio } from '../../../types/portfolio';
import { calculateAggregatedPortfolioTotals } from '../../portfolio/calculations/portfolioTotals';
import { classBreakdown, calculateAssetAllocations } from '../../portfolio/calculations/allocation';
import { formatINR, formatPercent } from '../../../utils/formatters';

export function executeNetWorthTool(portfolios: Portfolio[]): string {
  const totals = calculateAggregatedPortfolioTotals(portfolios);
  return `Your total family Net Worth is **${formatINR(totals.totalCurrentValue)}** across ${portfolios.length} portfolios.\n- **Invested Capital**: ${formatINR(totals.totalInvested)}\n- **Overall P&L**: ${formatPercent(totals.totalPnLPercent, 2)} (${formatINR(totals.totalPnL)})\n- **Today's Movement**: ${formatINR(totals.todayPnL)}`;
}

export function executeAllocationTool(portfolios: Portfolio[]): string {
  const breakdown = classBreakdown(portfolios, null);
  const allocations = calculateAssetAllocations(breakdown);
  const lines = allocations.map((a) => `- **${a.label}**: ${formatINR(a.value)} (${a.percentage}%)`);
  return `### Asset Allocation Breakdown\n${lines.join('\n')}`;
}

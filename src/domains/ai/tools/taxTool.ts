import { Portfolio } from '../../../types/portfolio';
import { calculateTaxHarvesting } from '../../taxation/calculations/taxHarvesting';
import { formatINR } from '../../../utils/formatters';

export function executeTaxHarvestingTool(portfolios: Portfolio[]): string {
  const allHoldings = portfolios.flatMap((p) => p.holdings || []);
  const tax = calculateTaxHarvesting(allHoldings);

  if (tax.opportunities.length === 0) {
    return `### Tax Loss Harvesting Analysis\nNo loss-making holdings found. All current equity positions are profitable or flat.`;
  }

  const topOpps = tax.opportunities.slice(0, 5).map(
    (o) =>
      `- **${o.holding.stockName} (${o.holding.ticker})**: Unrealized loss of ${formatINR(Math.abs(o.unrealizedPnL))} (${o.isLTCG ? 'LTCG' : 'STCG'})`
  );

  return `### Tax Loss Harvesting Opportunities\nFound **${tax.opportunities.length} positions** with total harvestable losses of **${formatINR(tax.harvestableLosses)}**.\n\n**Potential Tax Savings**: ~**${formatINR(tax.potentialTaxSavings)}**\n\n**Top Opportunities**:\n${topOpps.join('\n')}\n\n*Note: Educational estimate based on Indian Income Tax FY24-25 rules.*`;
}

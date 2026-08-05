import React from 'react';
import { Portfolio } from '../types/portfolio';
import { calculateTaxHarvesting, TAX_DISCLAIMER } from '../utils/taxUtils';
import { formatINR } from '../utils/formatters';
import { TrendingDown, ShieldAlert } from './icons/AppIcons';

interface TaxHarvestingViewProps {
  portfolio: Portfolio | null;
  portfolios: Portfolio[];
}

export default function TaxHarvestingView({ portfolio, portfolios }: TaxHarvestingViewProps) {
  const holdings = React.useMemo(() => {
    if (portfolio) return portfolio.holdings;
    return portfolios.flatMap(p => p.holdings);
  }, [portfolio, portfolios]);

  const taxData = React.useMemo(() => calculateTaxHarvesting(holdings), [holdings]);
  const ltcgExemptionLimit = 125000;
  const exemptionProgress = Math.min(100, (taxData.ltcgExemptionUsed / ltcgExemptionLimit) * 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="apple-card p-5 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 border border-indigo-100 dark:border-slate-700">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
            <ShieldAlert size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Tax Loss Harvesting</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Sell these holdings before March 31st to offset taxable gains and save up to <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatINR(taxData.potentialTaxSavings)}</span> in taxes.
            </p>
            <div className="mt-2 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 inline-block px-2 py-1 rounded">
              Financial Year 2025–26 (Apr 2025 – Mar 2026)
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
          <span className="text-amber-700 dark:text-amber-400 text-sm font-semibold">⚠️ Wash Sale Alert: Re-buying sold stock within 30 days may disallow tax loss benefit</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="apple-card p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Estimated Tax Liability</span>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-2 tnum">{formatINR(taxData.totalEstimatedTax)}</p>
        </div>
        <div className="apple-card p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">LTCG Exemption Used</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tnum">{formatINR(taxData.ltcgExemptionUsed)} / 1.25L</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-auto">
            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${exemptionProgress}%` }}></div>
          </div>
        </div>
        <div className="apple-card p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Harvestable Loss Potential</span>
          <p className="text-xl font-bold text-red-500 dark:text-red-400 mt-2 tnum">{formatINR(taxData.harvestableLosses)}</p>
        </div>
        <div className="apple-card p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Potential Tax Savings</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-500 mt-2 tnum">{formatINR(taxData.potentialTaxSavings)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="apple-card p-4">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">STCG Breakdown</h4>
          <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
            <span className="text-slate-500">Unrealized STCG</span>
            <span className="font-semibold tnum text-slate-800 dark:text-slate-200">{formatINR(taxData.unrealizedSTCG)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-slate-500">
            <span>Tax Rate</span>
            <span className="font-semibold">20%</span>
          </div>
        </div>
        <div className="apple-card p-4">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">LTCG Breakdown</h4>
          <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
            <span className="text-slate-500">Unrealized LTCG</span>
            <span className="font-semibold tnum text-slate-800 dark:text-slate-200">{formatINR(taxData.unrealizedLTCG)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-slate-500">
            <span>Tax Rate</span>
            <span className="font-semibold">12.5% (over ₹1.25L)</span>
          </div>
        </div>
      </div>

      <div className="apple-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">Harvesting Opportunities</h3>
          <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">
            {taxData.opportunities.length} Holdings
          </span>
        </div>
        {taxData.opportunities.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center">
            <ShieldAlert size={32} className="text-emerald-500 mb-3" />
            <h4 className="text-slate-700 dark:text-slate-300 font-bold mb-1">No Harvestable Losses</h4>
            <p className="text-sm text-slate-500">All your holdings are currently in profit, or you have no stock holdings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ticker</th>
                  <th className="px-4 py-3 font-semibold text-right">Current Loss</th>
                  <th className="px-4 py-3 font-semibold">Holding Type</th>
                  <th className="px-4 py-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {taxData.opportunities.map((opp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{opp.holding.ticker}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-500 tnum">{formatINR(opp.unrealizedPnL)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${opp.isDebtOrGold ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : opp.isLTCG ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {opp.isDebtOrGold ? 'Slab Rate' : opp.isLTCG ? 'LTCG' : 'STCG'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                        <TrendingDown size={12} />
                        Harvest Opportunity
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
        {TAX_DISCLAIMER}
      </div>
    </div>
  );
}

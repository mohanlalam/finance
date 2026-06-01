import React from 'react';
import { Wifi, WifiOff, Plus } from 'lucide-react';
import { Portfolio } from '../types/portfolio';
import { FetchStatus } from '../hooks/useMarketData';
import PortfolioTable from './PortfolioTable';
import FixedDepositView from './FixedDepositView';
import GoldHoldingView from './GoldHoldingView';
import RealEstateView from './RealEstateView';
import InsuranceView from './InsuranceView';
import DocumentVaultView from './DocumentVaultView';
import { pnlColor, formatPercent, formatINR } from '../utils/formatters';

type AssetTab = 'stocks' | 'fd' | 'gold' | 'real_estate' | 'insurance' | 'documents';

interface AssetTabContentProps {
  activeAsset: AssetTab;
  visiblePortfolio: Portfolio | null; // if null, we render the "all" view
  portfolios: Portfolio[];
  priceStatus: FetchStatus;
  onAddHoldingClick: () => void;
  onDeleteStock: (holdingId: string) => Promise<void>;
  onUpdateStock: (holdingId: string, qty: number, avgPrice: number) => Promise<void>;
  onAddAsset: (assetType: string, portfolioName: string, payload: Record<string, unknown>) => Promise<void>;
  onUpdateAsset: (assetType: string, id: string, payload: Record<string, unknown>) => Promise<void>;
  onDeleteAsset: (assetType: string, id: string) => Promise<void>;
}

export default React.memo(function AssetTabContent({
  activeAsset,
  visiblePortfolio,
  portfolios,
  priceStatus,
  onAddHoldingClick,
  onDeleteStock,
  onUpdateStock,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
}: AssetTabContentProps) {
  
  if (visiblePortfolio) {
    // ─── Single Portfolio View ───
    return (
      <div id="portfolio-content" role="tabpanel" aria-labelledby={`tab-${visiblePortfolio.name}`} className="space-y-4">
        {activeAsset === 'stocks' && (
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-base font-bold text-slate-700 dark:text-slate-200">{visiblePortfolio.label} — Stocks & ETFs</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {priceStatus === 'success' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg">
                    <Wifi size={11} />
                    Live prices
                  </span>
                )}
                {priceStatus === 'error' && (
                  <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                    <WifiOff size={11} />
                    Snapshot data
                  </span>
                )}
                <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/40 px-2 py-1 rounded-lg">
                  {visiblePortfolio.holdings.length} stocks &bull; Click column to sort
                </span>
                <button
                  onClick={onAddHoldingClick}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                >
                  <Plus size={13} />
                  Add Holding
                </button>
              </div>
            </div>

            <PortfolioTable
              holdings={visiblePortfolio.holdings}
              totalInvested={visiblePortfolio.holdings.reduce((s, h) => s + h.amountInvested, 0)}
              totalCurrentValue={visiblePortfolio.holdings.reduce((s, h) => s + h.currentValue, 0)}
              totalPnL={visiblePortfolio.holdings.reduce((s, h) => s + h.unrealizedPnL, 0)}
              totalPnLPercent={(() => {
                const inv = visiblePortfolio.holdings.reduce((s, h) => s + h.amountInvested, 0);
                const pnl = visiblePortfolio.holdings.reduce((s, h) => s + h.unrealizedPnL, 0);
                return inv > 0 ? (pnl / inv) * 100 : 0;
              })()}
              onDelete={onDeleteStock}
              onUpdate={onUpdateStock}
            />
          </div>
        )}

        {activeAsset === 'fd' && (
          <FixedDepositView
            fixedDeposits={visiblePortfolio.fixedDeposits}
            documents={visiblePortfolio.documents}
            portfolioName={visiblePortfolio.name}
            onAdd={onAddAsset}
            onUpdate={onUpdateAsset}
            onDelete={onDeleteAsset}
          />
        )}

        {activeAsset === 'gold' && (
          <GoldHoldingView
            goldHoldings={visiblePortfolio.goldHoldings}
            documents={visiblePortfolio.documents}
            portfolioName={visiblePortfolio.name}
            onAdd={onAddAsset}
            onUpdate={onUpdateAsset}
            onDelete={onDeleteAsset}
          />
        )}

        {activeAsset === 'real_estate' && (
          <RealEstateView
            realEstate={visiblePortfolio.realEstate}
            documents={visiblePortfolio.documents}
            portfolioName={visiblePortfolio.name}
            onAdd={onAddAsset}
            onUpdate={onUpdateAsset}
            onDelete={onDeleteAsset}
          />
        )}

        {activeAsset === 'insurance' && (
          <InsuranceView
            insurances={visiblePortfolio.insurances}
            documents={visiblePortfolio.documents}
            portfolioName={visiblePortfolio.name}
            onAdd={onAddAsset}
            onUpdate={onUpdateAsset}
            onDelete={onDeleteAsset}
          />
        )}

        {activeAsset === 'documents' && (
          <DocumentVaultView
            portfolio={visiblePortfolio}
            portfolioName={visiblePortfolio.name}
            onAdd={onAddAsset}
            onDelete={onDeleteAsset}
          />
        )}
      </div>
    );
  }

  // ─── Family Overview View (Aggregated across all members) ───
  return (
    <div id="portfolio-content" role="tabpanel" aria-labelledby="tab-all" className="space-y-4">
      {activeAsset === 'stocks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-700 dark:text-slate-200">All Stock Holdings</h2>
            <button
              onClick={onAddHoldingClick}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <Plus size={13} />
              Add Holding
            </button>
          </div>
          <div className="space-y-6">
            {portfolios.map((p) => (
              <div key={p.name} className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">{p.label}</h3>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  <span className={`text-xs font-bold ${pnlColor(p.totalPnL)}`}>
                    {formatPercent(p.totalPnLPercent, 2)} ({formatINR(p.totalPnL)})
                  </span>
                </div>
                {p.holdings.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    No stock holdings yet.
                  </div>
                ) : (
                  <PortfolioTable
                    holdings={p.holdings}
                    totalInvested={p.holdings.reduce((s, h) => s + h.amountInvested, 0)}
                    totalCurrentValue={p.holdings.reduce((s, h) => s + h.currentValue, 0)}
                    totalPnL={p.holdings.reduce((s, h) => s + h.unrealizedPnL, 0)}
                    totalPnLPercent={(() => {
                      const inv = p.holdings.reduce((s, h) => s + h.amountInvested, 0);
                      const pnl = p.holdings.reduce((s, h) => s + h.unrealizedPnL, 0);
                      return inv > 0 ? (pnl / inv) * 100 : 0;
                    })()}
                    onDelete={onDeleteStock}
                    onUpdate={onUpdateStock}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeAsset === 'fd' && (
        <div className="space-y-8">
          {portfolios.map((p) => (
            <div key={p.name}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">{p.label}</h3>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <FixedDepositView
                fixedDeposits={p.fixedDeposits}
                documents={p.documents}
                portfolioName={p.name}
                onAdd={onAddAsset}
                onUpdate={onUpdateAsset}
                onDelete={onDeleteAsset}
              />
            </div>
          ))}
        </div>
      )}

      {activeAsset === 'gold' && (
        <div className="space-y-8">
          {portfolios.map((p) => (
            <div key={p.name}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">{p.label}</h3>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <GoldHoldingView
                goldHoldings={p.goldHoldings}
                documents={p.documents}
                portfolioName={p.name}
                onAdd={onAddAsset}
                onUpdate={onUpdateAsset}
                onDelete={onDeleteAsset}
              />
            </div>
          ))}
        </div>
      )}

      {activeAsset === 'real_estate' && (
        <div className="space-y-8">
          {portfolios.map((p) => (
            <div key={p.name}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">{p.label}</h3>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <RealEstateView
                realEstate={p.realEstate}
                documents={p.documents}
                portfolioName={p.name}
                onAdd={onAddAsset}
                onUpdate={onUpdateAsset}
                onDelete={onDeleteAsset}
              />
            </div>
          ))}
        </div>
      )}

      {activeAsset === 'insurance' && (
        <div className="space-y-8">
          {portfolios.map((p) => (
            <div key={p.name}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">{p.label}</h3>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <InsuranceView
                insurances={p.insurances}
                documents={p.documents}
                portfolioName={p.name}
                onAdd={onAddAsset}
                onUpdate={onUpdateAsset}
                onDelete={onDeleteAsset}
              />
            </div>
          ))}
        </div>
      )}

      {activeAsset === 'documents' && (
        <div className="space-y-8">
          {portfolios.map((p) => (
            <div key={p.name}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">{p.label}</h3>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <DocumentVaultView
                portfolio={p}
                portfolioName={p.name}
                onAdd={onAddAsset}
                onDelete={onDeleteAsset}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

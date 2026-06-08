import React from 'react';
// Inline SVG icons — keeps lucide-react out of the critical bundle
import { Wifi, WifiOff, Plus } from './icons/AppIcons';
import { Portfolio, AssetPayload } from '../types/portfolio';
import { FetchStatus } from '../hooks/useMarketData';
import AssetCardSkeleton from './AssetCardSkeleton';
// Eagerly loaded (lightweight, always visible on stocks tab)
import { pnlColor, formatPercent, formatINR } from '../utils/formatters';

// Lazy-loaded: only fetched when the user navigates to that tab
const PortfolioTable    = React.lazy(() => import('./PortfolioTable'));
const GoldHoldingView   = React.lazy(() => import('./GoldHoldingView'));
const RealEstateView    = React.lazy(() => import('./RealEstateView'));
const InsuranceView     = React.lazy(() => import('./InsuranceView'));
const DocumentVaultView = React.lazy(() => import('./DocumentVaultView'));
const FixedDepositView  = React.lazy(() => import('./FixedDepositView'));
const RDView            = React.lazy(() => import('./rd/RDView'));
const SIPView           = React.lazy(() => import('./sip/SIPView'));
const SSYView           = React.lazy(() => import('./ssy/SSYView'));


type AssetTab = 'home' | 'stocks' | 'fd' | 'rd' | 'ssy' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | 'widgets';

interface PortfolioOption {
  name: string;
  label: string;
}

interface AssetTabContentProps {
  activeAsset: AssetTab;
  visiblePortfolio: Portfolio | null; // if null, we render the "all" view
  portfolios: Portfolio[];
  priceStatus: FetchStatus;
  onAddHoldingClick: () => void;
  onDeleteStock: (holdingId: string) => Promise<void>;
  onUpdateStock: (holdingId: string, qty: number, avgPrice: number) => Promise<void>;
  onAddAsset: (assetType: string, portfolioName: string, payload: AssetPayload) => Promise<void>;
  onUpdateAsset: (assetType: string, id: string, payload: Partial<AssetPayload>) => Promise<void>;
  onDeleteAsset: (assetType: string, id: string) => Promise<void>;
  quickAddTarget?: 'stocks' | 'fd' | 'rd' | 'ssy' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | null;
  onQuickAddComplete?: () => void;
  portfolioOptions: PortfolioOption[];
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
  quickAddTarget,
  onQuickAddComplete,
  portfolioOptions,
}: AssetTabContentProps) {
  
  React.useEffect(() => {
    if (quickAddTarget && quickAddTarget === activeAsset) {
      onQuickAddComplete?.();
    }
  }, [quickAddTarget, activeAsset, onQuickAddComplete]);
  
  if (visiblePortfolio) {
    // ─── Single Portfolio View ───
    return (
      <div id="portfolio-content" role="tabpanel" aria-labelledby={`tab-${visiblePortfolio.name}`} className="space-y-4">
        <React.Suspense fallback={<AssetCardSkeleton />}>
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

            {(() => {
              // Compute stock totals in one pass to avoid 5 separate reduce calls
              const inv = visiblePortfolio.holdings.reduce((s, h) => s + h.amountInvested, 0);
              const cur = visiblePortfolio.holdings.reduce((s, h) => s + h.currentValue, 0);
              const pnl = visiblePortfolio.holdings.reduce((s, h) => s + h.unrealizedPnL, 0);
              return (
                <PortfolioTable
                  holdings={visiblePortfolio.holdings}
                  totalInvested={inv}
                  totalCurrentValue={cur}
                  totalPnL={pnl}
                  totalPnLPercent={inv > 0 ? (pnl / inv) * 100 : 0}
                  onDelete={onDeleteStock}
                  onUpdate={onUpdateStock}
                />
              );
            })()
          </div>
        )}

        {activeAsset === 'fd' && (
          <FixedDepositView
            fixedDeposits={visiblePortfolio.fixedDeposits.filter(f => f.fd_type === 'regular' || !f.fd_type)}
            documents={visiblePortfolio.documents}
            portfolioName={visiblePortfolio.name}
            portfolioOptions={portfolioOptions}
            onAdd={onAddAsset}
            onUpdate={onUpdateAsset}
            onDelete={onDeleteAsset}
            autoOpenAddModal={quickAddTarget === 'fd'}
          />
        )}

        {activeAsset === 'rd' && (
          <RDView
            documents={visiblePortfolio.documents}
            portfolioName={visiblePortfolio.name}
            portfolioOptions={portfolioOptions}
            autoOpenAddModal={quickAddTarget === 'rd'}
          />
        )}

        {activeAsset === 'ssy' && (
          <SSYView
            documents={visiblePortfolio.documents}
            portfolioName={visiblePortfolio.name}
            portfolioOptions={portfolioOptions}
            autoOpenAddModal={quickAddTarget === 'ssy'}
          />
        )}

        {activeAsset === 'sip' && (
          <SIPView
            documents={visiblePortfolio.documents}
            portfolioName={visiblePortfolio.name}
            portfolioOptions={portfolioOptions}
            autoOpenAddModal={quickAddTarget === 'sip'}
          />
        )}

        {activeAsset === 'gold' && (
          <GoldHoldingView
            goldHoldings={visiblePortfolio.goldHoldings}
            documents={visiblePortfolio.documents}
            portfolioName={visiblePortfolio.name}
            portfolioOptions={portfolioOptions}
            onAdd={onAddAsset}
            onUpdate={onUpdateAsset}
            onDelete={onDeleteAsset}
            autoOpenAddModal={quickAddTarget === 'gold'}
          />
        )}

        {activeAsset === 'real_estate' && (
          <RealEstateView
            realEstate={visiblePortfolio.realEstate}
            documents={visiblePortfolio.documents}
            portfolioName={visiblePortfolio.name}
            portfolioOptions={portfolioOptions}
            onAdd={onAddAsset}
            onUpdate={onUpdateAsset}
            onDelete={onDeleteAsset}
            autoOpenAddModal={quickAddTarget === 'real_estate'}
          />
        )}

        {activeAsset === 'insurance' && (
          <InsuranceView
            insurances={visiblePortfolio.insurances}
            documents={visiblePortfolio.documents}
            portfolioName={visiblePortfolio.name}
            portfolioOptions={portfolioOptions}
            onAdd={onAddAsset}
            onUpdate={onUpdateAsset}
            onDelete={onDeleteAsset}
            autoOpenAddModal={quickAddTarget === 'insurance'}
          />
        )}

        {activeAsset === 'documents' && (
          <DocumentVaultView
            portfolio={visiblePortfolio}
            portfolioName={visiblePortfolio.name}
            portfolioOptions={portfolioOptions}
            portfolios={portfolios}
            onAdd={onAddAsset}
            onDelete={onDeleteAsset}
            autoOpenAddModal={quickAddTarget === 'documents'}
          />
        )}
        </React.Suspense>
      </div>
    );
  }

  // ─── Family Overview View (Aggregated across all members) ───
  return (
    <div id="portfolio-content" role="tabpanel" aria-labelledby="tab-all" className="space-y-4">
      <React.Suspense fallback={<AssetCardSkeleton />}>
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
                  <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl py-10 text-center">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Wifi size={24} className="text-blue-400 dark:text-blue-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">No stock holdings yet</p>
                    <p className="text-xs text-slate-400 dark:text-slate-505">Add stocks or ETFs to start tracking live prices and P&amp;L.</p>
                  </div>
                ) : (
                  {(() => {
                    // Single-pass computation — avoids 5 separate reduce calls
                    const inv = p.holdings.reduce((s, h) => s + h.amountInvested, 0);
                    const cur = p.holdings.reduce((s, h) => s + h.currentValue, 0);
                    const pnl = p.holdings.reduce((s, h) => s + h.unrealizedPnL, 0);
                    return (
                      <PortfolioTable
                        holdings={p.holdings}
                        totalInvested={inv}
                        totalCurrentValue={cur}
                        totalPnL={pnl}
                        totalPnLPercent={inv > 0 ? (pnl / inv) * 100 : 0}
                        onDelete={onDeleteStock}
                        onUpdate={onUpdateStock}
                      />
                    );
                  })()
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeAsset === 'fd' && (
        <div className="space-y-8">
          {portfolios.map((p, index) => (
            <div key={p.name}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">{p.label}</h3>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <FixedDepositView
                fixedDeposits={p.fixedDeposits.filter(f => f.fd_type === 'regular' || !f.fd_type)}
                documents={p.documents}
                portfolioName={p.name}
                portfolioOptions={portfolioOptions}
                onAdd={onAddAsset}
                onUpdate={onUpdateAsset}
                onDelete={onDeleteAsset}
                autoOpenAddModal={index === 0 && quickAddTarget === 'fd'}
              />
            </div>
          ))}
        </div>
      )}

      {activeAsset === 'rd' && (
        <div className="space-y-8">
          {portfolios.map((p, index) => (
            <div key={p.name}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">{p.label}</h3>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <RDView
                documents={p.documents}
                portfolioName={p.name}
                portfolioOptions={portfolioOptions}
                autoOpenAddModal={index === 0 && quickAddTarget === 'rd'}
              />
            </div>
          ))}
        </div>
      )}

      {activeAsset === 'ssy' && (
        <div className="space-y-8">
          {portfolios.map((p, index) => (
            <div key={p.name}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">{p.label}</h3>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <SSYView
                documents={p.documents}
                portfolioName={p.name}
                portfolioOptions={portfolioOptions}
                autoOpenAddModal={index === 0 && quickAddTarget === 'ssy'}
              />
            </div>
          ))}
        </div>
      )}

      {activeAsset === 'sip' && (
        <div className="space-y-8">
          {portfolios.map((p, index) => (
            <div key={p.name}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">{p.label}</h3>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <SIPView
                documents={p.documents}
                portfolioName={p.name}
                portfolioOptions={portfolioOptions}
                autoOpenAddModal={index === 0 && quickAddTarget === 'sip'}
              />
            </div>
          ))}
        </div>
      )}

      {activeAsset === 'gold' && (
        <div className="space-y-8">
          {portfolios.map((p, index) => (
            <div key={p.name}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">{p.label}</h3>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <GoldHoldingView
                goldHoldings={p.goldHoldings}
                documents={p.documents}
                portfolioName={p.name}
                portfolioOptions={portfolioOptions}
                onAdd={onAddAsset}
                onUpdate={onUpdateAsset}
                onDelete={onDeleteAsset}
                autoOpenAddModal={index === 0 && quickAddTarget === 'gold'}
              />
            </div>
          ))}
        </div>
      )}

      {activeAsset === 'real_estate' && (
        <div className="space-y-8">
          {portfolios.map((p, index) => (
            <div key={p.name}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">{p.label}</h3>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <RealEstateView
                realEstate={p.realEstate}
                documents={p.documents}
                portfolioName={p.name}
                portfolioOptions={portfolioOptions}
                onAdd={onAddAsset}
                onUpdate={onUpdateAsset}
                onDelete={onDeleteAsset}
                autoOpenAddModal={index === 0 && quickAddTarget === 'real_estate'}
              />
            </div>
          ))}
        </div>
      )}

      {activeAsset === 'insurance' && (
        <div className="space-y-8">
          {portfolios.map((p, index) => (
            <div key={p.name}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">{p.label}</h3>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <InsuranceView
                insurances={p.insurances}
                documents={p.documents}
                portfolioName={p.name}
                portfolioOptions={portfolioOptions}
                onAdd={onAddAsset}
                onUpdate={onUpdateAsset}
                onDelete={onDeleteAsset}
                autoOpenAddModal={index === 0 && quickAddTarget === 'insurance'}
              />
            </div>
          ))}
        </div>
      )}

      {activeAsset === 'documents' && (
        <div className="space-y-8">
          {portfolios.map((p, index) => (
            <div key={p.name}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">{p.label}</h3>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <DocumentVaultView
                portfolio={p}
                portfolioName={p.name}
                portfolioOptions={portfolioOptions}
                portfolios={portfolios}
                onAdd={onAddAsset}
                onDelete={onDeleteAsset}
                autoOpenAddModal={index === 0 && quickAddTarget === 'documents'}
              />
            </div>
          ))}
        </div>
      )}
      </React.Suspense>
    </div>
  );
});

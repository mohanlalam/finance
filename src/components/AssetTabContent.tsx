import React from 'react';
// Inline SVG icons — keeps lucide-react out of the critical bundle
import { Wifi, WifiOff, Plus } from './icons/AppIcons';
import { Portfolio, AssetPayload } from '../types/portfolio';
import { FetchStatus } from '../types/portfolio';
import AssetCardSkeleton from './AssetCardSkeleton';
import EmptyState from './EmptyState';
// Eagerly loaded (lightweight, always visible on stocks tab)
import { pnlColor, formatPercent, formatINR } from '../utils/formatters';

// Lazy-loaded: only fetched when the user navigates to that tab
const PortfolioTable    = React.lazy(() => import('./PortfolioTable'));
const GoldHoldingView   = React.lazy(() => import('./gold/GoldHoldingView'));
const RealEstateView    = React.lazy(() => import('./realestate/RealEstateView'));
const InsuranceView     = React.lazy(() => import('./insurance/InsuranceView'));
const DocumentVaultView = React.lazy(() => import('./documents/DocumentVaultView'));
const FixedDepositView  = React.lazy(() => import('./fd/FixedDepositView'));
const RDView            = React.lazy(() => import('./rd/RDView'));
const SIPView           = React.lazy(() => import('./sip/SIPView'));
const TaxHarvestingView = React.lazy(() => import('./tax/TaxHarvestingView'));
const CashFlowView      = React.lazy(() => import('./cashflow/CashFlowView'));

type AssetTab = 'home' | 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | 'widgets' | 'tax' | 'cashflow';

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
  onAddAsset: (assetType: string, portfolioName: string, payload: AssetPayload) => Promise<{ id?: string } | undefined | void>;
  onUpdateAsset: (assetType: string, id: string, payload: Partial<AssetPayload>) => Promise<void>;
  onDeleteAsset: (assetType: string, id: string) => Promise<void>;
  quickAddTarget?: 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | null;
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

  const singleStockTotals = React.useMemo(() => {
    if (!visiblePortfolio) return { inv: 0, cur: 0, pnl: 0 };
    return visiblePortfolio.holdings.reduce(
      (acc, h) => {
        acc.inv += h.amountInvested;
        acc.cur += h.currentValue;
        acc.pnl += h.unrealizedPnL;
        return acc;
      },
      { inv: 0, cur: 0, pnl: 0 }
    );
  }, [visiblePortfolio]);

  const totalsMap = React.useMemo(() => {
    const map = new Map<string, { inv: number; cur: number; pnl: number }>();
    for (const p of portfolios) {
      const totals = p.holdings.reduce(
        (acc, h) => {
          acc.inv += h.amountInvested;
          acc.cur += h.currentValue;
          acc.pnl += h.unrealizedPnL;
          return acc;
        },
        { inv: 0, cur: 0, pnl: 0 }
      );
      map.set(p.name, totals);
    }
    return map;
  }, [portfolios]);

  const allFixedDeposits = React.useMemo(() => {
    return portfolios.flatMap((p) =>
      (p.fixedDeposits || [])
        .filter((f) => f.fd_type === 'regular' || !f.fd_type)
        .map((f) => ({ ...f, portfolio_id: f.portfolio_id || p.id }))
    );
  }, [portfolios]);

  const allRDAccounts = React.useMemo(() => {
    return portfolios.flatMap((p) =>
      (p.rdAccounts || []).map((rd) => ({ ...rd, portfolio_id: rd.portfolio_id || p.id }))
    );
  }, [portfolios]);

  const allSIPAccounts = React.useMemo(() => {
    return portfolios.flatMap((p) =>
      (p.sipAccounts || []).map((sip) => ({ ...sip, portfolio_id: sip.portfolio_id || p.id }))
    );
  }, [portfolios]);

  const allGoldHoldings = React.useMemo(() => {
    return portfolios.flatMap((p) =>
      (p.goldHoldings || []).map((g) => ({ ...g, portfolio_id: g.portfolio_id || p.id }))
    );
  }, [portfolios]);

  const allRealEstate = React.useMemo(() => {
    return portfolios.flatMap((p) =>
      (p.realEstate || []).map((re) => ({ ...re, portfolio_id: re.portfolio_id || p.id }))
    );
  }, [portfolios]);

  const allInsurances = React.useMemo(() => {
    return portfolios.flatMap((p) =>
      (p.insurances || []).map((ins) => ({ ...ins, portfolio_id: ins.portfolio_id || p.id }))
    );
  }, [portfolios]);

  const allDocuments = React.useMemo(() => {
    return portfolios.flatMap((p) => p.documents || []);
  }, [portfolios]);
  
  React.useEffect(() => {
    if (quickAddTarget && quickAddTarget === activeAsset) {
      onQuickAddComplete?.();
    }
  }, [quickAddTarget, activeAsset, onQuickAddComplete]);


  if (activeAsset === 'tax') {
    return (
      <div className="tab-transition">
        <React.Suspense fallback={<AssetCardSkeleton />}>
          <TaxHarvestingView portfolio={visiblePortfolio} portfolios={portfolios} />
        </React.Suspense>
      </div>
    );
  }
  
  if (visiblePortfolio) {
    // ─── Single Portfolio View ───
    return (
      <div
        key={`${visiblePortfolio.name}-${activeAsset}`}
        id="portfolio-content"
        role="tabpanel"
        aria-labelledby={`tab-${visiblePortfolio.name}`}
        className="space-y-4 tab-transition"
      >
        <React.Suspense fallback={<AssetCardSkeleton />}>
          {activeAsset === 'stocks' && (
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--text-primary)]">{visiblePortfolio.label}</h2>
                <span className={`flex items-center gap-1.5 text-xs font-bold ${pnlColor(visiblePortfolio.totalPnL)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${visiblePortfolio.totalPnL >= 0 ? 'bg-[var(--positive)]' : 'bg-[var(--negative)]'}`} />
                  {formatPercent(visiblePortfolio.totalPnLPercent, 2)} ({formatINR(visiblePortfolio.totalPnL)})
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {priceStatus === 'success' && (
                  <span className="flex items-center gap-1 text-xs text-[var(--positive)] bg-[var(--positive-soft)] px-2 py-1 rounded-[var(--radius-small)]">
                    <Wifi size={11} />
                    Live prices
                  </span>
                )}
                {priceStatus === 'error' && (
                  <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)] bg-[var(--surface-secondary)] px-2 py-1 rounded-[var(--radius-small)]">
                    <WifiOff size={11} />
                    Snapshot data
                  </span>
                )}
                <span className="text-xs text-[var(--text-tertiary)] bg-[var(--surface-secondary)] px-2 py-1 rounded-[var(--radius-small)]">
                  {visiblePortfolio.holdings.length} stocks &bull; Click column to sort
                </span>
                <button
                  onClick={onAddHoldingClick}
                  className="flex items-center gap-1.5 bg-[var(--accent-blue)] hover:brightness-110 text-white text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-small)] transition-colors shadow-sm ios-press cursor-pointer"
                >
                  <Plus size={13} />
                  Add Holding
                </button>
              </div>
            </div>

            <PortfolioTable
              holdings={visiblePortfolio.holdings}
              totalInvested={singleStockTotals.inv}
              totalCurrentValue={singleStockTotals.cur}
              totalPnL={singleStockTotals.pnl}
              totalPnLPercent={singleStockTotals.inv > 0 ? (singleStockTotals.pnl / singleStockTotals.inv) * 100 : 0}
              onDelete={onDeleteStock}
              onUpdate={onUpdateStock}
            />
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
            rdAccounts={visiblePortfolio.rdAccounts}
            documents={visiblePortfolio.documents}
            portfolioName={visiblePortfolio.name}
            portfolioOptions={portfolioOptions}
            onAdd={onAddAsset}
            onUpdate={onUpdateAsset}
            onDelete={onDeleteAsset}
            autoOpenAddModal={quickAddTarget === 'rd'}
          />
        )}

        {activeAsset === 'sip' && (
          <SIPView
            sipAccounts={visiblePortfolio.sipAccounts}
            documents={visiblePortfolio.documents}
            portfolioName={visiblePortfolio.name}
            portfolioOptions={portfolioOptions}
            onAdd={onAddAsset}
            onUpdate={onUpdateAsset}
            onDelete={onDeleteAsset}
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
    <div
      key={`all-${activeAsset}`}
      id="portfolio-content"
      role="tabpanel"
      aria-labelledby="tab-all"
      className="space-y-4 tab-transition"
    >
      <React.Suspense fallback={<AssetCardSkeleton />}>
        {activeAsset === 'stocks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[var(--text-primary)]">All Stock Holdings</h2>
            <button
              onClick={onAddHoldingClick}
              className="flex items-center gap-1.5 bg-[var(--accent-blue)] hover:brightness-110 text-white text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-small)] transition-colors shadow-sm ios-press cursor-pointer"
            >
              <Plus size={13} />
              Add Holding
            </button>
          </div>
          <div className="space-y-6">
            {portfolios.map((p) => (
              <div key={p.name} className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{p.label}</h3>
                  <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                  <span className={`flex items-center gap-1.5 text-xs font-bold ${pnlColor(p.totalPnL)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.totalPnL >= 0 ? 'bg-[var(--positive)]' : 'bg-[var(--negative)]'}`} />
                    {formatPercent(p.totalPnLPercent, 2)} ({formatINR(p.totalPnL)})
                  </span>
                </div>
                {p.holdings.length === 0 ? (
                  <EmptyState
                    type="stocks"
                    title="No stock holdings yet"
                    description="Add stocks or ETFs to start tracking live prices and P&L."
                    actionButton={
                      <button
                        onClick={onAddHoldingClick}
                        className="inline-flex items-center gap-1.5 bg-[var(--accent-blue)] hover:brightness-110 text-white text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-small)] transition-colors shadow-sm ios-press cursor-pointer"
                      >
                        <Plus size={13} />
                        Add Holding
                      </button>
                    }
                  />
                ) : (
                  <PortfolioTable
                    holdings={p.holdings}
                    totalInvested={totalsMap.get(p.name)?.inv ?? 0}
                    totalCurrentValue={totalsMap.get(p.name)?.cur ?? 0}
                    totalPnL={totalsMap.get(p.name)?.pnl ?? 0}
                    totalPnLPercent={
                      (totalsMap.get(p.name)?.inv ?? 0) > 0
                        ? ((totalsMap.get(p.name)?.pnl ?? 0) / (totalsMap.get(p.name)?.inv ?? 1)) * 100
                        : 0
                    }
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
        <FixedDepositView
          fixedDeposits={allFixedDeposits}
          documents={allDocuments}
          portfolioName="all"
          portfolioOptions={portfolioOptions}
          onAdd={onAddAsset}
          onUpdate={onUpdateAsset}
          onDelete={onDeleteAsset}
          autoOpenAddModal={quickAddTarget === 'fd'}
        />
      )}

      {activeAsset === 'rd' && (
        <RDView
          rdAccounts={allRDAccounts}
          documents={allDocuments}
          portfolioName="all"
          portfolioOptions={portfolioOptions}
          onAdd={onAddAsset}
          onUpdate={onUpdateAsset}
          onDelete={onDeleteAsset}
          autoOpenAddModal={quickAddTarget === 'rd'}
        />
      )}

      {activeAsset === 'sip' && (
        <SIPView
          sipAccounts={allSIPAccounts}
          documents={allDocuments}
          portfolioName="all"
          portfolioOptions={portfolioOptions}
          onAdd={onAddAsset}
          onUpdate={onUpdateAsset}
          onDelete={onDeleteAsset}
          autoOpenAddModal={quickAddTarget === 'sip'}
        />
      )}

      {activeAsset === 'gold' && (
        <GoldHoldingView
          goldHoldings={allGoldHoldings}
          documents={allDocuments}
          portfolioName="all"
          portfolioOptions={portfolioOptions}
          onAdd={onAddAsset}
          onUpdate={onUpdateAsset}
          onDelete={onDeleteAsset}
          autoOpenAddModal={quickAddTarget === 'gold'}
        />
      )}

      {activeAsset === 'real_estate' && (
        <RealEstateView
          realEstate={allRealEstate}
          documents={allDocuments}
          portfolioName="all"
          portfolioOptions={portfolioOptions}
          onAdd={onAddAsset}
          onUpdate={onUpdateAsset}
          onDelete={onDeleteAsset}
          autoOpenAddModal={quickAddTarget === 'real_estate'}
        />
      )}

      {activeAsset === 'insurance' && (
        <InsuranceView
          insurances={allInsurances}
          documents={allDocuments}
          portfolioName="all"
          portfolioOptions={portfolioOptions}
          onAdd={onAddAsset}
          onUpdate={onUpdateAsset}
          onDelete={onDeleteAsset}
          autoOpenAddModal={quickAddTarget === 'insurance'}
        />
      )}

      {activeAsset === 'documents' && (
        <DocumentVaultView
          portfolio={visiblePortfolio || portfolios[0]}
          portfolioName="all"
          portfolioOptions={portfolioOptions}
          portfolios={portfolios}
          onAdd={onAddAsset}
          onDelete={onDeleteAsset}
          autoOpenAddModal={quickAddTarget === 'documents'}
        />
      )}

      {activeAsset === 'cashflow' && (
        <CashFlowView portfolios={portfolios} />
      )}
      </React.Suspense>
    </div>
  );
});

import React from 'react';
import { Portfolio, FetchStatus } from '../types/portfolio';
import AssetCardSkeleton from './AssetCardSkeleton';

// Lazy-loaded: only fetched when the user navigates to that tab
const StocksView        = React.lazy(() => import('./stocks/StocksView'));
const GoldHoldingView   = React.lazy(() => import('./gold/GoldHoldingView'));
const RealEstateView    = React.lazy(() => import('./realestate/RealEstateView'));
const InsuranceView     = React.lazy(() => import('./insurance/InsuranceView'));
const DocumentVaultView = React.lazy(() => import('./documents/DocumentVaultView'));
const FixedDepositView  = React.lazy(() => import('./fd/FixedDepositView'));
const RDView            = React.lazy(() => import('./rd/RDView'));
const SIPView           = React.lazy(() => import('./sip/SIPView'));
const TaxHarvestingView = React.lazy(() => import('./tax/TaxHarvestingView'));

type AssetTab = 'home' | 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | 'widgets' | 'tax';

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
  onAddAsset: (assetType: string, portfolioName: string, payload: Record<string, unknown>) => Promise<{ id?: string; data?: { id?: string } } | void>;
  onUpdateAsset: (assetType: string, id: string, payload: Record<string, unknown>) => Promise<void>;
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
            <StocksView
              portfolios={portfolios}
              portfolioName={visiblePortfolio.name}
              portfolioOptions={portfolioOptions}
              priceStatus={priceStatus}
              onAddHoldingClick={onAddHoldingClick}
              onDeleteStock={onDeleteStock}
              onUpdateStock={onUpdateStock}
            />
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
          <StocksView
            portfolios={portfolios}
            portfolioName="all"
            portfolioOptions={portfolioOptions}
            priceStatus={priceStatus}
            onAddHoldingClick={onAddHoldingClick}
            onDeleteStock={onDeleteStock}
            onUpdateStock={onUpdateStock}
          />
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
      </React.Suspense>
    </div>
  );
});

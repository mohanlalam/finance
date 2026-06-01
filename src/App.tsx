import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import PieChart from './components/PieChart';
import BarChart from './components/BarChart';
import AddHoldingModal from './components/AddHoldingModal';
import MobileBottomNav from './components/MobileBottomNav';
import NetWorthChart from './components/NetWorthChart';
import HealthScore from './components/HealthScore';
import SearchBar from './components/SearchBar';
import FamilyTabBar from './components/FamilyTabBar';
import AddFamilyModal from './components/AddFamilyModal';
import RenamePortfolioModal from './components/RenamePortfolioModal';
import AssetTabContent from './components/AssetTabContent';
import SectionErrorBoundary from './components/SectionErrorBoundary';
import InsightsPanel from './components/InsightsPanel';
import { ImportRow } from './components/ExportPanel';
import { AddHoldingPayload } from './components/AddHoldingModal';

import { isPinConfigured, isSessionVerified } from './utils/auth';
import { PortfolioName } from './types/portfolio';
import { formatINR, formatPercent, pnlColor } from './utils/formatters';
import { usePortfolioData } from './hooks/usePortfolioData';
import { usePortfolioInsights } from './hooks/usePortfolioInsights';
import { useAlerts } from './hooks/useAlerts';
import { invokeFunction } from './utils/apiClient';
import { classBreakdown, estimateTodayPnL, getPortfolioByName } from './utils/portfolioCalcs';
import PinLockScreen from './components/PinLockScreen';
import DashboardLoading from './components/DashboardLoading';
import DashboardError from './components/DashboardError';

type AssetTab = 'stocks' | 'fd' | 'gold' | 'real_estate' | 'insurance' | 'documents';

export default function App() {
  const [pinVerified, setPinVerified] = useState(() => !isPinConfigured() || isSessionVerified());
  const [activeTab, setActiveTab] = useState<PortfolioName>('all');
  const [activeAsset, setActiveAsset] = useState<AssetTab>('stocks');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string; label: string } | null>(null);

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch { /* ignore */ }
  }, [darkMode]);

  const handleAuthExpired = useCallback(() => {
    setPinVerified(false);
  }, []);

  const {
    portfolios,
    netWorthHistory,
    loadStatus,
    loadError,
    priceStatus,
    lastUpdated,
    failedSymbols,
    isUsingCachedData,
    cacheUpdatedAt,
    isAuthRequired,
    load,
    refreshPrices,
    addPortfolio,
    renamePortfolio,
    addAsset,
    updateAsset,
    deleteAsset,
  } = usePortfolioData({ onAuthExpired: handleAuthExpired });

  const refreshPricesRef = useRef(refreshPrices);
  useEffect(() => {
    refreshPricesRef.current = refreshPrices;
  }, [refreshPrices]);

  useEffect(() => {
    if (!pinVerified) return;

    load();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshPricesRef.current();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [pinVerified, load]);

  // Daily Net Worth Snapshot trigger
  useEffect(() => {
    if (loadStatus !== 'success' || portfolios.length === 0) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const lastSnapshot = localStorage.getItem('finance_last_snapshot_date');
    if (lastSnapshot !== todayStr) {
      invokeFunction('snapshot-net-worth', { method: 'POST' })
        .then(() => {
          localStorage.setItem('finance_last_snapshot_date', todayStr);
          load();
        })
        .catch((err) => {
          console.warn('[portfolio] failed to record daily net worth snapshot:', err);
        });
    }
  }, [loadStatus, portfolios, load]);

  const portfolio = useMemo(() => getPortfolioByName(portfolios, activeTab), [portfolios, activeTab]);
  const todayPnL = useMemo(() => estimateTodayPnL(portfolio, portfolios), [portfolio, portfolios]);
  const insights = usePortfolioInsights(portfolios);
  const alerts = useAlerts(portfolios);

  const handleSearchNavigate = useCallback((portfolioName: string, assetTab: string) => {
    setActiveTab(portfolioName);
    setActiveAsset(assetTab as AssetTab);
  }, []);

  const handleImportCSV = useCallback(async (rows: ImportRow[], portfolioName: string) => {
    for (const row of rows) {
      await addAsset('stock', portfolioName, {
        stockName: row.stock_name,
        ticker: row.ticker.toUpperCase(),
        yahooSymbol: row.yahoo_symbol,
        qty: row.qty,
        avgPrice: row.avg_price,
        amountInvested: row.qty * row.avg_price,
        weekLow52: 0,
        weekHigh52: 0,
      }, { reload: false });
    }
    await load();
  }, [addAsset, load]);

  const liveTotals = useMemo(() => {
    const totalInvested = portfolios.reduce((s, p) => s + p.totalInvested, 0);
    const totalCurrentValue = portfolios.reduce((s, p) => s + p.totalCurrentValue, 0);
    const totalPnL = totalCurrentValue - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    return { totalInvested, totalCurrentValue, totalPnL, totalPnLPercent };
  }, [portfolios]);

  const summaryData = useMemo(() => {
    return portfolio
      ? { totalInvested: portfolio.totalInvested, totalCurrentValue: portfolio.totalCurrentValue, totalPnL: portfolio.totalPnL, totalPnLPercent: portfolio.totalPnLPercent, label: portfolio.label }
      : { totalInvested: liveTotals.totalInvested, totalCurrentValue: liveTotals.totalCurrentValue, totalPnL: liveTotals.totalPnL, totalPnLPercent: liveTotals.totalPnLPercent, label: 'Family' };
  }, [portfolio, liveTotals]);

  const breakdown = useMemo(() => classBreakdown(portfolios, portfolio), [portfolios, portfolio]);

  const breakdownSlices = useMemo(() => [
    { label: 'Stocks', fullName: 'Stocks & ETFs', value: breakdown.stocks, color: '#3b82f6' },
    { label: 'FD', fullName: 'Fixed Deposits', value: breakdown.fd, color: '#6366f1' },
    { label: 'Gold', fullName: 'Gold Holdings', value: breakdown.gold, color: '#f59e0b' },
    { label: 'Realty', fullName: 'Real Estate', value: breakdown.realEstate, color: '#10b981' },
  ], [breakdown]);

  const isLoadingDB = loadStatus === 'loading';
  const isLoadingPrices = priceStatus === 'loading';
  const isLoading = isLoadingDB || isLoadingPrices;

  const portfolioOptionsForModal = useMemo(() => {
    return portfolios.map((p) => ({ name: p.name, label: p.label }));
  }, [portfolios]);

  const tableDeleteHandler = useCallback((holdingId: string) => deleteAsset('stock', holdingId), [deleteAsset]);
  const tableUpdateHandler = useCallback((holdingId: string, qty: number, avgPrice: number) => {
    const amountInvested = qty * avgPrice;
    return updateAsset('stock', holdingId, { qty, avgPrice, amountInvested });
  }, [updateAsset]);

  const handleAddFamilySubmit = useCallback(async (label: string, name: string) => {
    await addPortfolio(name, label);
  }, [addPortfolio]);

  const handleRenameSubmit = useCallback(async (id: string, label: string) => {
    await renamePortfolio(id, label);
  }, [renamePortfolio]);

  const handleTabChange = useCallback((tab: PortfolioName) => {
    setActiveTab(tab);
  }, []);

  const handleAddFamilyClick = useCallback(() => {
    setShowAddFamily(true);
  }, []);

  const handleRenameClick = useCallback((target: { id: string; name: string; label: string }) => {
    setRenameTarget(target);
  }, []);

  const handleAddHolding = useCallback(async (data: AddHoldingPayload) => {
    const { portfolioName, ...payload } = data;
    await addAsset('stock', portfolioName, payload as unknown as Record<string, unknown>);
  }, [addAsset]);

  // PIN Lock Gate
  if (!pinVerified) {
    return <PinLockScreen onUnlock={() => setPinVerified(true)} />;
  }

  if (loadStatus === 'idle' || isLoadingDB) {
    return <DashboardLoading />;
  }

  if (loadStatus === 'error') {
    return (
      <DashboardError
        message={loadError}
        isAuthError={isAuthRequired}
        onRetry={load}
        onUnlock={() => setPinVerified(false)}
      />
    );
  }

  const visiblePortfolio = portfolio;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-16 md:pb-0 text-slate-800 dark:text-slate-100 transition-colors">
      <Header
        totalCurrentValue={summaryData.totalCurrentValue}
        totalPnLPercent={summaryData.totalPnLPercent}
        totalPnL={summaryData.totalPnL}
        status={priceStatus}
        lastUpdated={lastUpdated}
        onRefresh={refreshPrices}
        portfolios={portfolios}
        onImportCSV={handleImportCSV}
        portfolioOptions={portfolioOptionsForModal}
        alerts={alerts}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {isUsingCachedData && (
          <div className="flex flex-col gap-1 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 px-4 py-3 text-sm text-blue-900 dark:text-blue-300 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <WifiOff size={16} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <span>
                Showing saved portfolio data because the latest database request did not complete.
                {cacheUpdatedAt ? ` Saved at ${cacheUpdatedAt.toLocaleString('en-IN')}.` : ''}
              </span>
            </div>
            <button
              onClick={load}
              className="self-start rounded-lg border border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-750 transition-colors sm:self-auto"
            >
              Retry sync
            </button>
          </div>
        )}

        {priceStatus === 'error' && (
          <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-400 rounded-lg px-4 py-3 text-sm">
            <AlertCircle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Could not reach Yahoo Finance. Showing last known data. Check your connection and try refreshing.</span>
          </div>
        )}

        {priceStatus === 'success' && failedSymbols.length > 0 && (
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg px-4 py-3 text-sm">
            <AlertCircle size={16} className="shrink-0 text-slate-400 dark:text-slate-500" />
            <span>
              Some symbols did not resolve on Yahoo Finance and show avg price instead:{' '}
              <span className="font-semibold">{failedSymbols.join(', ')}</span>
            </span>
          </div>
        )}

        {/* Search Bar */}
        <SearchBar portfolios={portfolios} onNavigate={handleSearchNavigate} />

        {/* Family Tabs Row */}
        <FamilyTabBar
          portfolios={portfolios}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onAddFamilyClick={handleAddFamilyClick}
          onRenameClick={handleRenameClick}
        />

        {/* Family Overview - drill-down cards */}
        {activeTab === 'all' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolios.map((p) => (
              <button
                key={p.name}
                onClick={() => setActiveTab(p.name)}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 text-left hover:shadow-md hover:border-slate-250 dark:hover:border-slate-600 transition-all duration-150 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{p.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.totalPnL >= 0 ? 'bg-emerald-105 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-red-100 text-red-650 dark:bg-red-955 dark:text-red-400'}`}>
                    {formatPercent(p.totalPnLPercent, 1)}
                  </span>
                </div>
                <p className={`text-xl font-bold text-slate-800 dark:text-slate-100 mb-1 transition-opacity ${isLoadingPrices ? 'opacity-40' : ''}`}>
                  {formatINR(p.totalCurrentValue)}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Invested: {formatINR(p.totalInvested)}</p>
                <p className={`text-sm font-semibold mt-1 ${pnlColor(p.totalPnL)}`}>
                  {p.totalPnL >= 0 ? '+' : ''}{formatINR(p.totalPnL)} P&L
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-3 gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <div>
                    <p className="text-slate-400 dark:text-slate-500">Stocks</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{p.holdings.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 dark:text-slate-500">FDs</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{p.fixedDeposits.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 dark:text-slate-500">Properties</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{p.realEstate.length}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Wealth Mosaic for All view */}
        {activeTab === 'all' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                Stocks
              </div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{formatINR(breakdown.stocks)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                FDs
              </div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{formatINR(breakdown.fd)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                Gold
              </div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{formatINR(breakdown.gold)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                Real Estate
              </div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{formatINR(breakdown.realEstate)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                Insurance Cover
              </div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{formatINR(breakdown.insuranceCover)}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{formatINR(breakdown.insurancePremium)}/yr premium</p>
            </div>
          </div>
        )}

        {/* Insights Panel — only on family overview */}
        {activeTab === 'all' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2">
              <SectionErrorBoundary sectionName="Portfolio Insights">
                <InsightsPanel insights={insights} />
              </SectionErrorBoundary>
            </div>
            <div>
              <SectionErrorBoundary sectionName="Health Score Breakdown">
                <HealthScore score={insights.healthScore} />
              </SectionErrorBoundary>
            </div>
          </div>
        )}

        <SummaryCards
          totalInvested={summaryData.totalInvested}
          totalCurrentValue={summaryData.totalCurrentValue}
          totalPnL={summaryData.totalPnL}
          totalPnLPercent={summaryData.totalPnLPercent}
          todayPnL={todayPnL}
          label={summaryData.label}
          isLoading={isLoading}
        />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <SectionErrorBoundary sectionName="Asset Class Pie Chart">
            <PieChart slices={breakdownSlices} title={`Asset Class Breakdown — ${summaryData.label}`} />
          </SectionErrorBoundary>
          <SectionErrorBoundary sectionName="Asset Comparison Bar Chart">
            <BarChart portfolios={activeTab === 'all' ? portfolios : (visiblePortfolio ? [visiblePortfolio] : [])} />
          </SectionErrorBoundary>
        </div>

        {activeTab === 'all' && (
          <SectionErrorBoundary sectionName="Historical Net Worth Chart">
            <NetWorthChart history={netWorthHistory} />
          </SectionErrorBoundary>
        )}

        {/* Asset Tab Views */}
        <SectionErrorBoundary sectionName="Asset Tab Content">
          <AssetTabContent
            activeAsset={activeAsset}
            visiblePortfolio={visiblePortfolio}
            portfolios={portfolios}
            priceStatus={priceStatus}
            onAddHoldingClick={() => setShowAddModal(true)}
            onDeleteStock={tableDeleteHandler}
            onUpdateStock={tableUpdateHandler}
            onAddAsset={addAsset}
            onUpdateAsset={updateAsset}
            onDeleteAsset={deleteAsset}
          />
        </SectionErrorBoundary>
      </div>

      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Family Wealth Tracker
            {lastUpdated && (
              <span className="ml-2 text-slate-300 dark:text-slate-600">
                — Last updated: {lastUpdated.toLocaleTimeString('en-IN')}
              </span>
            )}
          </p>
          <button
            onClick={refreshPrices}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={isLoadingPrices ? 'animate-spin' : ''} />
            Refresh prices
          </button>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeAsset={activeAsset} onChangeAsset={setActiveAsset} />

      {/* Add Holding Modal */}
      {showAddModal && (
        <AddHoldingModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddHolding}
          portfolioOptions={portfolioOptionsForModal}
          defaultPortfolio={activeTab === 'all' ? portfolioOptionsForModal[0]?.name : activeTab}
        />
      )}

      {/* Add Family Member Modal */}
      <AddFamilyModal
        isOpen={showAddFamily}
        onClose={() => setShowAddFamily(false)}
        onSubmit={handleAddFamilySubmit}
      />

      {/* Rename Portfolio Modal */}
      <RenamePortfolioModal
        isOpen={!!renameTarget}
        target={renameTarget}
        onClose={() => setRenameTarget(null)}
        onSubmit={handleRenameSubmit}
      />
    </div>
  );
}

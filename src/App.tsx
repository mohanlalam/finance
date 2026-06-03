import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { WifiOff, AlertCircle, RefreshCw, TrendingUp, Landmark, Coins, Home, Shield, FolderOpen, Clock, Heart } from 'lucide-react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import PieChart from './components/PieChart';
import BarChart from './components/BarChart';
import AddHoldingModal from './components/AddHoldingModal';
import MobileBottomNav from './components/MobileBottomNav';
import SearchBar from './components/SearchBar';
import FamilyTabBar from './components/FamilyTabBar';
import AddFamilyModal from './components/AddFamilyModal';
import RenamePortfolioModal from './components/RenamePortfolioModal';
import AssetTabContent from './components/AssetTabContent';
import SectionErrorBoundary from './components/SectionErrorBoundary';
import InsightsPanel from './components/InsightsPanel';
import QuickActions from './components/QuickActions';
import FloatingAddMenu from './components/FloatingAddMenu';
import MobileHomeSummary from './components/MobileHomeSummary';
import MobileAlertsView from './components/MobileAlertsView';
import { ImportRow } from './components/ExportPanel';
import { AddHoldingPayload } from './components/AddHoldingModal';

import { isPinConfigured, isSessionVerified } from './utils/auth';
import { PortfolioName } from './types/portfolio';
import { formatINR, formatPercent, pnlColor } from './utils/formatters';
import { usePortfolioData } from './hooks/usePortfolioData';
import { usePortfolioInsights } from './hooks/usePortfolioInsights';
import { useDismissibleAlerts } from './hooks/useAlerts';
import { useSwipeNavigation } from './hooks/useSwipeNavigation';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { getBreakdownSlices } from './utils/chartHelpers';
import { invokeFunction } from './utils/apiClient';
import { classBreakdown, estimateTodayPnL, getPortfolioByName } from './utils/portfolioCalcs';
import PinLockScreen from './components/PinLockScreen';
import DashboardLoading from './components/DashboardLoading';
import DashboardError from './components/DashboardError';

type AssetTab = 'home' | 'stocks' | 'fd' | 'rd' | 'ssy' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents';

export default function App() {
  const [pinVerified, setPinVerified] = useState(() => !isPinConfigured() || isSessionVerified());
  const [activeTab, setActiveTab] = useState<PortfolioName>(() => {
    try {
      return localStorage.getItem('finance_last_family_tab') || 'all';
    } catch {
      return 'all';
    }
  });
  const [activeAsset, setActiveAsset] = useState<AssetTab>(() => {
    try {
      const stored = localStorage.getItem('finance_last_asset_tab');
      if (stored) return stored as AssetTab;
      return window.innerWidth < 768 ? 'home' : 'stocks';
    } catch {
      return window.innerWidth < 768 ? 'home' : 'stocks';
    }
  });
  const [quickAddTarget, setQuickAddTarget] = useState<'stocks' | 'fd' | 'rd' | 'ssy' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | null>(null);
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

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [showMobileAlerts, setShowMobileAlerts] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persist active tabs
  useEffect(() => {
    try { localStorage.setItem('finance_last_family_tab', activeTab); } catch { /* ignore */ }
  }, [activeTab]);

  useEffect(() => {
    try { localStorage.setItem('finance_last_asset_tab', activeAsset); } catch { /* ignore */ }
  }, [activeAsset]);

  const handleAuthExpired = useCallback(() => {
    setPinVerified(false);
  }, []);

  const {
    portfolios,
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
    deletePortfolio,
    addAsset,
    updateAsset,
    deleteAsset,
  } = usePortfolioData({ onAuthExpired: handleAuthExpired });

  const refreshPricesRef = useRef(refreshPrices);
  useEffect(() => {
    refreshPricesRef.current = refreshPrices;
  }, [refreshPrices]);

  // Keyboard shortcuts
  useKeyboardShortcuts(useCallback(() => refreshPricesRef.current(), []));

  // Swipe tab navigation
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeNavigation({
    activeAsset,
    setActiveAsset,
  });

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
  const todayPnLPercent = useMemo(() => {
    const totalCurrentStocks = portfolio
      ? portfolio.holdings.reduce((sum, h) => sum + h.currentValue, 0)
      : portfolios.reduce((sum, p) => sum + p.holdings.reduce((s, h) => s + h.currentValue, 0), 0);
    const prevCurrentStocks = totalCurrentStocks - todayPnL;
    return prevCurrentStocks > 0 ? (todayPnL / prevCurrentStocks) * 100 : 0;
  }, [portfolio, portfolios, todayPnL]);

  const effectiveAsset = activeAsset === 'home' && !isMobile ? 'stocks' : activeAsset;
  const insights = usePortfolioInsights(portfolios);
  
  // Custom Hook for Dismissible Alerts
  const { visibleAlerts, handleDismissAlert, handleDismissAll } = useDismissibleAlerts(portfolios);

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

  const breakdownSlices = useMemo(() => getBreakdownSlices(breakdown), [breakdown]);

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

  const handleDeletePortfolio = useCallback(async (target: { id: string; name: string; label: string }) => {
    if (confirm(`Are you sure you want to delete ${target.label} and all of their holdings, fixed deposits, and other assets? This action cannot be undone.`)) {
      try {
        await deletePortfolio(target.id);
        if (activeTab === target.name) {
          setActiveTab('all');
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete family member');
      }
    }
  }, [deletePortfolio, activeTab]);

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
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-safe-content md:pb-0 text-slate-800 dark:text-slate-100 transition-colors relative overflow-x-hidden"
    >
      {/* Decorative background glow shapes */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/3 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[30vh] right-1/4 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-500/3 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Print-only report header */}
      <div className="print-report-header hidden items-center justify-between px-8 py-6 border-b-2 border-slate-200 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Family Wealth Report</h1>
          <p className="text-sm text-slate-500 mt-0.5">Generated on {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-800">{formatINR(summaryData.totalCurrentValue)}</p>
          <p className={`text-sm font-semibold ${summaryData.totalPnL >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {summaryData.totalPnL >= 0 ? '+' : ''}{formatINR(summaryData.totalPnL)} ({formatPercent(summaryData.totalPnLPercent)})
          </p>
        </div>
      </div>

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
        alerts={visibleAlerts}
        onDismissAlert={handleDismissAlert}
        onDismissAll={handleDismissAll}
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

        {isMobile ? (
          <div className="space-y-4">
            {/* Search Bar on Mobile */}
            <div data-search-bar className="px-0.5">
              <SearchBar portfolios={portfolios} onNavigate={handleSearchNavigate} />
            </div>

            {/* Family Tabs Row on Mobile */}
            <FamilyTabBar
              portfolios={portfolios}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onAddFamilyClick={handleAddFamilyClick}
              onRenameClick={handleRenameClick}
              onDeleteClick={handleDeletePortfolio}
            />

            {activeAsset === 'home' ? (
              <div className="space-y-4">
                <MobileHomeSummary
                  summaryData={summaryData}
                  todayPnL={todayPnL}
                  todayPnLPercent={todayPnLPercent}
                  breakdown={breakdown}
                  alertCount={visibleAlerts.length}
                  lastUpdated={lastUpdated}
                  priceStatus={priceStatus}
                  onRefresh={refreshPrices}
                  isLoadingPrices={isLoadingPrices}
                  onNavigateAsset={setActiveAsset}
                  onOpenAlerts={() => setShowMobileAlerts(true)}
                  portfolios={portfolios}
                  activePortfolio={portfolio}
                />

                {/* Mobile Dashboards - Insights */}
                {activeTab === 'all' && (
                  <SectionErrorBoundary sectionName="Portfolio Insights">
                    <InsightsPanel insights={insights} />
                  </SectionErrorBoundary>
                )}

                {/* Mobile Dashboards - Allocation Charts */}
                <div className="space-y-4">
                  <SectionErrorBoundary sectionName="Asset Class Pie Chart">
                    <PieChart slices={breakdownSlices} title={`Asset Class Breakdown — ${summaryData.label}`} />
                  </SectionErrorBoundary>
                  <SectionErrorBoundary sectionName="Asset Comparison Bar Chart">
                    <BarChart portfolios={activeTab === 'all' ? portfolios : (visiblePortfolio ? [visiblePortfolio] : [])} />
                  </SectionErrorBoundary>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Sticky Mini Refresh Status Bar for other tabs too */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-750/30 rounded-2xl text-[11px] text-slate-500 dark:text-slate-450 backdrop-blur shadow-sm">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${priceStatus === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="font-semibold shrink-0">{priceStatus === 'success' ? 'Live Prices' : 'Snapshot'}</span>
                    <span className="text-slate-350 dark:text-slate-700 shrink-0">•</span>
                    <span className="truncate">Updated {lastUpdated ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                  </div>
                  <button
                    onClick={refreshPrices}
                    disabled={isLoadingPrices}
                    className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 active:scale-95 transition-all shrink-0 ml-2"
                  >
                    <RefreshCw size={11} className={isLoadingPrices ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>

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
                    quickAddTarget={quickAddTarget}
                    onQuickAddComplete={() => setQuickAddTarget(null)}
                    portfolioOptions={portfolioOptionsForModal}
                  />
                </SectionErrorBoundary>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div data-search-bar>
              <SearchBar portfolios={portfolios} onNavigate={handleSearchNavigate} />
            </div>

            {/* Quick Actions */}
            <QuickActions
              onAddStock={() => setShowAddModal(true)}
              onAddFD={() => { setActiveAsset('fd'); setQuickAddTarget('fd'); }}
              onAddGold={() => { setActiveAsset('gold'); setQuickAddTarget('gold'); }}
              onRefresh={refreshPrices}
              isRefreshing={isLoadingPrices}
            />

            {/* Family Tabs Row */}
            <FamilyTabBar
              portfolios={portfolios}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onAddFamilyClick={handleAddFamilyClick}
              onRenameClick={handleRenameClick}
              onDeleteClick={handleDeletePortfolio}
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
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
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
                    RDs
                  </div>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{formatINR(breakdown.rd)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                    SSY
                  </div>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{formatINR(breakdown.ssy)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                    SIPs
                  </div>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{formatINR(breakdown.sip)}</p>
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
                    Insurance
                  </div>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{formatINR(breakdown.insuranceCover)}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{formatINR(breakdown.insurancePremium)}/yr prem</p>
                </div>
              </div>
            )}

            {/* Insights Panel — only on family overview */}
            {activeTab === 'all' && (
              <SectionErrorBoundary sectionName="Portfolio Insights">
                <InsightsPanel insights={insights} />
              </SectionErrorBoundary>
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

            {/* Desktop Asset Switcher */}
            <div className="hidden md:flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px mb-2">
              {([
                { id: 'stocks', label: 'Stocks & ETFs', icon: <TrendingUp size={16} /> },
                { id: 'fd', label: 'Fixed Deposits', icon: <Landmark size={16} /> },
                { id: 'rd', label: 'Recurring Deposits', icon: <Clock size={16} /> },
                { id: 'ssy', label: 'Sukanya Samriddhi', icon: <Heart size={16} /> },
                { id: 'sip', label: 'SIP Mutual Funds', icon: <TrendingUp size={16} /> },
                { id: 'gold', label: 'Gold Holdings', icon: <Coins size={16} /> },
                { id: 'real_estate', label: 'Real Estate', icon: <Home size={16} /> },
                { id: 'insurance', label: 'Insurance Cover', icon: <Shield size={16} /> },
                { id: 'documents', label: 'Document Vault', icon: <FolderOpen size={16} /> },
              ] as const).map((tab) => {
                const isActive = effectiveAsset === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAsset(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-semibold text-sm transition-all duration-150 outline-none -mb-px ${
                      isActive
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-750'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Asset Tab Views */}
            <SectionErrorBoundary sectionName="Asset Tab Content">
              <AssetTabContent
                activeAsset={effectiveAsset}
                visiblePortfolio={visiblePortfolio}
                portfolios={portfolios}
                priceStatus={priceStatus}
                onAddHoldingClick={() => setShowAddModal(true)}
                onDeleteStock={tableDeleteHandler}
                onUpdateStock={tableUpdateHandler}
                onAddAsset={addAsset}
                onUpdateAsset={updateAsset}
                onDeleteAsset={deleteAsset}
                quickAddTarget={quickAddTarget}
                onQuickAddComplete={() => setQuickAddTarget(null)}
                portfolioOptions={portfolioOptionsForModal}
              />
            </SectionErrorBoundary>
          </>
        )}
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
      <MobileBottomNav activeAsset={activeAsset} onChangeAsset={setActiveAsset} alertCount={visibleAlerts.length} />

      {/* Floating Add Menu (FAB) */}
      <FloatingAddMenu
        onAddStock={() => setShowAddModal(true)}
        onAddAsset={(type) => {
          setActiveAsset(type);
          setQuickAddTarget(type);
        }}
      />

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

      {/* Mobile Alerts Full-Screen View */}
      {showMobileAlerts && (
        <MobileAlertsView
          alerts={visibleAlerts}
          onClose={() => setShowMobileAlerts(false)}
          onDismissAlert={handleDismissAlert}
          onDismissAll={handleDismissAll}
        />
      )}
    </div>
  );
}

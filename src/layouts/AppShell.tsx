import React, { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react';
// Inline SVG icons — keeps lucide-react out of the critical post-unlock bundle
import { WifiOff, AlertCircle, RefreshCw, TrendingUp, Landmark, Coins, Home, Shield, FolderOpen, Clock, Calculator } from '../components/icons/AppIcons';
import Header from '../components/Header';
import SummaryCards from '../components/SummaryCards';
import AddHoldingModal from '../components/AddHoldingModal';
import MobileBottomNav from '../components/MobileBottomNav';
// SearchBar lazy-loaded — saves 17 KB from the initial AppShell parse
const SearchBar = React.lazy(() => import('../components/SearchBar'));
import FamilyTabBar from '../components/FamilyTabBar';
import AddFamilyModal from '../components/AddFamilyModal';
import RenamePortfolioModal from '../components/RenamePortfolioModal';
import ConfirmModal from '../components/ConfirmModal';
import AssetTabContent from '../components/AssetTabContent';
import SectionErrorBoundary from '../components/SectionErrorBoundary';
import QuickActions from '../components/QuickActions';
import FloatingAddMenu from '../components/FloatingAddMenu';
import MobileHomeSummary from '../components/MobileHomeSummary';
import MobileAlertsView from '../components/MobileAlertsView';
import type { ImportRow } from '../components/ExportPanel'; // type-only: erased at build time
import { AddHoldingPayload } from '../components/AddHoldingModal';

import DashboardWidgets from '../components/DashboardWidgets';

const PieChart = React.lazy(() => import('../components/PieChart'));
const BarChart = React.lazy(() => import('../components/BarChart'));
const PortfolioAssistant = React.lazy(() => import('../components/PortfolioAssistant'));
// Lazy-loaded: only fetched when activeTab === 'all' renders it on screen
const InsightsPanel = React.lazy(() => import('../components/InsightsPanel'));

import { useParams, useNavigate } from 'react-router-dom';
import { formatINR, formatPercent, pnlColor } from '../utils/formatters';
import { usePortfolioState, usePortfolioActions } from '../contexts/PortfolioContext';
import { useToastActions } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePortfolioInsights } from '../hooks/usePortfolioInsights';
import { useDismissibleAlerts } from '../hooks/useAlerts';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { getBreakdownSlices } from '../utils/chartHelpers';
import { classBreakdown, estimateTodayPnL } from '../utils/portfolioCalcs';

// Lazy viewport container that loads child components only when they are visible
function LazyViewport({ children, placeholderHeight = 240 }: { children: React.ReactNode; placeholderHeight?: number }) {
  const [isIntersected, setIsIntersected] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersected(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: isIntersected ? undefined : placeholderHeight }}>
      {isIntersected ? children : (
        <div 
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 animate-pulse" 
          style={{ height: placeholderHeight }} 
        />
      )}
    </div>
  );
}

// Lazy chart wrapper that ensures the dynamic import is only evaluated on intersection
function LazyChartWrapper<TProps extends object>({
  importFunc,
  fallback,
  props,
  placeholderHeight = 240
}: {
  importFunc: () => Promise<{ default: React.ComponentType<TProps> }>;
  fallback: React.ReactNode;
  props: TProps;
  placeholderHeight?: number;
}) {
  const [isIntersected, setIsIntersected] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Pin the import function reference so React.lazy() is only called once per
  // mount — prevents chart components from unmounting on every parent re-render
  const importRef = useRef(importFunc);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersected(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const LazyComponent = useMemo(() => {
    if (!isIntersected) return null;
    return React.lazy(importRef.current) as unknown as React.ComponentType<TProps>;
  }, [isIntersected]);

  return (
    <div ref={ref} style={{ minHeight: isIntersected ? undefined : placeholderHeight }}>
      {isIntersected && LazyComponent ? (
        <Suspense fallback={fallback}>
          <LazyComponent {...props} />
        </Suspense>
      ) : (
        <div 
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 animate-pulse" 
          style={{ height: placeholderHeight }} 
        />
      )}
    </div>
  );
}

type AssetTab = 'home' | 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | 'widgets' | 'what_if';

export default function AppShell() {
  const {
    portfolios, priceStatus, lastUpdated, failedSymbols,
    isUsingCachedData, cacheUpdatedAt, isPriceStale,
    activeTab, activePortfolio, portfolioOptionsForModal,
    netWorthHistory,
  } = usePortfolioState();

  const {
    setActiveTab, load, refreshPrices,
    addPortfolio, renamePortfolio, deletePortfolio,
    addAsset, updateAsset, deleteAsset,
  } = usePortfolioActions();
  const { darkMode, toggleDarkMode } = useTheme();
  const { addToast } = useToastActions();

  const { family, asset } = useParams<{ family: string; asset: string }>();
  const navigate = useNavigate();

  // Declared early so it can be used in activeAsset derivation below without
  // reading window.innerWidth (which forces a layout reflow) on every render
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const activeAsset = (asset as AssetTab) || (isMobile ? 'home' : 'stocks');

  const setActiveAsset = useCallback((newAsset: AssetTab) => {
    navigate(`/${family || 'all'}/${newAsset}`);
  }, [navigate, family]);
  const [quickAddTarget, setQuickAddTarget] = useState<'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string; label: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; label: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMobileAlerts, setShowMobileAlerts] = useState(false);

  // Persist active asset tab
  useEffect(() => {
    try { localStorage.setItem('finance_last_asset_tab', activeAsset); } catch { /* ignore */ }
  }, [activeAsset]);

  // Keyboard shortcuts
  useKeyboardShortcuts(useCallback(() => refreshPrices(), [refreshPrices]));

  // Swipe tab navigation
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeNavigation({
    activeAsset,
    setActiveAsset,
  });

  const portfolio = activePortfolio;
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

  const { visibleAlerts, handleDismissAlert, handleDismissAll } = useDismissibleAlerts(portfolios);

  const isLoadingPrices = priceStatus === 'loading';
  const isLoading = priceStatus === 'loading';

  const liveTotals = useMemo(() => {
    const totalInvested = portfolios.reduce((s, p) => s + p.totalInvested, 0);
    const totalCurrentValue = portfolios.reduce((s, p) => s + p.totalCurrentValue, 0);
    const totalPnL = totalCurrentValue - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    
    return { totalInvested, totalCurrentValue, totalPnL, totalPnLPercent };
  }, [portfolios]);

  const summaryData = useMemo(() => {
    if (portfolio) {
      return {
        totalInvested: portfolio.totalInvested,
        totalCurrentValue: portfolio.totalCurrentValue,
        totalPnL: portfolio.totalPnL,
        totalPnLPercent: portfolio.totalInvested > 0 ? (portfolio.totalPnL / portfolio.totalInvested) * 100 : 0,
        label: portfolio.label
      };
    } else {
      return {
        totalInvested: liveTotals.totalInvested,
        totalCurrentValue: liveTotals.totalCurrentValue,
        totalPnL: liveTotals.totalPnL,
        totalPnLPercent: liveTotals.totalPnLPercent,
        label: 'Family'
      };
    }
  }, [portfolio, liveTotals]);

  const breakdown = useMemo(() => classBreakdown(portfolios, portfolio), [portfolios, portfolio]);
  const breakdownSlices = useMemo(() => getBreakdownSlices(breakdown), [breakdown]);

  // ─── Handlers ───
  const handleSearchNavigate = useCallback((portfolioName: string, assetTab: string) => {
    navigate(`/${portfolioName}/${assetTab}`);
  }, [navigate]);

  const handleImportCSV = useCallback(async (rows: ImportRow[], portfolioName: string) => {
    // Parallelize in batches of 5 for performance
    const BATCH_SIZE = 5;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(row =>
        addAsset('stock', portfolioName, {
          stockName: row.stock_name,
          ticker: row.ticker.toUpperCase(),
          yahooSymbol: row.yahoo_symbol,
          qty: row.qty,
          avgPrice: row.avg_price,
          amountInvested: row.qty * row.avg_price,
          weekLow52: 0,
          weekHigh52: 0,
        }, { reload: false })
      ));
    }
    await load();
  }, [addAsset, load]);

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

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, [setActiveTab]);

  const handleAddFamilyClick = useCallback(() => setShowAddFamily(true), []);

  const handleRenameClick = useCallback((target: { id: string; name: string; label: string }) => {
    setRenameTarget(target);
  }, []);

  const handleDeletePortfolio = useCallback((target: { id: string; name: string; label: string }) => {
    setDeleteTarget(target);
  }, []);

  const handleConfirmDeletePortfolio = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deletePortfolio(deleteTarget.id);
      if (activeTab === deleteTarget.name) {
        setActiveTab('all');
      }
      addToast('Family member deleted successfully', 'success');
      setDeleteTarget(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete family member', 'error');
    } finally {
      setIsDeleting(false);
    }
  }, [deletePortfolio, deleteTarget, activeTab, setActiveTab, addToast]);

  const handleAddHolding = useCallback(async (data: AddHoldingPayload) => {
    const { portfolioName, ...payload } = data;
    await addAsset('stock', portfolioName, payload);
  }, [addAsset]);

  const visiblePortfolio = portfolio;

  if (activeAsset === 'widgets') {
    return <DashboardWidgets portfolios={portfolios} activePortfolio={portfolio} />;
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-safe-content md:pb-0 text-slate-800 dark:text-slate-100 transition-colors relative overflow-x-hidden"
    >
      {/* Decorative background glow shapes — blur reduced from 120-140px to 60-70px
           (perceptually same, ~4× cheaper GPU compositing on mobile) */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/3 rounded-full blur-[60px] pointer-events-none z-0 will-change-transform" />
      <div className="absolute top-[30vh] right-1/4 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-500/3 rounded-full blur-[70px] pointer-events-none z-0 will-change-transform" />

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
        onToggleDarkMode={toggleDarkMode}
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
              className="self-start rounded-lg border border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors sm:self-auto"
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

        {isPriceStale && priceStatus !== 'error' && (
          <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-400 rounded-lg px-4 py-3 text-sm">
            <AlertCircle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Stock prices may be outdated. Press Ctrl+Shift+R to refresh.</span>
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
              <Suspense fallback={null}>
                <SearchBar portfolios={portfolios} onNavigate={handleSearchNavigate} />
              </Suspense>
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
                  alerts={visibleAlerts}
                  lastUpdated={lastUpdated}
                  priceStatus={priceStatus}
                  onRefresh={refreshPrices}
                  isLoadingPrices={isLoadingPrices}
                  onNavigateAsset={setActiveAsset}
                  onOpenAlerts={() => setShowMobileAlerts(true)}
                  portfolios={portfolios}
                  activePortfolio={portfolio}
                />

                {activeTab === 'all' && (
                  <SectionErrorBoundary sectionName="Portfolio Insights">
                    <Suspense fallback={<div className="h-40 bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />}>
                      <InsightsPanel
                        insights={insights}
                        portfolios={portfolios}
                        activePortfolio={portfolio}
                      />
                    </Suspense>
                  </SectionErrorBoundary>
                )}

                <div className="space-y-4">
                  <SectionErrorBoundary sectionName="Net Worth Timeline">
                    <LazyChartWrapper
                      importFunc={() => import('../components/NetWorthTimelineChart')}
                      placeholderHeight={240}
                      fallback={<div className="h-[240px] bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />}
                      props={{ history: netWorthHistory, currentNetWorth: summaryData.totalCurrentValue }}
                    />
                  </SectionErrorBoundary>


                  <SectionErrorBoundary sectionName="AI Portfolio Assistant">
                    <LazyViewport placeholderHeight={200}>
                      <Suspense fallback={<div className="h-[200px] bg-slate-900 border border-slate-700/60 rounded-2xl animate-pulse" />}>
                        <PortfolioAssistant portfolios={portfolios} />
                      </Suspense>
                    </LazyViewport>
                  </SectionErrorBoundary>

                  <SectionErrorBoundary sectionName="Asset Class Pie Chart">
                    <LazyViewport placeholderHeight={280}>
                      <Suspense fallback={<div className="h-[280px] bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />}>
                        <PieChart slices={breakdownSlices} title={`Asset Class Breakdown — ${summaryData.label}`} />
                      </Suspense>
                    </LazyViewport>
                  </SectionErrorBoundary>

                  <SectionErrorBoundary sectionName="Asset Comparison Bar Chart">
                    <LazyViewport placeholderHeight={280}>
                      <Suspense fallback={<div className="h-[280px] bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />}>
                        <BarChart portfolios={activeTab === 'all' ? portfolios : (visiblePortfolio ? [visiblePortfolio] : [])} />
                      </Suspense>
                    </LazyViewport>
                  </SectionErrorBoundary>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Sticky Mini Refresh Status Bar */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/30 rounded-2xl text-[11px] text-slate-500 dark:text-slate-400 backdrop-blur shadow-sm">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${priceStatus === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="font-semibold shrink-0">{priceStatus === 'success' ? 'Live Prices' : 'Snapshot'}</span>
                    <span className="text-slate-400 dark:text-slate-700 shrink-0">•</span>
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
              <Suspense fallback={null}>
                <SearchBar portfolios={portfolios} onNavigate={handleSearchNavigate} />
              </Suspense>
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
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 text-left hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-150 group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{p.label}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.totalPnL >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'}`}>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { label: 'Stocks', value: breakdown.stocks },
                  { label: 'FDs', value: breakdown.fd },
                  { label: 'RDs', value: breakdown.rd },
                  { label: 'SIPs', value: breakdown.sip },
                  { label: 'Gold', value: breakdown.gold },
                  { label: 'Real Estate', value: breakdown.realEstate },
                ].map((item) => (
                  <div key={item.label} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                      {item.label}
                    </div>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">{formatINR(item.value)}</p>
                  </div>
                ))}
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
                <Suspense fallback={<div className="h-40 bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />}>
                  <InsightsPanel
                    insights={insights}
                    portfolios={portfolios}
                    activePortfolio={portfolio}
                  />
                </Suspense>
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
              portfolios={portfolios}
              activePortfolio={portfolio}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <SectionErrorBoundary sectionName="Net Worth Timeline">
                <LazyChartWrapper
                  importFunc={() => import('../components/NetWorthTimelineChart')}
                  placeholderHeight={240}
                  fallback={<div className="h-[240px] bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />}
                  props={{ history: netWorthHistory, currentNetWorth: summaryData.totalCurrentValue }}
                />
              </SectionErrorBoundary>
              <SectionErrorBoundary sectionName="AI Portfolio Assistant">
                <LazyViewport placeholderHeight={200}>
                  <Suspense fallback={<div className="h-[200px] bg-slate-900 border border-slate-700/60 rounded-2xl animate-pulse" />}>
                    <PortfolioAssistant portfolios={portfolios} />
                  </Suspense>
                </LazyViewport>
              </SectionErrorBoundary>
            </div>


            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <SectionErrorBoundary sectionName="Asset Class Pie Chart">
                <LazyViewport placeholderHeight={280}>
                  <Suspense fallback={<div className="h-[280px] bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />}>
                    <PieChart slices={breakdownSlices} title={`Asset Class Breakdown — ${summaryData.label}`} />
                  </Suspense>
                </LazyViewport>
              </SectionErrorBoundary>
              <SectionErrorBoundary sectionName="Asset Comparison Bar Chart">
                <LazyViewport placeholderHeight={280}>
                  <Suspense fallback={<div className="h-[280px] bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />}>
                    <BarChart portfolios={activeTab === 'all' ? portfolios : (visiblePortfolio ? [visiblePortfolio] : [])} />
                  </Suspense>
                </LazyViewport>
              </SectionErrorBoundary>
            </div>

            {/* Desktop Asset Switcher */}
            <div className="hidden md:flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px mb-2">
              {([
                { id: 'stocks', label: 'Stocks & ETFs', icon: <TrendingUp size={16} /> },
                { id: 'fd', label: 'Fixed Deposits', icon: <Landmark size={16} /> },
                { id: 'rd', label: 'Recurring Deposits', icon: <Clock size={16} /> },
                { id: 'sip', label: 'SIP Mutual Funds', icon: <TrendingUp size={16} /> },
                { id: 'gold', label: 'Gold Holdings', icon: <Coins size={16} /> },
                { id: 'real_estate', label: 'Real Estate', icon: <Home size={16} /> },
                { id: 'insurance', label: 'Insurance Cover', icon: <Shield size={16} /> },
                { id: 'documents', label: 'Document Vault', icon: <FolderOpen size={16} /> },
                { id: 'what_if', label: 'What-If Calc', icon: <Calculator size={16} /> },
              ] as const).map((tab) => {
                const isActive = effectiveAsset === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAsset(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-semibold text-sm transition-all duration-150 outline-none -mb-px ${
                      isActive
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-700'
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

      {/* Delete Portfolio Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDeletePortfolio}
        title="Delete Family Member"
        message={`Are you sure you want to delete ${deleteTarget?.label} and all of their holdings, fixed deposits, and other assets? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
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

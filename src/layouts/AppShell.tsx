import React, { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react';
// Inline SVG icons — keeps lucide-react out of the critical post-unlock bundle
import { WifiOff, AlertCircle, RefreshCw } from '../components/icons/AppIcons';


import Header from '../components/Header';
import SummaryCards from '../components/SummaryCards';
import FamilyTabBar from '../components/FamilyTabBar';
import AssetTabContent from '../components/AssetTabContent';
import SectionErrorBoundary from '../components/SectionErrorBoundary';

import ConfirmModal from '../components/ConfirmModal';
import FloatingAddMenu from '../components/FloatingAddMenu';
import { useIsMobile } from '../hooks/useIsMobile';
import { QuickAccessShortcuts } from '../components/ui/QuickAccessShortcuts';

import MobileBottomNav from '../components/MobileBottomNav';

// Viewport-specific lazy loaded layouts
const DesktopSidebar = React.lazy(() => import('./DesktopSidebar'));
const MobileHomeSummary = React.lazy(() => import('../components/MobileHomeSummary'));
const MobileAlertsView = React.lazy(() => import('../components/MobileAlertsView'));

// Lazy loaded modals to keep initial bundle lightweight
const AddHoldingModal = React.lazy(() => import('../components/AddHoldingModal'));
const AddFamilyModal = React.lazy(() => import('../components/AddFamilyModal'));
const RenamePortfolioModal = React.lazy(() => import('../components/RenamePortfolioModal'));
const ChangePinModal = React.lazy(() => import('../components/ChangePinModal'));
const SmartImportModal = React.lazy(() => import('../components/SmartImportModal'));
import type { ImportRow } from '../components/ExportPanel'; // type-only: erased at build time
import { AddHoldingPayload } from '../components/AddHoldingModal';

import DashboardWidgets from '../components/DashboardWidgets';
import PWAInstallBanner from '../components/PWAInstallBanner';
import { useModalState } from '../hooks/useModalState';

const PieChart = React.lazy(() => import('../components/PieChart'));
const BarChart = React.lazy(() => import('../components/BarChart'));
const PortfolioAssistant = React.lazy(() => import('../components/PortfolioAssistant'));
// Lazy-loaded: only fetched when activeTab === 'all' renders it on screen
const InsightsPanel = React.lazy(() => import('../components/InsightsPanel'));

import { useParams, useNavigate } from 'react-router-dom';
import { formatINR, formatPercent } from '../utils/formatters';
import { usePortfolioState, usePortfolioActions } from '../contexts/PortfolioContext';
import { useToastActions } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePortfolioInsights } from '../hooks/usePortfolioInsights';
import { useDismissibleAlerts } from '../hooks/useAlerts';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { getBreakdownSlices } from '../utils/chartHelpers';
import { classBreakdown, estimateTodayPnL } from '../utils/portfolioCalcs';
import { Badge } from '../components/ui/Badge';

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
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 animate-pulse" 
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
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 animate-pulse" 
          style={{ height: placeholderHeight }} 
        />
      )}
    </div>
  );
}

type AssetTab = 'home' | 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | 'widgets' | 'tax';

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
  const isMobile = useIsMobile();

  const activeAsset = (asset as AssetTab) || (isMobile ? 'home' : 'stocks');
  const assetTabSectionRef = useRef<HTMLDivElement>(null);

  const scrollToAssetSection = useCallback(() => {
    setTimeout(() => {
      if (assetTabSectionRef.current) {
        const headerOffset = 84; // 64px sticky header + 20px padding
        const elementPosition = assetTabSectionRef.current.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth'
        });
      }
    }, 40);
  }, []);

  const setActiveAsset = useCallback((newAsset: AssetTab) => {
    navigate(`/${family || 'all'}/${newAsset}`);
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      scrollToAssetSection();
    }
  }, [navigate, family, isMobile, scrollToAssetSection]);
  const {
    quickAddTarget, setQuickAddTarget, clearQuickAddTarget,
    showAddModal, openAddModal, closeAddModal,
    showAddFamily, openAddFamily, closeAddFamily,
    renameTarget, openRenameModal, closeRenameModal,
    deleteTarget, openDeleteModal, closeDeleteModal,
    isDeleting, setIsDeleting,
    showMobileAlerts, openMobileAlerts, closeMobileAlerts,
    showChangePinModal, openChangePinModal, closeChangePinModal,
    showSmartImport, openSmartImport, closeSmartImport,
    isAnyModalOpen,
  } = useModalState();

  // Persist active asset tab
  useEffect(() => {
    try { localStorage.setItem('finance_last_asset_tab', activeAsset); } catch { /* ignore */ }
  }, [activeAsset]);

  // Keyboard shortcuts
  useKeyboardShortcuts(useCallback(() => refreshPrices(), [refreshPrices]));

  // Swipe tab navigation
  const swipeNav = useSwipeNavigation({
    activeAsset,
    setActiveAsset,
  });

  const ptr = usePullToRefresh({
    onRefresh: refreshPrices,
  });

  const handleCombinedTouchStart = useCallback((e: React.TouchEvent) => {
    swipeNav.handleTouchStart(e);
    ptr.handleTouchStart(e);
  }, [swipeNav, ptr]);

  const handleCombinedTouchMove = useCallback((e: React.TouchEvent) => {
    swipeNav.handleTouchMove(e);
    ptr.handleTouchMove(e);
  }, [swipeNav, ptr]);

  const handleCombinedTouchEnd = useCallback((e: React.TouchEvent) => {
    swipeNav.handleTouchEnd(e);
    ptr.handleTouchEnd();
  }, [swipeNav, ptr]);

  const handleCombinedTouchCancel = useCallback(() => {
    ptr.handleTouchCancel();
  }, [ptr]);

  const portfolio = activePortfolio;
  const todayPnL = useMemo(() => estimateTodayPnL(portfolio, portfolios), [portfolio, portfolios]);

  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > 120 && currentScrollY > lastScrollY.current + 15) {
            setIsScrollingDown(true);
          } else if (currentScrollY < lastScrollY.current - 15 || currentScrollY <= 60) {
            setIsScrollingDown(false);
          }
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const effectiveAsset = activeAsset === 'home' && !isMobile ? 'stocks' : activeAsset;

  const handleSidebarTabChange = useCallback((tabId: string) => {
    setActiveAsset(tabId as AssetTab);
  }, [setActiveAsset]);

  const handleFloatingAddAsset = useCallback((type: AssetTab) => {
    setActiveAsset(type);
    if (type !== 'home') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setQuickAddTarget(type as any);
    }
  }, [setQuickAddTarget, setActiveAsset]);

  const insights = usePortfolioInsights(portfolios);

  const { visibleAlerts, handleDismissAlert, handleDismissAll } = useDismissibleAlerts(portfolios);

  // Proactive background notification check for upcoming maturities & renewals
  useEffect(() => {
    if (portfolios.length > 0) {
      import('../utils/notifications').then(({ checkAndNotifyMaturities }) => {
        checkAndNotifyMaturities(portfolios);
      });
    }
  }, [portfolios]);

  const isLoadingPrices = priceStatus === 'loading';
  const isLoading = isLoadingPrices; // alias for SummaryCards prop

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
  const todayPnLPercent = useMemo(() => {
    const totalCurrentStocks = portfolio ? (portfolio.stocksValue || 0) : breakdown.stocks;
    const prevCurrentStocks = totalCurrentStocks - todayPnL;
    return prevCurrentStocks > 0 ? (todayPnL / prevCurrentStocks) * 100 : 0;
  }, [portfolio, breakdown.stocks, todayPnL]);

  const barChartPortfolios = useMemo(
    () => (activeTab === 'all' ? portfolios : (portfolio ? [portfolio] : [])),
    [activeTab, portfolios, portfolio]
  );

  const handleSliceClick = useCallback((label: string) => {
    const map: Record<string, AssetTab> = {
      'Stocks': 'stocks',
      'FD': 'fd',
      'RD': 'rd',
      'SIP': 'sip',
      'Gold': 'gold',
      'Realty': 'real_estate',
    };
    const target = map[label];
    if (target) {
      setActiveAsset(target);
    }
  }, [setActiveAsset]);

  // ─── Handlers ───
  const renderDashboardWidgets = (isMobileLayout: boolean) => {
    const netWorthChart = (
      <SectionErrorBoundary sectionName="Net Worth Timeline">
        <LazyChartWrapper
          importFunc={() => import('../components/NetWorthTimelineChart')}
          placeholderHeight={370}
          fallback={<div className="h-[370px] bg-white dark:bg-slate-800 rounded-xl animate-pulse" />}
          props={{ 
            history: netWorthHistory, 
            currentNetWorth: summaryData.totalCurrentValue,
            currentStocks: breakdown.stocks,
            currentFD: breakdown.fd,
          }}
        />
      </SectionErrorBoundary>
    );

    const portfolioAssistant = (
      <SectionErrorBoundary sectionName="AI Portfolio Assistant">
        <LazyViewport placeholderHeight={370}>
          <Suspense fallback={<div className="h-[370px] apple-card rounded-xl animate-pulse" />}>
            <PortfolioAssistant portfolios={portfolios} />
          </Suspense>
        </LazyViewport>
      </SectionErrorBoundary>
    );

    const pieChart = (
      <SectionErrorBoundary sectionName="Asset Class Pie Chart">
        <LazyViewport placeholderHeight={370}>
          <Suspense fallback={<div className="h-[370px] bg-white dark:bg-slate-800 rounded-xl animate-pulse" />}>
            <PieChart 
              slices={breakdownSlices} 
              title={`Asset Class Breakdown — ${summaryData.label}`}
              onSelectSlice={handleSliceClick}
            />
          </Suspense>
        </LazyViewport>
      </SectionErrorBoundary>
    );

    const barChart = (
      <SectionErrorBoundary sectionName="Asset Comparison Bar Chart">
        <LazyViewport placeholderHeight={370}>
          <Suspense fallback={<div className="h-[370px] bg-white dark:bg-slate-800 rounded-xl animate-pulse" />}>
            <BarChart portfolios={barChartPortfolios} />
          </Suspense>
        </LazyViewport>
      </SectionErrorBoundary>
    );

    if (isMobileLayout) {
      return (
        <div className="space-y-4">
          {netWorthChart}
          {portfolioAssistant}
          {pieChart}
          {barChart}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {netWorthChart}
        {portfolioAssistant}
        {pieChart}
        {barChart}
      </div>
    );
  };


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

  const handleAddFamilyClick = openAddFamily;
  const handleRenameClick = openRenameModal;
  const handleDeletePortfolio = openDeleteModal;

  const handleConfirmDeletePortfolio = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deletePortfolio(deleteTarget.id);
      if (activeTab === deleteTarget.name) {
        setActiveTab('all');
      }
      addToast('Family member deleted successfully', 'success');
      closeDeleteModal();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete family member', 'error');
    } finally {
      setIsDeleting(false);
    }
  }, [deletePortfolio, deleteTarget, activeTab, setActiveTab, addToast, closeDeleteModal, setIsDeleting]);

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
      onTouchStart={handleCombinedTouchStart}
      onTouchMove={handleCombinedTouchMove}
      onTouchEnd={handleCombinedTouchEnd}
      onTouchCancel={handleCombinedTouchCancel}
      className="min-h-screen bg-[var(--app-background)] pb-safe-content md:pb-0 text-[var(--text-primary)] transition-colors relative overflow-x-hidden"
    >
      {/* Pull to refresh indicator */}
      {(ptr.pullDistance > 0 || ptr.isRefreshing) && (
        <div className="absolute top-4 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div 
            className="w-9 h-9 rounded-full glass-panel flex items-center justify-center shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur"
            style={{ 
              transform: ptr.isRefreshing ? 'translateY(20px)' : `translateY(${Math.min(ptr.pullDistance, 60)}px)`,
              transition: ptr.isRefreshing ? 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none'
            }}
          >
            <div
              style={{
                transform: ptr.isRefreshing ? 'none' : `rotate(${ptr.pullDistance * 2}deg)`,
                transition: ptr.isRefreshing ? 'none' : 'transform 0.1s linear'
              }}
            >
              <RefreshCw 
                size={18} 
                className={`text-[var(--accent-blue)] ${ptr.isRefreshing ? 'animate-spin' : ''}`}
              />
            </div>
          </div>
        </div>
      )}
      {/* Print-only report header */}
      <div className="print-report-header hidden items-center justify-between px-8 py-6 border-b-2 border-slate-200 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Family Wealth Report</h1>
          <p className="text-sm text-slate-500 mt-0.5">Generated on {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-800">{formatINR(summaryData.totalCurrentValue)}</p>
          <p className={`text-sm font-semibold ${summaryData.totalPnL >= 0 ? 'text-[#34C759]' : 'text-[#ff3b30]'}`}>
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
        activePortfolioLabel={summaryData.label}
        isPriceStale={isPriceStale}
        isUsingCachedData={isUsingCachedData}
        onChangePinClick={openChangePinModal}
        onOpenSmartImport={openSmartImport}
        onOpenMobileAlerts={openMobileAlerts}
      />

      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
                <Suspense fallback={null}>
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
                    onOpenAlerts={openMobileAlerts}
                    portfolios={portfolios}
                    activePortfolio={portfolio}
                    netWorthHistory={netWorthHistory}
                  />
                </Suspense>

                {activeTab === 'all' && (
                  <SectionErrorBoundary sectionName="Portfolio Insights">
                    <Suspense fallback={<div className="h-40 bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />}>
                      <InsightsPanel
                        insights={insights}
                        portfolios={portfolios}
                        activePortfolio={portfolio}
                        onNavigateAsset={setActiveAsset}
                        onRefreshPrices={refreshPrices}
                        isLoadingPrices={isLoadingPrices}
                        isPriceStale={isPriceStale}
                        priceStatus={priceStatus}
                      />
                    </Suspense>
                  </SectionErrorBoundary>
                )}

                {renderDashboardWidgets(true)}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Sticky Mini Refresh Status Bar */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/30 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 backdrop-blur shadow-sm">
                  <div className="flex items-center gap-1.5 min-w-0" aria-live="polite">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${priceStatus === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="font-semibold shrink-0">{priceStatus === 'success' ? 'Live Prices' : 'Snapshot'}</span>
                    <span className="text-slate-400 dark:text-slate-700 shrink-0">•</span>
                    <span className="truncate">Updated {lastUpdated ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                  </div>
                  <button
                    onClick={refreshPrices}
                    disabled={isLoadingPrices}
                    className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 active:scale-[0.97] transition-all shrink-0 ml-2"
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
                    onAddHoldingClick={openAddModal}
                    onDeleteStock={tableDeleteHandler}
                    onUpdateStock={tableUpdateHandler}
                    onAddAsset={addAsset}
                    onUpdateAsset={updateAsset}
                    onDeleteAsset={deleteAsset}
                    quickAddTarget={quickAddTarget}
                    onQuickAddComplete={clearQuickAddTarget}
                    portfolioOptions={portfolioOptionsForModal}
                  />
                </SectionErrorBoundary>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Desktop layout: sidebar + main content area */}
            <div role="tabpanel" className="flex gap-0">
              <Suspense fallback={null}>
                <DesktopSidebar
                  activeTab={effectiveAsset}
                  onTabChange={handleSidebarTabChange}
                  portfolios={portfolios}
                  selectedPortfolioId={activeTab}
                  onSelectPortfolio={setActiveTab}
                  onOpenAddFamily={openAddFamily}
                  onOpenRename={openRenameModal}
                  onOpenSmartImport={openSmartImport}
                />
              </Suspense>

              {/* Main content area */}
              <div className="flex-1 min-w-0 space-y-6">
                {/* Summary metrics */}
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
                  netWorthHistory={netWorthHistory}
                />

                {/* Family Overview - drill-down member cards */}
                {activeTab === 'all' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {portfolios.map((p) => {
                      const pnlGain = p.totalPnL >= 0;
                      return (
                        <button
                          key={p.name}
                          onClick={() => setActiveTab(p.name)}
                          className="apple-card p-4 text-left hover:shadow-md transition-all duration-200 flex flex-col justify-between h-48 focus:ring-2 focus:ring-[#007aff]"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-xs font-semibold text-[var(--text-secondary)] truncate">{p.label}</span>
                              <Badge variant={pnlGain ? 'positive' : 'negative'} className="text-[10px] py-0 px-2">
                                {formatPercent(p.totalPnLPercent, 1)}
                              </Badge>
                            </div>
                            <p className={`text-xl font-bold text-[var(--text-primary)] tnum transition-opacity ${isLoadingPrices ? 'opacity-40' : ''}`}>
                              {formatINR(p.totalCurrentValue)}
                            </p>
                            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                              Invested: <span className="font-medium tnum">{formatINR(p.totalInvested)}</span>
                            </p>
                          </div>

                          <div className="pt-3 border-t border-[var(--border-subtle)] grid grid-cols-3 gap-2 text-[10px] text-[var(--text-secondary)]">
                            <div>
                              <p className="font-normal text-[var(--text-tertiary)]">Stocks</p>
                              <p className="font-semibold text-[var(--text-primary)] mt-0.5 tnum">{p.holdings.length}</p>
                            </div>
                            <div>
                              <p className="font-normal text-[var(--text-tertiary)]">FDs</p>
                              <p className="font-semibold text-[var(--text-primary)] mt-0.5 tnum">{p.fixedDeposits.length}</p>
                            </div>
                            <div>
                              <p className="font-normal text-[var(--text-tertiary)]">Properties</p>
                              <p className="font-semibold text-[var(--text-primary)] mt-0.5 tnum">{p.realEstate.length}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Wealth Mosaic — asset class totals */}
                {activeTab === 'all' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {[
                      { label: 'Stocks', value: breakdown.stocks, id: 'stocks' },
                      { label: 'FDs', value: breakdown.fd, id: 'fd' },
                      { label: 'RDs', value: breakdown.rd, id: 'rd' },
                      { label: 'SIPs', value: breakdown.sip, id: 'sip' },
                      { label: 'Gold', value: breakdown.gold, id: 'gold' },
                      { label: 'Real Estate', value: breakdown.realEstate, id: 'real_estate' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => setActiveAsset(item.id as AssetTab)}
                        className="apple-card p-3 flex flex-col justify-between text-left hover:shadow-md transition-all duration-200 cursor-pointer focus:ring-2 focus:ring-[#007aff]"
                      >
                        <span className="text-[10px] font-semibold text-[var(--text-secondary)]">{item.label}</span>
                        <p className="text-sm font-bold text-[var(--text-primary)] mt-1 tnum truncate">{formatINR(item.value)}</p>
                      </button>
                    ))}
                    <button
                      onClick={() => setActiveAsset('insurance')}
                      className="apple-card p-3 flex flex-col justify-between text-left hover:shadow-md transition-all duration-200 cursor-pointer focus:ring-2 focus:ring-[#007aff]"
                    >
                      <span className="text-[10px] font-semibold text-[var(--text-secondary)]">Insurance</span>
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)] mt-1 tnum">{formatINR(breakdown.insuranceCover)}</p>
                        <p className="text-[9px] text-[var(--text-tertiary)] mt-0.5 tnum">{formatINR(breakdown.insurancePremium)}/yr premium</p>
                      </div>
                    </button>
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
                        onNavigateAsset={setActiveAsset}
                        onRefreshPrices={refreshPrices}
                        isLoadingPrices={isLoadingPrices}
                        isPriceStale={isPriceStale}
                        priceStatus={priceStatus}
                      />
                    </Suspense>
                  </SectionErrorBoundary>
                )}

                {/* Dashboard charts — only on family overview */}
                {activeTab === 'all' && renderDashboardWidgets(false)}

                {/* 10-Asset Quick Access Shortcut Bar */}
                <QuickAccessShortcuts
                  activeAsset={effectiveAsset}
                  onSelectAsset={setActiveAsset}
                />

                {/* Stock holdings & Asset Registries — always at the bottom */}
                <div ref={assetTabSectionRef} id="asset-tab-content" className="scroll-mt-24">
                  <SectionErrorBoundary sectionName="Asset Tab Content">
                    <AssetTabContent
                      activeAsset={effectiveAsset}
                      visiblePortfolio={visiblePortfolio}
                      portfolios={portfolios}
                      priceStatus={priceStatus}
                      onAddHoldingClick={openAddModal}
                      onDeleteStock={tableDeleteHandler}
                      onUpdateStock={tableUpdateHandler}
                      onAddAsset={addAsset}
                      onUpdateAsset={updateAsset}
                      onDeleteAsset={deleteAsset}
                      quickAddTarget={quickAddTarget}
                      onQuickAddComplete={clearQuickAddTarget}
                      portfolioOptions={portfolioOptionsForModal}
                    />
                  </SectionErrorBoundary>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hidden md:block">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
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
      <MobileBottomNav
        activeAsset={activeAsset}
        onChangeAsset={setActiveAsset}
        alertCount={visibleAlerts.length}
        onOpenSmartImport={openSmartImport}
      />

      {/* Floating Add Menu (FAB) */}
      <FloatingAddMenu
        isHidden={isAnyModalOpen}
        isScrollingDown={isScrollingDown}
        onAddStock={openAddModal}
        onAddAsset={handleFloatingAddAsset}
        onOpenSmartImport={openSmartImport}
      />

      {/* Lazy loaded Modals wrapped in Suspense */}
      <Suspense fallback={null}>
        {/* Smart AI Document Import Modal */}
        {showSmartImport && (
          <SmartImportModal
            isOpen={showSmartImport}
            onClose={closeSmartImport}
          />
        )}

        {/* Add Holding Modal */}
        {showAddModal && (
          <AddHoldingModal
            onClose={closeAddModal}
            onAdd={handleAddHolding}
            portfolioOptions={portfolioOptionsForModal}
            defaultPortfolio={activeTab === 'all' ? portfolioOptionsForModal[0]?.name : activeTab}
          />
        )}

        {/* Add Family Member Modal */}
        {showAddFamily && (
          <AddFamilyModal
            isOpen={showAddFamily}
            onClose={closeAddFamily}
            onSubmit={handleAddFamilySubmit}
          />
        )}

        {/* Rename Portfolio Modal */}
        {renameTarget && (
          <RenamePortfolioModal
            isOpen={!!renameTarget}
            target={renameTarget}
            onClose={closeRenameModal}
            onSubmit={handleRenameSubmit}
          />
        )}

        {/* Change PIN Modal */}
        {showChangePinModal && (
          <ChangePinModal
            onClose={closeChangePinModal}
            onSuccess={() => {
              closeChangePinModal();
              addToast('PIN changed successfully', 'success');
            }}
          />
        )}

        {/* Mobile Alerts Full-Screen View */}
        {showMobileAlerts && (
          <MobileAlertsView
            alerts={visibleAlerts}
            onClose={closeMobileAlerts}
            onDismissAlert={handleDismissAlert}
            onDismissAll={handleDismissAll}
          />
        )}
      </Suspense>

      {/* Delete Portfolio Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDeletePortfolio}
        title="Delete Family Member"
        message={`Are you sure you want to delete ${deleteTarget?.label} and all of their holdings, fixed deposits, and other assets? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </div>
  );
}

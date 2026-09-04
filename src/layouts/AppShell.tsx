import React, { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react';
// Inline SVG icons — keeps lucide-react out of the critical post-unlock bundle
import { WifiOff, AlertCircle, RefreshCw, Pencil, Trash2 } from '../components/icons/AppIcons';


import Header from '../components/Header';
import SummaryCards from '../components/SummaryCards';
import FamilyTabBar from '../components/FamilyTabBar';
import AssetTabContent from '../components/AssetTabContent';
import SectionErrorBoundary from '../components/SectionErrorBoundary';

import FloatingAddMenu from '../components/FloatingAddMenu';
import { useIsMobile } from '../hooks/useIsMobile';
import { QuickAccessShortcuts } from '../components/ui/QuickAccessShortcuts';

import MobileBottomNav from '../components/MobileBottomNav';
import MobileStatusBar from '../components/MobileStatusBar';

// Viewport-specific lazy loaded layouts
const DesktopSidebar = React.lazy(() => import('./DesktopSidebar'));
const MobileHomeSummary = React.lazy(() => import('../components/MobileHomeSummary'));

import type { ImportRow } from '../components/ExportPanel'; // type-only: erased at build time
import { AddHoldingPayload } from '../components/AddHoldingModal';

import DashboardWidgets from '../components/DashboardWidgets';
import { AppShellModals } from './AppShellModals';
import { useModalState } from '../hooks/useModalState';

const PieChart = React.lazy(() => import('../components/PieChart'));
const BarChart = React.lazy(() => import('../components/BarChart'));
const PortfolioAssistant = React.lazy(() => import('../components/PortfolioAssistant'));
// Lazy-loaded: only fetched when activeTab === 'all' renders it on screen
const InsightsPanel = React.lazy(() => import('../components/InsightsPanel'));
import { InsightsSkeleton } from '../components/ui/ChartSkeleton';

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
import { estimateTodayPnL } from '../domains/portfolio/calculations/portfolioTotals';
import { classBreakdown } from '../domains/portfolio/calculations/allocation';
import { Badge } from '../components/ui/Badge';
import { AssetTab } from '../types/portfolio';
import { LazyViewport, LazyChartWrapper } from '../components/ui/LazyViewport';

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
      window.scrollTo(0, 0);
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
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

  // Idle prefetch primary registry view chunks to eliminate loading skeletons on tab switch
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefetchViews = () => {
      import('../components/stocks/StocksView');
      import('../components/PortfolioTable');
      import('../components/fd/FixedDepositView');
      import('../components/sip/SIPView');
      import('../components/gold/GoldHoldingView');
      import('../components/realestate/RealEstateView');
      import('../components/insurance/InsuranceView');
      import('../components/documents/DocumentVaultView');
      import('../components/tax/TaxHarvestingView');
    };
    if ('requestIdleCallback' in window) {
      const handle = (window as unknown as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(prefetchViews);
      return () => (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(prefetchViews, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Persist active asset tab
  useEffect(() => {
    try { localStorage.setItem('finance_last_asset_tab', activeAsset); } catch { /* ignore */ }
  }, [activeAsset]);

  // Full refresh: reload Supabase data + live stock prices
  const handleFullRefresh = useCallback(() => {
    load().catch(() => {});
    refreshPrices().catch(() => {});
  }, [load, refreshPrices]);

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
    swipeNav.handleTouchCancel();
    ptr.handleTouchCancel();
  }, [swipeNav, ptr]);

  const portfolio = activePortfolio;
  const todayPnL = useMemo(() => estimateTodayPnL(portfolio, portfolios), [portfolio, portfolios]);

  // Imperatively toggle a body class on scroll instead of calling setState.
  // This prevents AppShell (and all its children) from re-rendering on every
  // scroll RAF callback — the previous isScrollingDown state was never
  // consumed in JSX and was causing pure re-render overhead.
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > 120 && currentScrollY > lastScrollY.current + 15) {
            document.body.classList.add('is-scrolling-down');
          } else if (currentScrollY < lastScrollY.current - 15 || currentScrollY <= 60) {
            document.body.classList.remove('is-scrolling-down');
          }
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.classList.remove('is-scrolling-down');
    };
  }, []);

  const effectiveAsset = activeAsset === 'home' && !isMobile ? 'stocks' : activeAsset;

  const handleSidebarTabChange = useCallback((tabId: string) => {
    setActiveAsset(tabId as AssetTab);
  }, [setActiveAsset]);

  const handleFloatingAddAsset = useCallback((type: AssetTab) => {
    setActiveAsset(type);
    if (type !== 'home' && type !== 'widgets' && type !== 'tax') {
      setQuickAddTarget(type);
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

  // ─── Memoized Dashboard Widget Trees ───
  // Split into separate mobile/desktop memos so each only re-renders when its
  // specific data dependencies change — not on every AppShell state update.
  const mobileDashboardWidgets = useMemo(() => (
    <div className="space-y-4 mobile-section">
      <SectionErrorBoundary sectionName="Net Worth Timeline">
        <LazyChartWrapper
          importFunc={() => import('../components/NetWorthTimelineChart')}
          placeholderHeight={300}
          fallback={<div className="h-[300px] sm:h-[370px] bg-white dark:bg-slate-800 rounded-xl animate-pulse" />}
          props={{
            history: netWorthHistory,
            currentNetWorth: (breakdown.stocks || 0) + (breakdown.fd || 0),
            currentStocks: breakdown.stocks,
            currentFD: breakdown.fd,
          }}
        />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="AI Portfolio Assistant">
        <LazyViewport placeholderHeight={300}>
          <Suspense fallback={<div className="h-[300px] sm:h-[370px] apple-card rounded-xl animate-pulse" />}>
            <PortfolioAssistant portfolios={portfolios} onSelectAsset={handleSidebarTabChange} />
          </Suspense>
        </LazyViewport>
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="Asset Class Pie Chart">
        <LazyViewport placeholderHeight={300}>
          <Suspense fallback={<div className="h-[300px] sm:h-[370px] bg-white dark:bg-slate-800 rounded-xl animate-pulse" />}>
            <PieChart
              slices={breakdownSlices}
              title={`Asset Class Breakdown — ${summaryData.label}`}
              onSelectSlice={handleSliceClick}
            />
          </Suspense>
        </LazyViewport>
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="Asset Comparison Bar Chart">
        <LazyViewport placeholderHeight={300}>
          <Suspense fallback={<div className="h-[300px] sm:h-[370px] bg-white dark:bg-slate-800 rounded-xl animate-pulse" />}>
            <BarChart portfolios={barChartPortfolios} />
          </Suspense>
        </LazyViewport>
      </SectionErrorBoundary>
    </div>
  ), [netWorthHistory, summaryData.label, breakdown.stocks, breakdown.fd, breakdownSlices, barChartPortfolios, portfolios, handleSliceClick, handleSidebarTabChange]);

  const desktopDashboardWidgets = useMemo(() => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <SectionErrorBoundary sectionName="Net Worth Timeline">
        <LazyChartWrapper
          importFunc={() => import('../components/NetWorthTimelineChart')}
          placeholderHeight={370}
          fallback={<div className="h-[300px] sm:h-[370px] bg-white dark:bg-slate-800 rounded-xl animate-pulse" />}
          props={{
            history: netWorthHistory,
            currentNetWorth: (breakdown.stocks || 0) + (breakdown.fd || 0),
            currentStocks: breakdown.stocks,
            currentFD: breakdown.fd,
          }}
        />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="AI Portfolio Assistant">
        <LazyViewport placeholderHeight={370}>
          <Suspense fallback={<div className="h-[300px] sm:h-[370px] apple-card rounded-xl animate-pulse" />}>
            <PortfolioAssistant portfolios={portfolios} onSelectAsset={handleSidebarTabChange} />
          </Suspense>
        </LazyViewport>
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="Asset Class Pie Chart">
        <LazyViewport placeholderHeight={370}>
          <Suspense fallback={<div className="h-[300px] sm:h-[370px] bg-white dark:bg-slate-800 rounded-xl animate-pulse" />}>
            <PieChart
              slices={breakdownSlices}
              title={`Asset Class Breakdown — ${summaryData.label}`}
              onSelectSlice={handleSliceClick}
            />
          </Suspense>
        </LazyViewport>
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="Asset Comparison Bar Chart">
        <LazyViewport placeholderHeight={370}>
          <Suspense fallback={<div className="h-[300px] sm:h-[370px] bg-white dark:bg-slate-800 rounded-xl animate-pulse" />}>
            <BarChart portfolios={barChartPortfolios} />
          </Suspense>
        </LazyViewport>
      </SectionErrorBoundary>
    </div>
  ), [netWorthHistory, summaryData.label, breakdown.stocks, breakdown.fd, breakdownSlices, barChartPortfolios, portfolios, handleSliceClick, handleSidebarTabChange]);


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
      {/* 🌌 Antigravity Cosmic Ambient Atmosphere */}
      <div className="antigravity-bg" aria-hidden="true" />
      {/* Pull to refresh indicator — positioned below sticky header so it never clips */}
      {(ptr.pullDistance > 0 || ptr.isRefreshing) && (
        <div className="fixed top-16 left-0 right-0 flex justify-center z-[var(--z-overlay)] pointer-events-none">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-[var(--shadow-floating)] bg-[var(--surface)] border border-[var(--border-subtle)] backdrop-blur-md"
            style={{ 
              transform: ptr.isRefreshing ? 'translateY(12px)' : `translateY(${Math.min(ptr.pullDistance, 48)}px)`,
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
          <p className={`text-sm font-semibold ${summaryData.totalPnL >= 0 ? 'text-[var(--positive,#00b074)]' : 'text-[var(--negative,#df514c)]'}`}>
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
        onRefresh={handleFullRefresh}
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

      <div className="max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-3.5 sm:space-y-6 pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] sm:pb-8">
        {isUsingCachedData && (
          <div className="flex flex-col gap-2 rounded-[var(--radius-medium)] border border-[var(--accent-blue)]/30 bg-[var(--accent-blue-soft)] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-[var(--accent-blue)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <WifiOff size={15} className="shrink-0 text-[var(--accent-blue)]" />
              <span className="leading-snug truncate sm:whitespace-normal">
                Showing saved data (offline cache).
                {cacheUpdatedAt ? ` Saved at ${cacheUpdatedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.` : ''}
              </span>
            </div>
            <button
              onClick={load}
              className="self-start sm:self-auto rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-blue)] hover:bg-[var(--surface-secondary)] transition-colors ios-press shrink-0"
            >
              Retry sync
            </button>
          </div>
        )}

        {priceStatus === 'error' && (
          <div className="flex items-center gap-2.5 bg-[var(--warning-soft)] border border-[var(--warning)]/30 text-[var(--warning)] rounded-[var(--radius-medium)] px-3.5 sm:px-4 py-2 text-xs sm:text-sm">
            <AlertCircle size={15} className="shrink-0 text-[var(--warning)]" />
            <span className="leading-snug">Could not reach quote provider. Showing last known market data.</span>
          </div>
        )}

        {isPriceStale && priceStatus !== 'error' && (
          <div className="flex items-center gap-2.5 bg-[var(--warning-soft)] border border-[var(--warning)]/30 text-[var(--warning)] rounded-[var(--radius-medium)] px-3.5 sm:px-4 py-2 text-xs sm:text-sm">
            <AlertCircle size={15} className="shrink-0 text-[var(--warning)]" />
            <span className="leading-snug">Stock prices may be outdated. Press Ctrl+Shift+R to refresh.</span>
          </div>
        )}

        {priceStatus === 'success' && failedSymbols.length > 0 && (
          <div className="flex items-center gap-2.5 bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-[var(--radius-medium)] px-3.5 sm:px-4 py-2 text-xs sm:text-sm">
            <AlertCircle size={15} className="shrink-0 text-[var(--text-tertiary)]" />
            <span className="leading-snug">
              Some symbols did not resolve on quote provider and show avg price instead:{' '}
              <span className="font-semibold">{failedSymbols.join(', ')}</span>
            </span>
          </div>
        )}

        {isMobile ? (
          <main id="main-content" className="space-y-4 overflow-hidden">
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
                <Suspense fallback={
                  <div className="space-y-3 animate-pulse" aria-hidden="true">
                    <div className="h-44 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-large)]" />
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="h-24 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-large)]" />
                      <div className="h-24 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-large)]" />
                      <div className="h-24 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-large)]" />
                      <div className="h-24 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-large)]" />
                    </div>
                  </div>
                }>
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
                  <div className="mobile-section">
                    <SectionErrorBoundary sectionName="Portfolio Insights">
                      <Suspense fallback={<InsightsSkeleton />}>
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
                  </div>
                )}

                {/* Charts & AI Dashboard Widgets in Home after Assets */}
                <div className="space-y-4 pt-1">
                  {mobileDashboardWidgets}
                </div>
              </div>
            ) : (
              <div className="space-y-4 overflow-hidden">
                {/* Sticky Mini Refresh Status Bar */}
                <MobileStatusBar
                  priceStatus={priceStatus}
                  lastUpdated={lastUpdated}
                  isLoadingPrices={isLoadingPrices}
                  onRefresh={refreshPrices}
                />

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
          </main>
        ) : (
          <>
            {/* Desktop layout: sidebar + main content area */}
            <div className="flex gap-0">
              <Suspense fallback={<div className="hidden md:block w-60 shrink-0 pr-4 mr-4" aria-hidden="true" />}>
                <DesktopSidebar
                  activeTab={effectiveAsset}
                  onTabChange={handleSidebarTabChange}
                  portfolios={portfolios}
                  selectedPortfolioId={activeTab}
                  onSelectPortfolio={handleTabChange}
                  onOpenAddFamily={openAddFamily}
                  onOpenRename={openRenameModal}
                  onOpenDelete={openDeleteModal}
                  onOpenSmartImport={openSmartImport}
                />
              </Suspense>

              {/* Main content area */}
              <main id="main-content" className="flex-1 min-w-0 space-y-6">
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
                  <div className="apple-card rounded-[var(--radius-large)] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-card)] p-4 sm:p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {portfolios.map((p) => {
                        const pnlGain = p.totalPnL >= 0;
                        return (
                          <div
                            key={p.name}
                            onClick={() => handleTabChange(p.name)}
                            className="p-4 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)]/30 hover:bg-[var(--surface-secondary)]/80 border border-[var(--border-subtle)]/60 text-left transition-all duration-150 flex flex-col justify-between h-44 group cursor-pointer relative"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-xs font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors truncate">{p.label}</span>
                                <div className="flex items-center gap-1.5">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openRenameModal({ id: p.id, name: p.name, label: p.label });
                                      }}
                                      className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                                      title={`Rename ${p.label}`}
                                      aria-label={`Rename ${p.label}`}
                                    >
                                      <Pencil size={11} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openDeleteModal({ id: p.id, name: p.name, label: p.label });
                                      }}
                                      className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--negative)] hover:bg-[var(--negative-soft)] transition-colors cursor-pointer"
                                      title={`Delete ${p.label}`}
                                      aria-label={`Delete ${p.label}`}
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                  <Badge variant={pnlGain ? 'positive' : 'negative'} className="text-[10px] py-0.5 px-2 font-extrabold">
                                    {formatPercent(p.totalPnLPercent, 1)}
                                  </Badge>
                                </div>
                              </div>
                              <p className={`text-2xl font-extrabold text-[var(--text-primary)] text-financial tnum tracking-tight transition-opacity ${isLoadingPrices ? 'opacity-40' : ''}`}>
                                {formatINR(p.totalCurrentValue)}
                              </p>
                              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                                Invested: <span className="font-semibold text-[var(--text-secondary)] tnum">{formatINR(p.totalInvested)}</span>
                              </p>
                            </div>

                            <div className="pt-2.5 border-t border-[var(--border-subtle)] grid grid-cols-3 gap-2 text-[10px] text-[var(--text-secondary)]">
                              <div>
                                <p className="font-normal text-[var(--text-tertiary)]">Stocks</p>
                                <p className="font-bold text-[var(--text-primary)] mt-0.5 tnum">{p.holdings.length}</p>
                              </div>
                              <div>
                                <p className="font-normal text-[var(--text-tertiary)]">FDs</p>
                                <p className="font-bold text-[var(--text-primary)] mt-0.5 tnum">{p.fixedDeposits.length}</p>
                              </div>
                              <div>
                                <p className="font-normal text-[var(--text-tertiary)]">Properties</p>
                                <p className="font-bold text-[var(--text-primary)] mt-0.5 tnum">{p.realEstate.length}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Wealth Mosaic — asset class totals */}
                {activeTab === 'all' && (
                  <div className="apple-card rounded-[var(--radius-large)] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-card)] p-3 sm:p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
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
                          className="p-3 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)]/30 hover:bg-[var(--surface-secondary)]/80 border border-[var(--border-subtle)]/60 flex flex-col justify-between text-left transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] group"
                        >
                          <span className="text-[10px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] uppercase tracking-wider transition-colors">{item.label}</span>
                          <p className="text-sm sm:text-base font-bold text-[var(--text-primary)] mt-1 tnum truncate">{formatINR(item.value)}</p>
                        </button>
                      ))}
                      <button
                        onClick={() => setActiveAsset('insurance')}
                        className="p-3 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)]/30 hover:bg-[var(--surface-secondary)]/80 border border-[var(--border-subtle)]/60 flex flex-col justify-between text-left transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] group"
                      >
                        <span className="text-[10px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] uppercase tracking-wider transition-colors">Insurance</span>
                        <div>
                          <p className="text-sm sm:text-base font-bold text-[var(--text-primary)] mt-1 tnum truncate">{formatINR(breakdown.insuranceCover)}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 tnum">{formatINR(breakdown.insurancePremium)}/yr premium</p>
                        </div>
                      </button>
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
                {activeTab === 'all' && desktopDashboardWidgets}

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
              </main>
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
        onAddStock={openAddModal}
        onAddAsset={handleFloatingAddAsset}
        onDrawerStateChange={setIsMoreDrawerOpen}
      />

      {/* Floating Add Menu (FAB) */}
      <FloatingAddMenu
        isHidden={isAnyModalOpen || isMoreDrawerOpen}
        onAddStock={openAddModal}
        onAddAsset={handleFloatingAddAsset}
        onOpenSmartImport={openSmartImport}
      />

      <AppShellModals
        showSmartImport={showSmartImport}
        closeSmartImport={closeSmartImport}
        showAddModal={showAddModal}
        closeAddModal={closeAddModal}
        handleAddHolding={handleAddHolding}
        portfolioOptionsForModal={portfolioOptionsForModal}
        activeTab={activeTab}
        showAddFamily={showAddFamily}
        closeAddFamily={closeAddFamily}
        handleAddFamilySubmit={handleAddFamilySubmit}
        renameTarget={renameTarget}
        closeRenameModal={closeRenameModal}
        handleRenameSubmit={handleRenameSubmit}
        showChangePinModal={showChangePinModal}
        closeChangePinModal={closeChangePinModal}
        onPinChangeSuccess={() => {
          closeChangePinModal();
          addToast('PIN changed successfully', 'success');
        }}
        showMobileAlerts={showMobileAlerts}
        closeMobileAlerts={closeMobileAlerts}
        visibleAlerts={visibleAlerts}
        handleDismissAlert={handleDismissAlert}
        handleDismissAll={handleDismissAll}
        deleteTarget={deleteTarget}
        closeDeleteModal={closeDeleteModal}
        handleConfirmDeletePortfolio={handleConfirmDeletePortfolio}
        isDeleting={isDeleting}
      />
    </div>
  );
}

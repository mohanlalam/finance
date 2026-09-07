import React, { Suspense } from 'react';
import SectionErrorBoundary from '../components/SectionErrorBoundary';
import { LazyViewport, LazyChartWrapper } from '../components/ui/LazyViewport';
import { Portfolio } from '../types/portfolio';
import { NetWorthSnapshot } from '../hooks/usePortfolioData';
import { ChartSlice } from '../utils/chartHelpers';

const PieChart = React.lazy(() => import('../components/PieChart'));
const BarChart = React.lazy(() => import('../components/BarChart'));
const PortfolioAssistant = React.lazy(() => import('../components/PortfolioAssistant'));

export interface HomeDashboardWidgetsProps {
  isMobile: boolean;
  netWorthHistory: NetWorthSnapshot[];
  summaryLabel: string;
  breakdown: { stocks: number; fd: number };
  breakdownSlices: ChartSlice[];
  barChartPortfolios: Portfolio[];
  portfolios: Portfolio[];
  onSliceClick: (label: string) => void;
  onSelectAsset: (tab: string) => void;
}

export const HomeDashboardWidgets: React.FC<HomeDashboardWidgetsProps> = React.memo(function HomeDashboardWidgets({
  isMobile,
  netWorthHistory,
  summaryLabel,
  breakdown,
  breakdownSlices,
  barChartPortfolios,
  portfolios,
  onSliceClick,
  onSelectAsset,
}) {
  if (isMobile) {
    return (
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
        <SectionErrorBoundary sectionName="Asset Class Pie Chart">
          <LazyViewport placeholderHeight={300}>
            <Suspense fallback={<div className="h-[300px] sm:h-[370px] bg-white dark:bg-slate-800 rounded-xl animate-pulse" />}>
              <PieChart
                slices={breakdownSlices}
                title={`Asset Class Breakdown — ${summaryLabel}`}
                onSelectSlice={onSliceClick}
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
        <SectionErrorBoundary sectionName="AI Portfolio Assistant">
          <LazyViewport placeholderHeight={300}>
            <Suspense fallback={<div className="h-[300px] sm:h-[370px] apple-card rounded-xl animate-pulse" />}>
              <PortfolioAssistant portfolios={portfolios} onSelectAsset={onSelectAsset} />
            </Suspense>
          </LazyViewport>
        </SectionErrorBoundary>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch auto-rows-fr">
      <SectionErrorBoundary sectionName="Net Worth Timeline">
        <LazyChartWrapper
          className="h-full flex flex-col"
          importFunc={() => import('../components/NetWorthTimelineChart')}
          placeholderHeight={420}
          fallback={<div className="h-full min-h-[380px] lg:h-[420px] rounded-xl animate-shimmer border border-[var(--border-subtle)]" />}
          props={{
            history: netWorthHistory,
            currentNetWorth: (breakdown.stocks || 0) + (breakdown.fd || 0),
            currentStocks: breakdown.stocks,
            currentFD: breakdown.fd,
          }}
        />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="Asset Class Pie Chart">
        <LazyViewport placeholderHeight={420} className="h-full flex flex-col">
          <Suspense fallback={<div className="h-full min-h-[380px] lg:h-[420px] rounded-xl animate-shimmer border border-[var(--border-subtle)]" />}>
            <PieChart
              slices={breakdownSlices}
              title={`Asset Class Breakdown — ${summaryLabel}`}
              onSelectSlice={onSliceClick}
            />
          </Suspense>
        </LazyViewport>
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="Asset Comparison Bar Chart">
        <LazyViewport placeholderHeight={420} className="h-full flex flex-col">
          <Suspense fallback={<div className="h-full min-h-[380px] lg:h-[420px] rounded-xl animate-shimmer border border-[var(--border-subtle)]" />}>
            <BarChart portfolios={barChartPortfolios} />
          </Suspense>
        </LazyViewport>
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="AI Portfolio Assistant">
        <LazyViewport placeholderHeight={420} className="h-full flex flex-col">
          <Suspense fallback={<div className="h-full min-h-[380px] lg:h-[420px] rounded-xl animate-shimmer border border-[var(--border-subtle)]" />}>
            <PortfolioAssistant portfolios={portfolios} onSelectAsset={onSelectAsset} />
          </Suspense>
        </LazyViewport>
      </SectionErrorBoundary>
    </div>
  );
});

export default HomeDashboardWidgets;

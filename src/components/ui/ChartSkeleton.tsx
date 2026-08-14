import { Card } from './Card';
import { Skeleton } from './Skeleton';

/**
 * Shimmer skeleton matching the 370px fixed height NetWorthTimelineChart widget
 */
export function AreaChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card padding="md" className={`h-[370px] flex flex-col justify-between overflow-hidden ${className}`}>
      {/* Header controls skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton width="140px" height="18px" className="rounded-md" />
          <Skeleton width="90px" height="12px" className="rounded-sm" />
        </div>
        <div className="flex items-center gap-1">
          {['1M', '3M', '6M', '1Y', 'ALL'].map((label) => (
            <Skeleton key={label} width="36px" height="24px" className="rounded-md" />
          ))}
        </div>
      </div>

      {/* Simulated SVG Area Chart Wave */}
      <div className="relative flex-1 my-3 flex items-end pb-4">
        <svg
          className="w-full h-full opacity-30 animate-pulse text-slate-300 dark:text-slate-700"
          viewBox="0 0 400 150"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 130 Q 50 110, 100 115 T 200 80 T 300 60 T 400 30 L 400 150 L 0 150 Z"
            fill="currentColor"
          />
          <path
            d="M0 130 Q 50 110, 100 115 T 200 80 T 300 60 T 400 30"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>

        {/* X-axis ticks */}
        <div className="absolute bottom-0 inset-x-0 flex justify-between px-2">
          <Skeleton width="40px" height="10px" className="rounded-sm" />
          <Skeleton width="40px" height="10px" className="rounded-sm" />
          <Skeleton width="40px" height="10px" className="rounded-sm" />
          <Skeleton width="40px" height="10px" className="rounded-sm" />
        </div>
      </div>

      {/* Bottom Summary Metric */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <Skeleton width="100px" height="14px" className="rounded-sm" />
        <Skeleton width="80px" height="14px" className="rounded-sm" />
      </div>
    </Card>
  );
}

/**
 * Shimmer skeleton matching the 370px fixed height PieChart widget
 */
export function DonutChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card padding="md" className={`h-[370px] flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton width="120px" height="18px" className="rounded-md" />
        <Skeleton width="60px" height="24px" className="rounded-md" />
      </div>

      {/* Donut circle & legend */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-4 my-auto">
        <div className="w-36 h-36 rounded-full border-8 border-slate-200 dark:border-slate-800 animate-pulse" />
        <div className="space-y-2.5 w-full sm:w-44">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Skeleton width="10px" height="10px" className="rounded-full" />
                <Skeleton width="70px" height="12px" className="rounded-sm" />
              </div>
              <Skeleton width="35px" height="12px" className="rounded-sm" />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
        <Skeleton width="80px" height="12px" className="rounded-sm" />
        <Skeleton width="60px" height="12px" className="rounded-sm" />
      </div>
    </Card>
  );
}

/**
 * Shimmer skeleton matching the InsightsPanel widget
 */
export function InsightsSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card padding="md" className={`h-[370px] flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton width="130px" height="18px" className="rounded-md" />
        <Skeleton width="24px" height="24px" className="rounded-full" />
      </div>

      {/* 4 insight item rows */}
      <div className="space-y-3 my-auto">
        {[1, 2, 3, 4].map((idx) => (
          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2.5">
              <Skeleton width="28px" height="28px" className="rounded-md" />
              <div className="space-y-1">
                <Skeleton width="110px" height="13px" className="rounded-sm" />
                <Skeleton width="70px" height="10px" className="rounded-sm" />
              </div>
            </div>
            <Skeleton width="50px" height="16px" className="rounded-md" />
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
        <Skeleton width="100px" height="12px" className="rounded-sm" />
        <Skeleton width="40px" height="12px" className="rounded-sm" />
      </div>
    </Card>
  );
}

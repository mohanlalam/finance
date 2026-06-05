
interface AssetCardSkeletonProps {
  count?: number;
}

export function AssetCardSkeleton({ count = 3 }: AssetCardSkeletonProps) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading assets">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl flex flex-col justify-between space-y-4 shadow-sm"
        >
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Icon placeholder */}
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/50 shimmer-bar shrink-0" />
              {/* Labels placeholder */}
              <div className="space-y-2">
                <div className="h-4 w-32 bg-slate-100 dark:bg-slate-700/50 shimmer-bar rounded" />
                <div className="h-3 w-20 bg-slate-100 dark:bg-slate-700/30 shimmer-bar rounded" />
              </div>
            </div>
            {/* Status badge placeholder */}
            <div className="h-6 w-16 bg-slate-100 dark:bg-slate-700/40 shimmer-bar rounded-full" />
          </div>

          <div className="h-px bg-slate-100/50 dark:bg-slate-700/50" />

          {/* Metric grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="h-2.5 w-12 bg-slate-100/70 dark:bg-slate-700/30 shimmer-bar rounded" />
              <div className="h-4 w-20 bg-slate-100 dark:bg-slate-700/50 shimmer-bar rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-12 bg-slate-100/70 dark:bg-slate-700/30 shimmer-bar rounded" />
              <div className="h-4 w-20 bg-slate-100 dark:bg-slate-700/50 shimmer-bar rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-12 bg-slate-100/70 dark:bg-slate-700/30 shimmer-bar rounded" />
              <div className="h-4 w-24 bg-slate-100 dark:bg-slate-700/50 shimmer-bar rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AssetCardSkeleton;

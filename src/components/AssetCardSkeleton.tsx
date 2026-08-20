
interface AssetCardSkeletonProps {
  count?: number;
}

export function AssetCardSkeleton({ count = 3 }: AssetCardSkeletonProps) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading assets">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 apple-card flex flex-col justify-between space-y-4 shadow-sm opacity-0 animate-fade-in"
          style={{ animationDelay: `${i * 75}ms` }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Icon placeholder */}
              <div className="w-10 h-10 rounded-[var(--radius-large)] bg-[var(--surface-secondary)] shimmer-bar shrink-0" />
              {/* Labels placeholder */}
              <div className="space-y-2">
                <div className="h-4 w-32 bg-[var(--surface-secondary)] shimmer-bar rounded-[var(--radius-small)]" />
                <div className="h-3 w-20 bg-[var(--surface-secondary)]/70 shimmer-bar rounded-[var(--radius-small)]" />
              </div>
            </div>
            {/* Status badge placeholder */}
            <div className="h-6 w-16 bg-[var(--surface-secondary)] shimmer-bar rounded-full" />
          </div>

          <div className="h-px bg-[var(--border-subtle)]" />

          {/* Metric grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="h-2.5 w-12 bg-[var(--surface-secondary)]/70 shimmer-bar rounded-[var(--radius-small)]" />
              <div className="h-4 w-20 bg-[var(--surface-secondary)] shimmer-bar rounded-[var(--radius-small)]" />
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-12 bg-[var(--surface-secondary)]/70 shimmer-bar rounded-[var(--radius-small)]" />
              <div className="h-4 w-20 bg-[var(--surface-secondary)] shimmer-bar rounded-[var(--radius-small)]" />
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-12 bg-[var(--surface-secondary)]/70 shimmer-bar rounded-[var(--radius-small)]" />
              <div className="h-4 w-24 bg-[var(--surface-secondary)] shimmer-bar rounded-[var(--radius-small)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AssetCardSkeleton;

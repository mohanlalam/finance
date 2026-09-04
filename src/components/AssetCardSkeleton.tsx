
interface AssetCardSkeletonProps {
  count?: number;
}

export function AssetCardSkeleton({ count = 3 }: AssetCardSkeletonProps) {
  return (
    <div className="space-y-3 sm:space-y-4" role="status" aria-label="Loading assets">
      {/* Unified Banner Placeholder to prevent layout shift */}
      <div className="apple-card p-2.5 sm:p-3.5 bg-[var(--surface)] border border-[var(--border-subtle)] space-y-2 sm:space-y-3 animate-fade-in">
        {/* Row 1: Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 sm:pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] shimmer-bar shrink-0" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-36 bg-[var(--surface-secondary)] shimmer-bar rounded-[var(--radius-small)]" />
              <div className="h-2.5 w-48 bg-[var(--surface-secondary)]/70 shimmer-bar rounded-[var(--radius-small)]" />
            </div>
          </div>
          <div className="h-5 w-20 bg-[var(--surface-secondary)] shimmer-bar rounded-[var(--radius-small)]" />
        </div>

        {/* Row 2: Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-2 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/40 border border-[var(--border-subtle)] space-y-1.5">
              <div className="h-2 w-16 bg-[var(--surface-secondary)]/70 shimmer-bar rounded-[var(--radius-small)]" />
              <div className="h-4 w-24 bg-[var(--surface-secondary)] shimmer-bar rounded-[var(--radius-small)]" />
            </div>
          ))}
        </div>

        {/* Row 3: Member Breakdown */}
        <div className="pt-1.5 border-t border-[var(--border-subtle)]">
          <div className="h-2.5 w-28 bg-[var(--surface-secondary)]/60 shimmer-bar rounded-[var(--radius-small)] mb-1.5" />
          <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-11 rounded-[var(--radius-small)] bg-[var(--surface-secondary)]/40 border border-[var(--border-subtle)] shimmer-bar" />
            ))}
          </div>
        </div>
      </div>

      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 apple-card flex flex-col justify-between space-y-4 shadow-sm opacity-0 animate-fade-in"
          style={{ animationDelay: `${(i + 1) * 75}ms` }}
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

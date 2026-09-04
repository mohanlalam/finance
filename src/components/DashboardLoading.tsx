import React from 'react';
import { TrendingUp } from './icons/AppIcons';

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`shimmer-bar rounded-[var(--radius-small)] ${className}`} />;
}

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[var(--app-background)]" role="status" aria-label="Loading dashboard">
      <header className="sticky top-0 z-30 bg-[var(--surface-glass)] backdrop-blur-md border-b border-[var(--border-subtle)]">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-blue)] text-white flex items-center justify-center shadow-xs">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">Family Wealth</p>
              <p className="text-xs text-[var(--text-tertiary)]">Loading portfolio...</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <SkeletonBlock className="h-8 w-28 rounded-[var(--radius-medium)]" />
            <SkeletonBlock className="h-8 w-20 rounded-[var(--radius-medium)]" />
          </div>
        </div>
      </header>

      <main className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Family tabs skeleton */}
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((item) => (
            <SkeletonBlock key={item} className="h-9 w-28 rounded-[var(--radius-pill)]" />
          ))}
        </div>

        {/* Summary metric cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="apple-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <SkeletonBlock className="h-3.5 w-24" />
                <SkeletonBlock className="h-7 w-7 rounded-[var(--radius-small)]" />
              </div>
              <SkeletonBlock className="h-7 w-36" />
              <SkeletonBlock className="h-3 w-28" />
            </div>
          ))}
        </div>

        {/* 2x2 widget skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="apple-card p-5 space-y-4">
            <SkeletonBlock className="h-4 w-44" />
            <div className="flex items-center justify-center py-8">
              <SkeletonBlock className="h-44 w-44 rounded-full" />
            </div>
          </div>
          <div className="apple-card p-5 space-y-4">
            <SkeletonBlock className="h-4 w-40" />
            <div className="space-y-4 pt-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <SkeletonBlock className="h-3.5 w-20" />
                  <SkeletonBlock className="h-6 flex-1 rounded-[var(--radius-small)]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Asset table skeleton */}
        <div className="apple-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center">
            <SkeletonBlock className="h-4 w-36" />
            <SkeletonBlock className="h-8 w-28 rounded-[var(--radius-medium)]" />
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="grid grid-cols-5 gap-4 px-5 py-4">
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default React.memo(DashboardLoading);

import React from 'react';
import { TrendingUp } from 'lucide-react';

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-700 ${className}`} />;
}

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" role="status" aria-label="Loading dashboard">
      <header className="bg-slate-900 text-white">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-base font-bold leading-tight">Family Portfolio</p>
              <p className="text-xs text-slate-400">Loading dashboard</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <div className="h-3 w-24 bg-slate-700 rounded mb-2" />
            <div className="h-5 w-36 bg-slate-700 rounded" />
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((item) => (
            <SkeletonBlock key={item} className="h-10 w-36" />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <SkeletonBlock className="h-3 w-28" />
                <SkeletonBlock className="h-8 w-8 rounded-lg" />
              </div>
              <SkeletonBlock className="h-7 w-40 mb-3" />
              <SkeletonBlock className="h-3 w-32" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <SkeletonBlock className="h-4 w-44 mb-6" />
            <div className="flex items-center justify-center py-8">
              <SkeletonBlock className="h-48 w-48 rounded-full" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <SkeletonBlock className="h-4 w-40 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <SkeletonBlock className="h-3 w-20" />
                  <SkeletonBlock className="h-7 flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between">
            <SkeletonBlock className="h-4 w-36" />
            <SkeletonBlock className="h-8 w-28" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="grid grid-cols-5 gap-4 px-4 py-4">
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

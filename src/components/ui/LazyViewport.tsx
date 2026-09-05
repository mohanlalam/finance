import React, { useState, useEffect, useRef, Suspense } from 'react';

// Lazy viewport container that loads child components only when they are visible
export function LazyViewport({
  children,
  placeholderHeight = 240,
  className = 'h-full flex flex-col',
}: {
  children: React.ReactNode;
  placeholderHeight?: number;
  className?: string;
}) {
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
    <div
      ref={ref}
      className={className}
      style={{ minHeight: isIntersected ? undefined : placeholderHeight }}
    >
      {isIntersected ? children : (
        <div 
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 animate-pulse w-full h-full" 
          style={{ minHeight: placeholderHeight }} 
        />
      )}
    </div>
  );
}

// Lazy chart wrapper that ensures the dynamic import is only evaluated on intersection
export function LazyChartWrapper<TProps extends object>({
  importFunc,
  fallback,
  props,
  placeholderHeight = 240,
  className = 'h-full flex flex-col',
}: {
  importFunc: () => Promise<{ default: React.ComponentType<TProps> }>;
  fallback: React.ReactNode;
  props: TProps;
  placeholderHeight?: number;
  className?: string;
}) {
  const [isIntersected, setIsIntersected] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const importRef = useRef(importFunc);
  importRef.current = importFunc;
  const lazyComponentRef = useRef<React.ComponentType<TProps> | null>(null);

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

  if (isIntersected && !lazyComponentRef.current) {
    lazyComponentRef.current = React.lazy(importRef.current) as unknown as React.ComponentType<TProps>;
  }

  const LazyComponent = lazyComponentRef.current;

  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight: isIntersected ? undefined : placeholderHeight }}
    >
      {isIntersected && LazyComponent ? (
        <Suspense fallback={fallback}>
          <LazyComponent {...props} />
        </Suspense>
      ) : (
        <div 
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 animate-pulse w-full h-full" 
          style={{ minHeight: placeholderHeight }} 
        />
      )}
    </div>
  );
}

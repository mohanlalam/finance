/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const MobileContext = createContext<boolean | null>(null);

export interface MobileProviderProps {
  children: React.ReactNode;
  breakpoint?: number;
}

export function MobileProvider({ children, breakpoint = 767 }: MobileProviderProps) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [breakpoint]);

  return (
    <MobileContext.Provider value={isMobile}>
      {children}
    </MobileContext.Provider>
  );
}

/**
 * Fast-path hook to read the single shared isMobile state from MobileContext.
 * If used outside a MobileProvider, falls back to direct matchMedia check.
 */
export function useIsMobileContext(): boolean {
  const context = useContext(MobileContext);
  if (context !== null) {
    return context;
  }
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767px)').matches;
}

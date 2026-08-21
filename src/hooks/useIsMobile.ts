import { useState, useEffect } from 'react';
import { useIsMobileContext } from '../contexts/MobileContext';

/**
 * Shared reactive hook for mobile viewport detection (<= 767px).
 * Uses MobileContext when available to share a single mediaQuery subscriber across the entire component tree.
 */
export function useIsMobile(breakpoint: number = 767): boolean {
  const contextValue = useIsMobileContext();

  const [customIsMobile, setCustomIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
  });

  useEffect(() => {
    if (breakpoint === 767) return; // Managed by MobileContext
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setCustomIsMobile(e.matches);
    };

    setCustomIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [breakpoint]);

  if (breakpoint === 767) {
    return contextValue;
  }

  return customIsMobile;
}

export default useIsMobile;


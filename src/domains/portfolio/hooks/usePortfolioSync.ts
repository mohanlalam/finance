import { useState, useEffect, useRef, useMemo } from 'react';
import { portfolioSyncService } from '../services/portfolioSyncService';

export function usePortfolioSync() {
  const [isMutating, setIsMutating] = useState(portfolioSyncService.getIsMutating());
  const isMutatingRef = useRef(isMutating);

  useEffect(() => {
    return portfolioSyncService.subscribe((mutating) => {
      isMutatingRef.current = mutating;
      setIsMutating(mutating);
    });
  }, []);

  return useMemo(
    () => ({
      isMutating,
      isMutatingRef,
    }),
    [isMutating]
  );
}

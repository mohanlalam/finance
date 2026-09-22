import { useCallback, useState } from 'react';
import { marketDataService } from '../../../../infrastructure/market-data/marketDataService';

export interface MutualFundSchemeDetails {
  schemeCode: string;
  schemeName: string;
  nav: number | null;
  date?: string | null;
}

/**
 * Domain hook providing mutual fund scheme lookups and validation.
 * Decouples UI form modals from the infrastructure market data layer.
 */
export function useMutualFundLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupScheme = useCallback(async (schemeCode: string): Promise<MutualFundSchemeDetails | null> => {
    if (!schemeCode?.trim()) return null;
    setLoading(true);
    setError(null);
    try {
      const details = await marketDataService.fetchMutualFundNAV(schemeCode.trim());
      return details;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to lookup scheme';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    lookupScheme,
    loading,
    error,
  };
}

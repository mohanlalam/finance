import { fetchAMFIScheme } from '../../../utils/amfiClient';

export interface AMFIQuote {
  schemeCode: string;
  schemeName: string;
  nav: number;
  date?: string;
}

export class AMFIMarketDataProvider {
  name = 'AMFI India';

  async getNAV(schemeCode: string): Promise<AMFIQuote | null> {
    try {
      const details = await fetchAMFIScheme(schemeCode);
      if (details.latestNav === null) return null;
      return {
        schemeCode,
        schemeName: details.schemeName,
        nav: details.latestNav,
      };
    } catch {
      return null;
    }
  }
}

export const amfiMarketDataProvider = new AMFIMarketDataProvider();

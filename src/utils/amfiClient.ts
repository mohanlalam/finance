export interface AMFISchemeDetails {
  schemeName: string;
  latestNav: number | null;
}

/**
 * Fetches scheme name and latest NAV for a given mutual fund scheme code from AMFI.
 */
export async function fetchAMFIScheme(code: string): Promise<AMFISchemeDetails> {
  if (!code) {
    throw new Error('Scheme code is required');
  }
  const res = await fetch(`https://api.mfapi.in/mf/${code}`);
  if (!res.ok) {
    throw new Error(`Scheme not found (HTTP ${res.status})`);
  }
  const json = await res.json();
  if (!json.meta || !json.meta.scheme_name) {
    throw new Error('Invalid scheme code or details not found');
  }
  const latestNav = json.data && json.data.length > 0 ? parseFloat(json.data[0].nav) : null;
  return {
    schemeName: json.meta.scheme_name,
    latestNav: latestNav !== null && !isNaN(latestNav) ? latestNav : null,
  };
}

import { invokeFunction, AppApiError } from './apiClient';
import {
  isPinConfigured,
  getPinLength,
  isSessionVerified,
  markSessionVerified,
  clearSessionVerification,
  getHashedPin,
  hashPin,
  ensureHashedPin,
  clearCustomPin,
  setCustomPin,
  getCachedValidPinHash,
} from './sessionStore';

export {
  isPinConfigured,
  getPinLength,
  isSessionVerified,
  markSessionVerified,
  clearSessionVerification,
  getHashedPin,
  hashPin,
  ensureHashedPin,
  clearCustomPin,
  setCustomPin,
};

const CUSTOM_HASH_KEY = 'custom_app_pin_hash';
const ENV_PIN = typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_PIN
  ? String(import.meta.env.VITE_APP_PIN).trim()
  : '';

export async function verifyPin(pin: string): Promise<boolean> {
  const inputHash = await hashPin(pin);

  // 1. Custom PIN hash match (user configured PIN via device settings)
  const customHash = typeof localStorage !== 'undefined' ? localStorage.getItem(CUSTOM_HASH_KEY) : null;
  if (customHash) {
    if (customHash === inputHash) {
      markSessionVerified(inputHash);
      return true;
    }
    // Custom PIN is set but doesn't match — definitive wrong PIN
    return false;
  }

  // 2. Client environment master PIN match (if configured via VITE_APP_PIN)
  if (ENV_PIN) {
    const envHash = await hashPin(ENV_PIN);
    if (envHash === inputHash) {
      markSessionVerified(inputHash);
      return true;
    }
    return false;
  }

  // 3. Authoritative backend Edge Function check (fail-closed)
  try {
    const result = await invokeFunction<{ verified: boolean }>('verify-pin', {
      method: 'POST',
      body: { pin_hash: inputHash },
    });
    if (result?.verified === true) {
      markSessionVerified(inputHash);
      return true;
    }
    return false;
  } catch (err) {
    // If verify-pin is not found (404 / server / network error due to undeployed function),
    // fallback to verifying against the live holdings-crud endpoint
    if (err instanceof AppApiError && (err.status === 404 || err.code === 'server' || err.code === 'network')) {
      try {
        await invokeFunction('holdings-crud?action=list', {
          method: 'GET',
          headers: { 'X-App-Pin': inputHash },
        });
        markSessionVerified(inputHash);
        return true;
      } catch (fallbackErr) {
        if (fallbackErr instanceof AppApiError && fallbackErr.status === 401) {
          return false; // Valid request, but wrong PIN
        }
        // If server 500 or network error, check last known valid PIN hash for offline unlocking
        const cachedHash = getCachedValidPinHash();
        if (cachedHash && cachedHash === inputHash) {
          markSessionVerified(inputHash);
          return true;
        }
        throw fallbackErr;
      }
    }

    // Check cached hash if server threw before fallback
    const cachedHash = getCachedValidPinHash();
    if (cachedHash && cachedHash === inputHash) {
      markSessionVerified(inputHash);
      return true;
    }

    // Re-throw config/network/timeout/server errors so PinLockScreen can show
    // a helpful message and NOT count this as a failed PIN attempt.
    if (err && typeof err === 'object' && 'code' in err) {
      const code = (err as { code: string }).code;
      if (code === 'config' || code === 'network' || code === 'timeout' || code === 'server') {
        throw err;
      }
    }
    // 401/403 server response → wrong PIN (don't re-throw)
    return false;
  }
}

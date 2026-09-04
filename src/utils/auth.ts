import { invokeFunction, AppApiError } from './apiClient';
import {
  isPinConfigured,
  getPinLength,
  isSessionVerified,
  markSessionVerified,
  clearSessionVerification,
  getHashedPin,
  getSessionToken,
  setSessionToken,
  hashPin,
  ensureHashedPin,
  clearCustomPin,
  setCustomPin,
  verifyCustomPin,
  verifyOfflinePin,
  getLastAuthTime,
  updateLastAuthTime,
  isReauthRequired,
  getDeviceId,
} from './sessionStore';

export {
  isPinConfigured,
  getPinLength,
  isSessionVerified,
  markSessionVerified,
  clearSessionVerification,
  getHashedPin,
  getSessionToken,
  setSessionToken,
  hashPin,
  ensureHashedPin,
  clearCustomPin,
  setCustomPin,
  verifyCustomPin,
  getLastAuthTime,
  updateLastAuthTime,
  isReauthRequired,
  getDeviceId,
};

export async function verifyPin(pin: string): Promise<boolean> {
  const inputHash = await hashPin(pin);

  // 1. Custom PIN check via salted domain-separated verifier (never stores raw hash in localStorage)
  if (isPinConfigured()) {
    const isCustomValid = await verifyCustomPin(inputHash);
    if (isCustomValid) {
      markSessionVerified(inputHash);
      return true;
    }
    // Custom PIN is set but doesn't match — definitive wrong PIN
    return false;
  }

  // 2. Authoritative backend Edge Function check (fail-closed)
  try {
    const result = await invokeFunction<{ verified: boolean; session_token?: string }>('verify-pin', {
      method: 'POST',
      body: { pin_hash: inputHash },
    });
    if (result?.verified === true) {
      markSessionVerified(inputHash, result.session_token);
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
          skipCache: true,
        });
        markSessionVerified(inputHash);
        return true;
      } catch (fallbackErr) {
        if (fallbackErr instanceof AppApiError && fallbackErr.status === 401) {
          return false; // Valid request, but wrong PIN
        }
        // If server 500 or network error, check offline verifier for safe offline unlocking
        const isOfflineValid = await verifyOfflinePin(inputHash);
        if (isOfflineValid) {
          markSessionVerified(inputHash);
          return true;
        }
        throw fallbackErr;
      }
    }

    // Check offline verifier if server threw before fallback
    const isOfflineValid = await verifyOfflinePin(inputHash);
    if (isOfflineValid) {
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

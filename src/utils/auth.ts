import { invokeFunction } from './apiClient';
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

  // 2. Authoritative backend Edge Function check (fail-closed)
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
    // Re-throw config/network/timeout errors so PinLockScreen can show
    // a helpful message and NOT count this as a failed PIN attempt.
    if (err && typeof err === 'object' && 'code' in err) {
      const code = (err as { code: string }).code;
      if (code === 'config' || code === 'network' || code === 'timeout') {
        throw err;
      }
    }
    // 401/403 server response → wrong PIN (don't re-throw)
    return false;
  }
}

import { updateBiometricPinHash, disableBiometrics } from './biometrics';

const SESSION_KEY = 'finance_pin_verified';
const HASH_KEY = 'finance_hashed_pin';
const CUSTOM_HASH_KEY = 'custom_app_pin_hash';
const CUSTOM_LENGTH_KEY = 'custom_app_pin_length';

export function isPinConfigured(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return !!localStorage.getItem(CUSTOM_HASH_KEY);
}

export function getPinLength(): number {
  if (typeof localStorage === 'undefined') return 4;
  const customLength = localStorage.getItem(CUSTOM_LENGTH_KEY);
  if (customLength) return parseInt(customLength, 10);
  return 4;
}

export function isSessionVerified(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export function markSessionVerified(hashedPin?: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, 'true');
  if (hashedPin) {
    sessionStorage.setItem(HASH_KEY, hashedPin);
  }
}

export function clearSessionVerification(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(HASH_KEY);
  }
}

export function getHashedPin(): string {
  if (typeof sessionStorage === 'undefined') return '';
  return sessionStorage.getItem(HASH_KEY) ?? '';
}

export async function hashPin(pin: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function ensureHashedPin(): Promise<string> {
  const sessionHash = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(HASH_KEY) : null;
  if (sessionHash) return sessionHash;

  const customHash = typeof localStorage !== 'undefined' ? localStorage.getItem(CUSTOM_HASH_KEY) : null;
  const hash = customHash || '';

  if (hash && isSessionVerified() && typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(HASH_KEY, hash);
  }
  return hash;
}

/** Reset any user-defined custom PIN */
export function clearCustomPin(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(CUSTOM_HASH_KEY);
    localStorage.removeItem(CUSTOM_LENGTH_KEY);
  }
  disableBiometrics();
}

export async function setCustomPin(newPin: string): Promise<void> {
  const hash = await hashPin(newPin);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CUSTOM_HASH_KEY, hash);
    localStorage.setItem(CUSTOM_LENGTH_KEY, newPin.length.toString());
  }
  updateBiometricPinHash(hash);
  markSessionVerified(hash);
}

import { clearApiSessionCache } from './apiClient';

const APP_PIN = (import.meta.env.VITE_APP_PIN as string | undefined) ?? '';
const SESSION_KEY = 'finance_pin_verified';
const HASH_KEY = 'finance_hashed_pin';
const CUSTOM_HASH_KEY = 'custom_app_pin_hash';
const CUSTOM_LENGTH_KEY = 'custom_app_pin_length';

export function isPinConfigured(): boolean {
  return APP_PIN.length >= 4 || !!localStorage.getItem(CUSTOM_HASH_KEY);
}

export function getPinLength(): number {
  const customLength = localStorage.getItem(CUSTOM_LENGTH_KEY);
  if (customLength) return parseInt(customLength, 10);
  return APP_PIN.length || 4;
}

export function isSessionVerified(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export function markSessionVerified(hashedPin?: string): void {
  sessionStorage.setItem(SESSION_KEY, 'true');
  if (hashedPin) {
    sessionStorage.setItem(HASH_KEY, hashedPin);
  }
}

export function clearSessionVerification(): void {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(HASH_KEY);
  clearApiSessionCache();
}

export function getHashedPin(): string {
  return sessionStorage.getItem(HASH_KEY) ?? '';
}

export async function hashPin(pin: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function ensureHashedPin(): Promise<string> {
  if (!isSessionVerified()) return '';

  const sessionHash = sessionStorage.getItem(HASH_KEY);
  if (sessionHash) return sessionHash;

  const customHash = localStorage.getItem(CUSTOM_HASH_KEY);
  const hash = customHash || (APP_PIN ? await hashPin(APP_PIN) : '');
  
  if (hash) {
    sessionStorage.setItem(HASH_KEY, hash);
  }
  return hash;
}

export async function verifyPin(pin: string): Promise<boolean> {
  const inputHash = await hashPin(pin);
  const customHash = localStorage.getItem(CUSTOM_HASH_KEY);
  
  // 1. Custom PIN match
  if (customHash && customHash === inputHash) {
    return true;
  }

  // 2. Master APP_PIN match
  if (APP_PIN) {
    const expectedHash = await hashPin(APP_PIN);
    if (inputHash === expectedHash || pin === APP_PIN) {
      return true;
    }
  }
  
  // 3. Fallback to backend Edge Function
  try {
    const { invokeFunction } = await import('./apiClient');
    const result = await invokeFunction<{ verified: boolean }>('verify-pin', {
      method: 'POST',
      body: { pin_hash: inputHash },
    });
    if (result?.verified === true) {
      return true;
    }
  } catch {
    // Ignore network / server errors
  }

  return false;
}

export async function setCustomPin(newPin: string): Promise<void> {
  const hash = await hashPin(newPin);
  localStorage.setItem(CUSTOM_HASH_KEY, hash);
  localStorage.setItem(CUSTOM_LENGTH_KEY, newPin.length.toString());
  clearApiSessionCache(); // Flush cached PIN hash & inflight requests immediately
  markSessionVerified(hash);
}

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
  if (!isPinConfigured()) return '';
  if (!isSessionVerified()) return '';

  const customHash = localStorage.getItem(CUSTOM_HASH_KEY);
  const hash = customHash || await hashPin(APP_PIN);
  
  if (sessionStorage.getItem(HASH_KEY) !== hash) {
    sessionStorage.setItem(HASH_KEY, hash);
  }
  return hash;
}

export async function verifyPin(pin: string): Promise<boolean> {
  const customHash = localStorage.getItem(CUSTOM_HASH_KEY);
  const inputHash = await hashPin(pin);
  
  if (customHash) {
    return customHash === inputHash;
  }
  
  return pin === APP_PIN;
}

export async function setCustomPin(newPin: string): Promise<void> {
  const hash = await hashPin(newPin);
  localStorage.setItem(CUSTOM_HASH_KEY, hash);
  localStorage.setItem(CUSTOM_LENGTH_KEY, newPin.length.toString());
  markSessionVerified(hash);
}

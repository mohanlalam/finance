const APP_PIN = (import.meta.env.VITE_APP_PIN as string | undefined) ?? '';
const SESSION_KEY = 'finance_pin_verified';
const HASH_KEY = 'finance_hashed_pin';

export function isPinConfigured(): boolean {
  return APP_PIN.length >= 4;
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

export function getHashedPin(): string {
  return sessionStorage.getItem(HASH_KEY) ?? '';
}

export async function hashPin(pin: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Auto-recover hash if already verified in session
if (isPinConfigured() && isSessionVerified() && !sessionStorage.getItem(HASH_KEY)) {
  hashPin(APP_PIN).then(hash => {
    sessionStorage.setItem(HASH_KEY, hash);
  }).catch(err => {
    console.error('Failed to auto-recover PIN hash:', err);
  });
}


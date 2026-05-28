const APP_PIN = (import.meta.env.VITE_APP_PIN as string | undefined) ?? '';
const SESSION_KEY = 'finance_pin_verified';

export function isPinConfigured(): boolean {
  return APP_PIN.length >= 4;
}

export function isSessionVerified(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export function markSessionVerified(): void {
  sessionStorage.setItem(SESSION_KEY, 'true');
}

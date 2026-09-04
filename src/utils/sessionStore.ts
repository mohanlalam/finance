import { updateBiometricPinHash, disableBiometrics } from './biometrics';

const SESSION_KEY = 'finance_pin_verified';
const HASH_KEY = 'finance_hashed_pin';
const SESSION_TOKEN_KEY = 'finance_session_token';
const CUSTOM_VERIFIER_KEY = 'custom_app_pin_verifier';
const CUSTOM_LENGTH_KEY = 'custom_app_pin_length';
const OFFLINE_VERIFIER_KEY = 'finance_offline_pin_verifier';

// Legacy keys to purge/migrate
const LEGACY_CUSTOM_HASH_KEY = 'custom_app_pin_hash';

// In-memory session state (purged on tab close / reload if not in sessionStorage)
let _inMemorySessionToken: string | null = null;
let _inMemoryHashedPin: string | null = null;

// Automatic security hygiene: purge legacy plaintext/reusable PIN hashes from persistent storage
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('last_known_pin_hash');
    const legacyCustomHash = localStorage.getItem(LEGACY_CUSTOM_HASH_KEY);
    if (legacyCustomHash) {
      // Migrate to salted, domain-separated verifier and delete the reusable hash
      void hashPin(`vault_custom_pin_verifier:${legacyCustomHash}`).then((verifier) => {
        localStorage.setItem(CUSTOM_VERIFIER_KEY, verifier);
        localStorage.removeItem(LEGACY_CUSTOM_HASH_KEY);
      });
    }
  }
} catch {
  // Ignore in environments without localStorage
}

export async function setOfflinePinVerifier(hashedPin: string): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  // Double-hash with a domain-separated salt so stored verifier cannot be reused as server credential
  const verifier = await hashPin(`vault_offline_verifier:${hashedPin}`);
  localStorage.setItem(OFFLINE_VERIFIER_KEY, verifier);
}

export async function verifyOfflinePin(hashedPin: string): Promise<boolean> {
  if (typeof localStorage === 'undefined') return false;
  const stored = localStorage.getItem(OFFLINE_VERIFIER_KEY);
  if (!stored) return false;
  const verifier = await hashPin(`vault_offline_verifier:${hashedPin}`);
  return verifier === stored;
}

export function clearOfflinePinVerifier(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(OFFLINE_VERIFIER_KEY);
  }
}

/** @deprecated Retained for backwards compatibility; returns null to avoid leaking server credential */
export function getCachedValidPinHash(): string | null {
  return null;
}

/** @deprecated Use setOfflinePinVerifier instead */
export function setCachedValidPinHash(hash: string): void {
  void setOfflinePinVerifier(hash);
}

export function isPinConfigured(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return !!localStorage.getItem(CUSTOM_VERIFIER_KEY) || !!localStorage.getItem(LEGACY_CUSTOM_HASH_KEY);
}

export function getPinLength(): number {
  if (typeof localStorage !== 'undefined') {
    const customLength = localStorage.getItem(CUSTOM_LENGTH_KEY);
    if (customLength) return parseInt(customLength, 10);
  }
  return 4;
}

export function isSessionVerified(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export function getSessionToken(): string {
  if (_inMemorySessionToken) return _inMemorySessionToken;
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(SESSION_TOKEN_KEY) ?? '';
  }
  return '';
}

export function setSessionToken(token: string): void {
  _inMemorySessionToken = token;
  if (typeof sessionStorage !== 'undefined') {
    if (token) {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }
}

export function markSessionVerified(hashedPin?: string, sessionToken?: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, 'true');
  if (hashedPin) {
    _inMemoryHashedPin = hashedPin;
    sessionStorage.setItem(HASH_KEY, hashedPin);
    void setOfflinePinVerifier(hashedPin);
  }
  if (sessionToken) {
    setSessionToken(sessionToken);
  }
}

export function clearSessionVerification(): void {
  _inMemorySessionToken = null;
  _inMemoryHashedPin = null;
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(HASH_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

export function getHashedPin(): string {
  if (_inMemoryHashedPin) return _inMemoryHashedPin;
  if (typeof sessionStorage === 'undefined') return '';
  return sessionStorage.getItem(HASH_KEY) ?? '';
}

export async function hashPin(pin: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyCustomPin(inputHash: string): Promise<boolean> {
  if (typeof localStorage === 'undefined') return false;
  const storedVerifier = localStorage.getItem(CUSTOM_VERIFIER_KEY);
  if (storedVerifier) {
    const computed = await hashPin(`vault_custom_pin_verifier:${inputHash}`);
    return computed === storedVerifier;
  }
  const legacyHash = localStorage.getItem(LEGACY_CUSTOM_HASH_KEY);
  if (legacyHash) {
    if (legacyHash === inputHash) {
      // Migrate on the fly
      const verifier = await hashPin(`vault_custom_pin_verifier:${inputHash}`);
      localStorage.setItem(CUSTOM_VERIFIER_KEY, verifier);
      localStorage.removeItem(LEGACY_CUSTOM_HASH_KEY);
      return true;
    }
    return false;
  }
  return false;
}

export async function ensureHashedPin(): Promise<string> {
  if (_inMemoryHashedPin) return _inMemoryHashedPin;
  const sessionHash = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(HASH_KEY) : null;
  if (sessionHash) {
    _inMemoryHashedPin = sessionHash;
    return sessionHash;
  }
  return '';
}

/** Reset any user-defined custom PIN */
export function clearCustomPin(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(CUSTOM_VERIFIER_KEY);
    localStorage.removeItem(LEGACY_CUSTOM_HASH_KEY);
    localStorage.removeItem(CUSTOM_LENGTH_KEY);
  }
  clearOfflinePinVerifier();
  disableBiometrics();
}

export async function setCustomPin(newPin: string): Promise<void> {
  const hash = await hashPin(newPin);
  const verifier = await hashPin(`vault_custom_pin_verifier:${hash}`);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CUSTOM_VERIFIER_KEY, verifier);
    localStorage.setItem(CUSTOM_LENGTH_KEY, newPin.length.toString());
    localStorage.removeItem(LEGACY_CUSTOM_HASH_KEY);
  }
  await updateBiometricPinHash(hash);
  markSessionVerified(hash);
}

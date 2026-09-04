// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  hashPin,
  isPinConfigured,
  getPinLength,
  isSessionVerified,
  markSessionVerified,
  clearSessionVerification,
  getHashedPin,
  getSessionToken,
  setSessionToken,
  ensureHashedPin,
  verifyPin,
  setCustomPin,
  clearCustomPin,
  verifyCustomPin,
  getLastAuthTime,
  updateLastAuthTime,
  isReauthRequired,
} from '../auth';
import { invokeFunction } from '../apiClient';

// Mock apiClient and biometrics
vi.mock('../apiClient', () => ({
  clearApiSessionCache: vi.fn(),
  invokeFunction: vi.fn(),
}));

vi.mock('../biometrics', () => ({
  updateBiometricPinHash: vi.fn(),
  disableBiometrics: vi.fn(),
}));

describe('auth utility', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearSessionVerification();
    vi.clearAllMocks();
  });

  describe('hashPin', () => {
    it('produces deterministic SHA-256 hex string', async () => {
      const hash1 = await hashPin('1234');
      const hash2 = await hashPin('1234');
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('produces different hashes for different inputs', async () => {
      const hash1 = await hashPin('1234');
      const hash2 = await hashPin('1235');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('session verification and tokens', () => {
    it('defaults to not verified and empty tokens', () => {
      expect(isSessionVerified()).toBe(false);
      expect(getHashedPin()).toBe('');
      expect(getSessionToken()).toBe('');
    });

    it('marks session verified with hashed PIN and session token', () => {
      markSessionVerified('test-hash-123', 'test-token-xyz');
      expect(isSessionVerified()).toBe(true);
      expect(getHashedPin()).toBe('test-hash-123');
      expect(getSessionToken()).toBe('test-token-xyz');
    });

    it('clears session verification correctly including session token', () => {
      markSessionVerified('test-hash-123', 'test-token-xyz');
      clearSessionVerification();
      expect(isSessionVerified()).toBe(false);
      expect(getHashedPin()).toBe('');
      expect(getSessionToken()).toBe('');
    });

    it('allows setting session token independently', () => {
      setSessionToken('session-jwt-123');
      expect(getSessionToken()).toBe('session-jwt-123');
    });
  });

  describe('hardened custom PIN management', () => {
    it('stores domain-separated verifier and NEVER stores raw hash in localStorage', async () => {
      expect(isPinConfigured()).toBe(false);
      expect(getPinLength()).toBe(4);

      await setCustomPin('123456');
      expect(isPinConfigured()).toBe(true);
      expect(getPinLength()).toBe(6);
      expect(isSessionVerified()).toBe(true);

      // Verify that custom_app_pin_hash was NOT stored, but custom_app_pin_verifier was
      expect(localStorage.getItem('custom_app_pin_hash')).toBeNull();
      expect(localStorage.getItem('custom_app_pin_verifier')).toBeTruthy();
    });

    it('clears custom PIN and resets configuration', async () => {
      await setCustomPin('9876');
      expect(isPinConfigured()).toBe(true);

      clearCustomPin();
      expect(isPinConfigured()).toBe(false);
      expect(getPinLength()).toBe(4);
      expect(localStorage.getItem('custom_app_pin_verifier')).toBeNull();
    });

    it('verifies custom PIN matching verifier', async () => {
      await setCustomPin('4321');
      clearSessionVerification();

      const result = await verifyPin('4321');
      expect(result).toBe(true);
      expect(isSessionVerified()).toBe(true);

      const failResult = await verifyPin('0000');
      expect(failResult).toBe(false);
    });

    it('migrates legacy custom hash on the fly during verifyCustomPin', async () => {
      const pin = '7890';
      const hash = await hashPin(pin);
      localStorage.setItem('custom_app_pin_hash', hash);

      const isValid = await verifyCustomPin(hash);
      expect(isValid).toBe(true);
      expect(localStorage.getItem('custom_app_pin_hash')).toBeNull();
      expect(localStorage.getItem('custom_app_pin_verifier')).toBeTruthy();
    });
  });

  describe('ensureHashedPin and verifyPin with backend token', () => {
    it('returns in-memory or session hash if available', async () => {
      markSessionVerified('cached-hash-999');
      const hash = await ensureHashedPin();
      expect(hash).toBe('cached-hash-999');
    });

    it('receives and sets session token from verify-pin endpoint', async () => {
      vi.mocked(invokeFunction).mockResolvedValueOnce({
        verified: true,
        session_token: 'server-issued-hmac-token',
        expires_at: Date.now() + 3600000,
      });

      const pin = '3463';
      const ok = await verifyPin(pin);
      expect(ok).toBe(true);
      expect(isSessionVerified()).toBe(true);
      expect(getSessionToken()).toBe('server-issued-hmac-token');
    });
  });

  describe('session re-authentication and inactivity tracking', () => {
    it('initializes auth timestamp upon session verification', () => {
      markSessionVerified('test-hash');
      const authTime = getLastAuthTime();
      expect(authTime).toBeGreaterThan(0);
      expect(isReauthRequired(10000)).toBe(false);
    });

    it('requires reauth if session is not verified', () => {
      clearSessionVerification();
      expect(isReauthRequired()).toBe(true);
    });

    it('detects when timeout has elapsed', () => {
      markSessionVerified('test-hash');
      // Timeout of 0ms should immediately flag reauth required
      expect(isReauthRequired(0)).toBe(true);
    });

    it('updates auth timestamp when updateLastAuthTime is invoked', () => {
      const past = Date.now() - 50000;
      sessionStorage.setItem('finance_last_auth_time', String(past));
      updateLastAuthTime();
      expect(getLastAuthTime()).toBeGreaterThanOrEqual(Date.now() - 100);
    });
  });
});

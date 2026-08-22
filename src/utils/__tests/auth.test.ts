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
  ensureHashedPin,
  verifyPin,
  setCustomPin,
  clearCustomPin,
} from '../auth';

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

  describe('session verification', () => {
    it('defaults to not verified', () => {
      expect(isSessionVerified()).toBe(false);
      expect(getHashedPin()).toBe('');
    });

    it('marks session verified with hashed PIN', () => {
      markSessionVerified('test-hash-123');
      expect(isSessionVerified()).toBe(true);
      expect(getHashedPin()).toBe('test-hash-123');
    });

    it('clears session verification correctly', () => {
      markSessionVerified('test-hash-123');
      clearSessionVerification();
      expect(isSessionVerified()).toBe(false);
      expect(getHashedPin()).toBe('');
    });
  });

  describe('custom PIN management', () => {
    it('identifies when custom PIN is configured', async () => {
      expect(isPinConfigured()).toBe(false);
      expect(getPinLength()).toBe(4);

      await setCustomPin('123456');
      expect(isPinConfigured()).toBe(true);
      expect(getPinLength()).toBe(6);
      expect(isSessionVerified()).toBe(true);
    });

    it('clears custom PIN and resets session cache', async () => {
      await setCustomPin('9876');
      expect(isPinConfigured()).toBe(true);

      clearCustomPin();
      expect(isPinConfigured()).toBe(false);
      expect(getPinLength()).toBe(4);
    });

    it('verifies custom PIN matching hash', async () => {
      await setCustomPin('4321');
      clearSessionVerification();

      const result = await verifyPin('4321');
      expect(result).toBe(true);
      expect(isSessionVerified()).toBe(true);

      const failResult = await verifyPin('0000');
      expect(failResult).toBe(false);
    });
  });

  describe('ensureHashedPin', () => {
    it('returns session hash if available', async () => {
      markSessionVerified('cached-hash-999');
      const hash = await ensureHashedPin();
      expect(hash).toBe('cached-hash-999');
    });

    it('hydrates session from custom hash if session is verified', async () => {
      const testPin = '5555';
      const expectedHash = await hashPin(testPin);
      localStorage.setItem('custom_app_pin_hash', expectedHash);
      sessionStorage.setItem('finance_pin_verified', 'true');

      const hash = await ensureHashedPin();
      expect(hash).toBe(expectedHash);
      expect(sessionStorage.getItem('finance_hashed_pin')).toBe(expectedHash);
    });
  });
});

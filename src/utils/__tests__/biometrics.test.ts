// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isBiometricsSupported,
  isBiometricsEnrolled,
  isBiometricAutoPromptEnabled,
  setBiometricAutoPrompt,
  registerBiometrics,
  authenticateWithBiometrics,
  updateBiometricPinHash,
  disableBiometrics,
} from '../biometrics';

describe('biometrics.ts', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true, writable: true });
  });

  describe('isBiometricsSupported', () => {
    it('returns false when window.PublicKeyCredential is not available', async () => {
      const originalPK = window.PublicKeyCredential;
      // @ts-expect-error Mocking missing API
      delete window.PublicKeyCredential;
      const supported = await isBiometricsSupported();
      expect(supported).toBe(false);
      window.PublicKeyCredential = originalPK;
    });

    it('returns true when platform authenticator is available', async () => {
      // @ts-expect-error Mocking window.PublicKeyCredential
      window.PublicKeyCredential = {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true),
      };
      const supported = await isBiometricsSupported();
      expect(supported).toBe(true);
    });
  });

  describe('isBiometricsEnrolled & enrollment storage', () => {
    it('returns false when no credentials are in localStorage', () => {
      expect(isBiometricsEnrolled()).toBe(false);
    });

    it('returns true when all required keys exist', () => {
      localStorage.setItem('finance_biometric_enrolled', 'true');
      localStorage.setItem('finance_biometric_cred_id', 'test-cred-id');
      localStorage.setItem('finance_biometric_pin_hash', 'abc123hash');

      expect(isBiometricsEnrolled()).toBe(true);
    });

    it('disables biometrics cleanly', () => {
      localStorage.setItem('finance_biometric_enrolled', 'true');
      localStorage.setItem('finance_biometric_cred_id', 'test-cred-id');
      localStorage.setItem('finance_biometric_pin_hash', 'abc123hash');

      disableBiometrics();
      expect(isBiometricsEnrolled()).toBe(false);
      expect(localStorage.getItem('finance_biometric_cred_id')).toBeNull();
    });

    it('updates biometric PIN hash when PIN changes', async () => {
      localStorage.setItem('finance_biometric_enrolled', 'true');
      localStorage.setItem('finance_biometric_cred_id', 'test-cred-id');
      localStorage.setItem('finance_biometric_pin_hash', 'old-hash');

      await updateBiometricPinHash('new-hash');
      const stored = localStorage.getItem('finance_biometric_pin_hash');
      expect(stored).not.toBe('old-hash');
      expect(stored).toBeTruthy();
    });
  });

  describe('Auto-prompt preferences', () => {
    it('defaults to true when unset to auto-prompt on open', () => {
      expect(isBiometricAutoPromptEnabled()).toBe(true);
    });

    it('updates auto-prompt setting', () => {
      setBiometricAutoPrompt(false);
      expect(isBiometricAutoPromptEnabled()).toBe(false);
      setBiometricAutoPrompt(true);
      expect(isBiometricAutoPromptEnabled()).toBe(true);
    });
  });

  describe('registerBiometrics & authenticateWithBiometrics', () => {
    it('registers credential and persists encrypted hash on success', async () => {
      // @ts-expect-error Mocking window.PublicKeyCredential
      window.PublicKeyCredential = {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true),
      };

      const mockRawId = new Uint8Array([1, 2, 3, 4]).buffer;
      vi.stubGlobal('navigator', {
        credentials: {
          create: vi.fn().mockResolvedValue({
            rawId: mockRawId,
            id: 'cred-1',
            type: 'public-key',
          }),
        },
      });

      const success = await registerBiometrics('sha256pinHash123');
      expect(success).toBe(true);
      expect(isBiometricsEnrolled()).toBe(true);
      const stored = localStorage.getItem('finance_biometric_pin_hash');
      expect(stored).not.toBe('sha256pinHash123');
      expect(stored).toContain(':');
    });

    it('authenticates with biometrics and returns verified PIN hash', async () => {
      localStorage.setItem('finance_biometric_enrolled', 'true');
      localStorage.setItem('finance_biometric_cred_id', 'AQIDBA');
      localStorage.setItem('finance_biometric_pin_hash', 'verifiedHash999');

      vi.stubGlobal('navigator', {
        credentials: {
          get: vi.fn().mockResolvedValue({
            id: 'AQIDBA',
            type: 'public-key',
          }),
        },
      });

      const hash = await authenticateWithBiometrics();
      expect(hash).toBe('verifiedHash999');
    });

    it('returns null if biometrics verification was cancelled', async () => {
      localStorage.setItem('finance_biometric_enrolled', 'true');
      localStorage.setItem('finance_biometric_cred_id', 'AQIDBA');
      localStorage.setItem('finance_biometric_pin_hash', 'verifiedHash999');

      vi.stubGlobal('navigator', {
        credentials: {
          get: vi.fn().mockRejectedValue(new Error('User cancelled')),
        },
      });

      const hash = await authenticateWithBiometrics();
      expect(hash).toBeNull();
    });
  });
});

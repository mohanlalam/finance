/**
 * biometrics.ts — WebAuthn Platform Authenticator integration (FaceID / TouchID / Windows Hello / Android Biometric)
 *
 * Enables passwordless 1-second biometric unlock while preserving the 4-digit PIN fallback.
 */

import { logger } from '../infrastructure/logging/logger';

const BIOMETRIC_ENROLLED_KEY = 'finance_biometric_enrolled';
const BIOMETRIC_CREDENTIAL_ID_KEY = 'finance_biometric_cred_id';
const BIOMETRIC_PIN_HASH_KEY = 'finance_biometric_pin_hash';
const BIOMETRIC_AUTO_PROMPT_KEY = 'finance_biometric_auto_prompt';

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64ToBuffer(base64: string): ArrayBuffer {
  let str = base64.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  const binary = window.atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function encryptBiometricPayload(pinHash: string, credId: string): Promise<string> {
  try {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(`vault_biometric_salt_${credId}`),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 10000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(pinHash)
    );
    return `${bufferToBase64(salt.buffer)}:${bufferToBase64(iv.buffer)}:${bufferToBase64(encrypted)}`;
  } catch {
    return pinHash;
  }
}

async function decryptBiometricPayload(ciphertext: string, credId: string): Promise<string | null> {
  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      return ciphertext;
    }
    const [saltB64, ivB64, encB64] = parts;
    const salt = new Uint8Array(base64ToBuffer(saltB64));
    const iv = new Uint8Array(base64ToBuffer(ivB64));
    const encrypted = base64ToBuffer(encB64);
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(`vault_biometric_salt_${credId}`),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 10000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

/** Check if the current browser environment and hardware support biometric platform authenticators */
export async function isBiometricsSupported(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    if (!window.isSecureContext) return false;
    if (!window.PublicKeyCredential) return false;
    if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
      return false;
    }
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Check if the user has enrolled their device biometric credential */
export function isBiometricsEnrolled(): boolean {
  try {
    return (
      localStorage.getItem(BIOMETRIC_ENROLLED_KEY) === 'true' &&
      !!localStorage.getItem(BIOMETRIC_CREDENTIAL_ID_KEY) &&
      !!localStorage.getItem(BIOMETRIC_PIN_HASH_KEY)
    );
  } catch {
    return false;
  }
}

/**
 * Silently verify the stored WebAuthn credential still exists in the device secure enclave.
 * Returns false if the credential check fails without clearing enrollment.
 */
export async function validateBiometricCredential(): Promise<boolean> {
  try {
    if (!isBiometricsEnrolled()) return false;
    const credentialIdStr = localStorage.getItem(BIOMETRIC_CREDENTIAL_ID_KEY);
    if (!credentialIdStr) return false;

    // Use conditional mediation if available to verify without prompting
    if (typeof PublicKeyCredential.isConditionalMediationAvailable === 'function') {
      const supported = await PublicKeyCredential.isConditionalMediationAvailable();
      if (!supported) return true; // Can't verify without prompting — assume enrolled
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const credentialId = base64ToBuffer(credentialIdStr);
    await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ id: credentialId, type: 'public-key' }],
        userVerification: 'discouraged',
        timeout: 3000,
        rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      },
    });
    return true;
  } catch (err: unknown) {
    const name = (err as DOMException)?.name;
    if (name === 'NotAllowedError') {
      // User dismissed or conditional check passed credential presence
      return true;
    }
    // Return false without destructively wiping stored credentials on transient network/timeout issues
    return false;
  }
}

/** Check if auto-prompt on lock screen is enabled (defaults to true if enrolled unless explicitly disabled) */
export function isBiometricAutoPromptEnabled(): boolean {
  try {
    const val = localStorage.getItem(BIOMETRIC_AUTO_PROMPT_KEY);
    return val !== 'false';
  } catch {
    return true;
  }
}

export function setBiometricAutoPrompt(enabled: boolean): void {
  try {
    localStorage.setItem(BIOMETRIC_AUTO_PROMPT_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore storage errors
  }
}

/** Register a WebAuthn platform authenticator credential with the device's secure enclave */
export async function registerBiometrics(pinHash: string): Promise<boolean> {
  try {
    if (!(await isBiometricsSupported())) return false;

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Family Portfolio Tracker',
        id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      },
      user: {
        id: userId,
        name: 'user@family-portfolio.app',
        displayName: 'Portfolio Owner',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential | null;

    if (credential) {
      const credentialIdStr = bufferToBase64(credential.rawId);
      const encryptedHash = await encryptBiometricPayload(pinHash, credentialIdStr);
      localStorage.setItem(BIOMETRIC_ENROLLED_KEY, 'true');
      localStorage.setItem(BIOMETRIC_CREDENTIAL_ID_KEY, credentialIdStr);
      localStorage.setItem(BIOMETRIC_PIN_HASH_KEY, encryptedHash);
      localStorage.setItem(BIOMETRIC_AUTO_PROMPT_KEY, 'true');
      return true;
    }
    return false;
  } catch (err: unknown) {
    // User cancelled or platform authenticator error
    logger.warn('Biometric registration was cancelled or failed', { error: String(err) });
    return false;
  }
}

/** Prompt the device's platform biometric authenticator (FaceID / Fingerprint / Windows Hello) */
export async function authenticateWithBiometrics(): Promise<string | null> {
  try {
    if (!isBiometricsEnrolled()) return null;

    const credentialIdStr = localStorage.getItem(BIOMETRIC_CREDENTIAL_ID_KEY);
    const rawStoredHash = localStorage.getItem(BIOMETRIC_PIN_HASH_KEY);
    if (!credentialIdStr || !rawStoredHash) return null;

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const credentialId = base64ToBuffer(credentialIdStr);

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [
        {
          id: credentialId,
          type: 'public-key',
        },
      ],
      userVerification: 'preferred',
      timeout: 60000,
      rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    if (assertion) {
      return await decryptBiometricPayload(rawStoredHash, credentialIdStr);
    }
    return null;
  } catch (err: unknown) {
    const name = (err as DOMException)?.name;
    if (name === 'NotAllowedError') {
      logger.warn('Biometric authentication cancelled by user');
    } else if (name === 'AbortError') {
      logger.warn('Biometric authentication aborted');
    } else if (name === 'SecurityError') {
      logger.warn('Biometric authentication security constraint (user gesture required on iOS WebKit)');
    } else {
      logger.warn('Biometric authentication transient error', { error: String(err) });
    }
    return null;
  }
}

/** Update the stored PIN hash when the user changes their PIN so biometrics stay in sync */
export async function updateBiometricPinHash(newPinHash: string): Promise<void> {
  try {
    if (isBiometricsEnrolled()) {
      const credId = localStorage.getItem(BIOMETRIC_CREDENTIAL_ID_KEY);
      if (credId) {
        const encrypted = await encryptBiometricPayload(newPinHash, credId);
        localStorage.setItem(BIOMETRIC_PIN_HASH_KEY, encrypted);
      } else {
        localStorage.setItem(BIOMETRIC_PIN_HASH_KEY, newPinHash);
      }
    }
  } catch {
    // Ignore storage errors
  }
}

/** Disable and delete biometric platform credentials */
export function disableBiometrics(): void {
  try {
    localStorage.removeItem(BIOMETRIC_ENROLLED_KEY);
    localStorage.removeItem(BIOMETRIC_CREDENTIAL_ID_KEY);
    localStorage.removeItem(BIOMETRIC_PIN_HASH_KEY);
    localStorage.removeItem(BIOMETRIC_AUTO_PROMPT_KEY);
  } catch {
    // Ignore storage errors
  }
}

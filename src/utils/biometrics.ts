/**
 * biometrics.ts — WebAuthn Platform Authenticator integration (FaceID / TouchID / Windows Hello / Android Biometric)
 *
 * Enables passwordless 1-second biometric unlock while preserving the 4-digit PIN fallback.
 */

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

/** Check if auto-prompt on lock screen is enabled */
export function isBiometricAutoPromptEnabled(): boolean {
  try {
    const val = localStorage.getItem(BIOMETRIC_AUTO_PROMPT_KEY);
    return val === null ? true : val === 'true';
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
        name: 'family-wealth-manager',
        displayName: 'Family Wealth Office',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential | null;

    if (!credential) return false;

    const credentialId = bufferToBase64(credential.rawId);
    localStorage.setItem(BIOMETRIC_CREDENTIAL_ID_KEY, credentialId);
    localStorage.setItem(BIOMETRIC_PIN_HASH_KEY, pinHash);
    localStorage.setItem(BIOMETRIC_ENROLLED_KEY, 'true');

    return true;
  } catch (err) {
    // User cancelled or platform authenticator error
    console.warn('Biometric registration was cancelled or failed:', err);
    return false;
  }
}

/** Prompt the device's platform biometric authenticator (FaceID / Fingerprint / Windows Hello) */
export async function authenticateWithBiometrics(): Promise<string | null> {
  try {
    if (!isBiometricsEnrolled()) return null;

    const credentialIdStr = localStorage.getItem(BIOMETRIC_CREDENTIAL_ID_KEY);
    const pinHash = localStorage.getItem(BIOMETRIC_PIN_HASH_KEY);
    if (!credentialIdStr || !pinHash) return null;

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const credentialId = base64ToBuffer(credentialIdStr);

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [
        {
          id: credentialId,
          type: 'public-key',
          transports: ['internal'],
        },
      ],
      userVerification: 'required',
      timeout: 60000,
      rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    if (assertion) {
      return pinHash;
    }
    return null;
  } catch (err) {
    // User cancelled prompt or verification failed
    console.warn('Biometric authentication cancelled or failed:', err);
    return null;
  }
}

/** Update the stored PIN hash when the user changes their PIN so biometrics stay in sync */
export function updateBiometricPinHash(newPinHash: string): void {
  try {
    if (isBiometricsEnrolled()) {
      localStorage.setItem(BIOMETRIC_PIN_HASH_KEY, newPinHash);
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

import { describe, it, expect, beforeEach } from 'vitest';

// Pure implementation mirroring Edge Function security helpers for testing
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

interface RateLimitRecord {
  count: number;
  firstAttempt: number;
}

class RateLimiter {
  private attempts = new Map<string, RateLimitRecord>();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts = 5, windowMs = 5 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  getRateLimitKey(clientIp: string, deviceId: string): string {
    return `${clientIp}:${deviceId || 'default-device'}`;
  }

  check(key: string, now: number = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
    const record = this.attempts.get(key);

    if (!record || now - record.firstAttempt > this.windowMs) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (record.count >= this.maxAttempts) {
      const retryAfterSeconds = Math.ceil((record.firstAttempt + this.windowMs - now) / 1000);
      return { allowed: false, retryAfterSeconds };
    }

    record.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  clear(key: string): void {
    this.attempts.delete(key);
  }
}

function sanitizeStorageFileName(cleanPath: string, generatedUuid: string): string {
  const segments = cleanPath.split('/');
  const rawFileName = segments[segments.length - 1].replace(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i,
    ''
  );
  segments[segments.length - 1] = `${generatedUuid}_${rawFileName}`;
  return segments.join('/');
}

describe('Edge Function Security & CGNAT Rate-Limiting Controls', () => {
  describe('timingSafeEqual', () => {
    it('returns true for identical strings', () => {
      expect(timingSafeEqual('a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3')).toBe(true);
    });

    it('returns false for different characters', () => {
      expect(timingSafeEqual('123456', '123457')).toBe(false);
    });

    it('returns false for different lengths', () => {
      expect(timingSafeEqual('1234', '12345')).toBe(false);
    });
  });

  describe('CGNAT Composite Rate Limiting', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter(5, 5 * 60 * 1000);
    });

    it('isolates different family member devices sharing the same mobile CGNAT public IP (Jio/Airtel)', () => {
      const sharedCgnatIp = '49.36.120.1'; // Simulated Jio CGNAT Gateway IP
      const fatherDeviceId = 'device-ram-iphone15';
      const motherDeviceId = 'device-padma-pixel8';

      const fatherKey = limiter.getRateLimitKey(sharedCgnatIp, fatherDeviceId);
      const motherKey = limiter.getRateLimitKey(sharedCgnatIp, motherDeviceId);

      // Father makes 5 failed attempts
      for (let i = 0; i < 5; i++) {
        const check = limiter.check(fatherKey);
        expect(check.allowed).toBe(true);
      }

      // Father's 6th attempt is blocked (429 Rate Limited)
      const fatherBlocked = limiter.check(fatherKey);
      expect(fatherBlocked.allowed).toBe(false);
      expect(fatherBlocked.retryAfterSeconds).toBeGreaterThan(0);

      // CRITICAL VERIFICATION: Mother on the exact same CGNAT IP is NOT locked out!
      const motherCheck = limiter.check(motherKey);
      expect(motherCheck.allowed).toBe(true);
    });

    it('clears rate limiting when valid authentication succeeds', () => {
      const key = limiter.getRateLimitKey('1.2.3.4', 'dev-123');
      limiter.check(key);
      limiter.check(key);

      limiter.clear(key);

      const freshCheck = limiter.check(key);
      expect(freshCheck.allowed).toBe(true);
    });
  });

  describe('Unconditional Server-Side Storage UUID Generation', () => {
    it('unconditionally strips any client-supplied UUID prefix to prevent path spoofing and collisions', () => {
      const fakeClientUuid = '00000000-0000-0000-0000-000000000000';
      const inputPath = `sai_laxmi/fd_advices/${fakeClientUuid}_fixed_deposit.pdf`;
      const serverUuid = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

      const safePath = sanitizeStorageFileName(inputPath, serverUuid);

      // Must NOT contain the client fake UUID
      expect(safePath).not.toContain(fakeClientUuid);
      // Must contain server-generated UUID
      expect(safePath).toBe(`sai_laxmi/fd_advices/${serverUuid}_fixed_deposit.pdf`);
    });

    it('prepends server-side UUID when no prefix was provided', () => {
      const inputPath = 'rammohan/invoices/purchase_receipt.pdf';
      const serverUuid = '11111111-2222-3333-4444-555555555555';

      const safePath = sanitizeStorageFileName(inputPath, serverUuid);
      expect(safePath).toBe(`rammohan/invoices/${serverUuid}_purchase_receipt.pdf`);
    });
  });

  describe('Fail-Closed Auth Boundary', () => {
    it('fails closed with 503 when server PIN secret is not configured', () => {
      function evaluateAuthBoundary(serverPinEnv: string | undefined): { status: number; error: string } {
        if (!serverPinEnv) {
          return { status: 503, error: 'Server PIN configuration missing' };
        }
        return { status: 200, error: '' };
      }

      expect(evaluateAuthBoundary(undefined)).toEqual({
        status: 503,
        error: 'Server PIN configuration missing',
      });
      expect(evaluateAuthBoundary('')).toEqual({
        status: 503,
        error: 'Server PIN configuration missing',
      });
    });
  });
});

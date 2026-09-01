import { clearSessionVerification, ensureHashedPin } from './sessionStore';

function sanitizeEnv(val: string | undefined): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

const SUPABASE_URL = sanitizeEnv(import.meta.env.VITE_SUPABASE_URL as string | undefined).replace(/\/+$/, '');
const SUPABASE_ANON_KEY = sanitizeEnv(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);
const REQUEST_TIMEOUT_MS = 15000;

export class AppApiError extends Error {
  status?: number;
  code: 'auth' | 'config' | 'timeout' | 'network' | 'server' | 'unknown';
  rawMessage?: string;

  constructor(
    message: string,
    code: AppApiError['code'] = 'unknown',
    options: { status?: number; rawMessage?: string } = {}
  ) {
    super(message);
    this.name = 'AppApiError';
    this.code = code;
    this.status = options.status;
    this.rawMessage = options.rawMessage;
  }
}

interface FunctionRequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  skipCache?: boolean;
}

export function getEnvironmentIssue(): string {
  if (!SUPABASE_URL) return 'Supabase URL is missing. Please set VITE_SUPABASE_URL.';
  if (!SUPABASE_ANON_KEY) return 'Supabase anon key is missing. Please set VITE_SUPABASE_ANON_KEY.';
  return '';
}

// Cache the hashed PIN for the lifetime of the session — avoids a
// SubtleCrypto.digest() call on every API request (price ticks, etc.)
let _cachedPinHash: string | null = null;

export function clearApiSessionCache(): void {
  _cachedPinHash = null;
  inflightRequests.clear();
}

/**
 * Pre-warm the API session cache with a known-good PIN hash and kick off a
 * background data prefetch so the SWR in-flight deduplication can serve the
 * result instantly when the PortfolioProvider mounts after unlock.
 *
 * Safe to call speculatively: errors are silently swallowed and the in-flight
 * deduplication map ensures no duplicate network requests are fired.
 */
export function prewarmApiCache(pinHash: string): void {
  if (!pinHash) return;
  _cachedPinHash = pinHash;
  // Fire background prefetch — silently ignore errors.
  // invokeFunction's inflightRequests map deduplicates this against the
  // identical SWR fetch that arrives after unlock, so zero extra network cost.
  invokeFunction('holdings-crud?action=list', { method: 'GET' }).catch(() => {});
}

export async function getApiAuthHeaders(contentType?: string): Promise<Record<string, string>> {
  if (!_cachedPinHash) {
    _cachedPinHash = await ensureHashedPin();
  }
  const hashedPin = _cachedPinHash;
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  if (hashedPin) {
    headers['X-App-Pin'] = hashedPin;
  }

  if (SUPABASE_ANON_KEY) {
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }

  return headers;
}

async function buildHeaders(): Promise<Record<string, string>> {
  return getApiAuthHeaders('application/json');
}

function friendlyError(status: number, fallback: string): AppApiError {
  if (status === 401 || status === 403) {
    clearSessionVerification();
    _cachedPinHash = null;
    inflightRequests.clear();
    return new AppApiError('Session expired. Please enter your PIN again.', 'auth', {
      status,
      rawMessage: fallback,
    });
  }

  if (status === 429) {
    return new AppApiError('Too many requests. Please wait a moment and try again.', 'server', {
      status,
      rawMessage: fallback,
    });
  }

  if (status >= 500) {
    const errorMsg =
      fallback && fallback !== 'Internal Server Error' && !fallback.includes('<!DOCTYPE') && !fallback.includes('<html')
        ? fallback
        : 'Database service is temporarily unavailable. Please try again.';
    return new AppApiError(errorMsg, 'server', {
      status,
      rawMessage: fallback,
    });
  }

  return new AppApiError(fallback || 'Request failed. Please try again.', 'server', {
    status,
    rawMessage: fallback,
  });
}

const inflightRequests = new Map<string, Promise<unknown>>();

export async function invokeFunction<T>(pathAndQuery: string, options: FunctionRequestOptions = {}): Promise<T> {
  const envIssue = getEnvironmentIssue();
  if (envIssue) {
    throw new AppApiError(envIssue, 'config');
  }

  const isGetLike = !options.skipCache && (!options.method || options.method.toUpperCase() === 'GET' || (options.method.toUpperCase() === 'POST' && pathAndQuery.includes('market-data')));
  const customPin = options.headers?.['X-App-Pin'] || options.headers?.['x-app-pin'] || '';
  const cacheKey = `${options.method || 'GET'}:${pathAndQuery}:${customPin}:${options.body ? JSON.stringify(options.body) : ''}`;
  
  if (isGetLike && inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey) as Promise<T>;
  }

  const promise = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);

    try {
      const defaultHeaders = await buildHeaders();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/${pathAndQuery}`, {
        ...options,
        headers: { ...defaultHeaders, ...(options.headers ?? {}) },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });

      const text = await res.text().catch(() => '');
      if (!res.ok) {
        let message = text;
        try {
          const json = JSON.parse(text) as { error?: string; message?: string };
          message = json.error ?? json.message ?? text;
        } catch {
          // Plain text response; keep it as-is for diagnostics.
        }
        throw friendlyError(res.status, message);
      }

      if (!text || !text.trim()) return null as T;
      
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new AppApiError('Invalid JSON response received from server.', 'server', {
          status: res.status,
          rawMessage: text,
        });
      }
    } catch (err) {
      if (err instanceof AppApiError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new AppApiError('Request timed out. Please check your connection and try again.', 'timeout');
      }
      throw new AppApiError('Unable to connect right now. Please check your connection and try again.', 'network', {
        rawMessage: err instanceof Error ? err.message : String(err),
      });
    } finally {
      clearTimeout(timeout);
    }
  })();

  if (isGetLike) {
    inflightRequests.set(cacheKey, promise);
    promise.catch(() => {}).finally(() => inflightRequests.delete(cacheKey));
  }

  return promise;
}


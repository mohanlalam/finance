import { clearSessionVerification, ensureHashedPin } from './auth';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';
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

interface FunctionRequestOptions extends Omit<RequestInit, 'headers' | 'body'> {
  body?: unknown;
  timeoutMs?: number;
}

export function getEnvironmentIssue(): string {
  if (!SUPABASE_URL) return 'Supabase URL is missing. Please set VITE_SUPABASE_URL.';
  if (!SUPABASE_ANON_KEY) return 'Supabase anon key is missing. Please set VITE_SUPABASE_ANON_KEY.';
  return '';
}

async function buildHeaders(): Promise<Record<string, string>> {
  const hashedPin = await ensureHashedPin();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
  };

  if (hashedPin) {
    headers['X-App-Pin'] = hashedPin;
  }

  if (SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }

  return headers;
}

function friendlyError(status: number, fallback: string): AppApiError {
  if (status === 401) {
    clearSessionVerification();
    return new AppApiError('Session expired. Please enter your PIN again.', 'auth', {
      status,
      rawMessage: fallback,
    });
  }

  if (status >= 500) {
    return new AppApiError('Database service is temporarily unavailable. Please try again.', 'server', {
      status,
      rawMessage: fallback,
    });
  }

  return new AppApiError(fallback || 'Request failed. Please try again.', 'server', {
    status,
    rawMessage: fallback,
  });
}

export async function invokeFunction<T>(pathAndQuery: string, options: FunctionRequestOptions = {}): Promise<T> {
  const envIssue = getEnvironmentIssue();
  if (envIssue) {
    throw new AppApiError(envIssue, 'config');
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${pathAndQuery}`, {
      ...options,
      headers: await buildHeaders(),
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

    if (!text) return null as T;
    return JSON.parse(text) as T;
  } catch (err) {
    if (err instanceof AppApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new AppApiError('Request timed out. Please check your connection and try again.', 'timeout');
    }
    throw new AppApiError('Unable to connect right now. Please check your connection and try again.', 'network', {
      rawMessage: err instanceof Error ? err.message : String(err),
    });
  } finally {
    window.clearTimeout(timeout);
  }
}


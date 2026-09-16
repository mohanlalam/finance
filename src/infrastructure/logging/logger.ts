/**
 * Lightweight Logger Infrastructure
 * Enforces structured logging and redacts sensitive data (PIN, passwords, tokens, API keys).
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEY_PATTERNS = [
  /pin/i,
  /password/i,
  /secret/i,
  /token/i,
  /apikey/i,
  /api_key/i,
  /authorization/i,
  /bearer/i,
  /account/i,
  /account_no/i,
  /account_number/i,
  /policy/i,
  /policy_no/i,
  /policy_number/i,
  /folio/i,
];

function sanitizeValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY_PATTERNS.some((p) => p.test(key))) {
    return '[REDACTED]';
  }
  if (Array.isArray(value)) {
    return value.map((item, idx) => sanitizeValue(String(idx), item));
  }
  if (value && typeof value === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      sanitizedObj[k] = sanitizeValue(k, v);
    }
    return sanitizedObj;
  }
  return value;
}

function sanitizeError(error: unknown): unknown {
  if (!error) return error;
  if (error instanceof Error) {
    const sanitizedObj: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
    for (const [k, v] of Object.entries(error)) {
      sanitizedObj[k] = sanitizeValue(k, v);
    }
    return sanitizeValue('error', sanitizedObj);
  }
  if (typeof error === 'object') {
    return sanitizeValue('error', error);
  }
  return error;
}

class Logger {
  private level: LogLevel = import.meta.env?.MODE === 'development' ? 'debug' : 'warn';

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.level];
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      const sanitized = context ? sanitizeValue('context', context) : undefined;
      console.debug(`[DEBUG] ${message}`, sanitized || '');
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      const sanitized = context ? sanitizeValue('context', context) : undefined;
      console.info(`[INFO] ${message}`, sanitized || '');
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      const sanitized = context ? sanitizeValue('context', context) : undefined;
      console.warn(`[WARN] ${message}`, sanitized || '');
    }
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      const sanitizedError = error !== undefined ? sanitizeError(error) : undefined;
      const sanitizedContext = context ? sanitizeValue('context', context) : undefined;
      console.error(`[ERROR] ${message}`, sanitizedError !== undefined ? sanitizedError : '', sanitizedContext || '');
    }
  }
}

export const logger = new Logger();

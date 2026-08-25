/**
 * Standardized Application Error Classes
 * Provides structured error types and mapping for user-friendly notifications.
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export class AppError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly userMessage: string;
  public readonly cause?: unknown;

  constructor(
    message: string,
    options?: {
      code?: string;
      severity?: ErrorSeverity;
      userMessage?: string;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = 'AppError';
    this.code = options?.code || 'UNKNOWN_ERROR';
    this.severity = options?.severity || 'error';
    this.userMessage = options?.userMessage || 'An unexpected error occurred. Please try again.';
    this.cause = options?.cause;

    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  public readonly fieldErrors?: Record<string, string>;

  constructor(message: string, fieldErrors?: Record<string, string>, userMessage?: string) {
    super(message, {
      code: 'VALIDATION_ERROR',
      severity: 'warning',
      userMessage: userMessage || message,
    });
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class RepositoryError extends AppError {
  constructor(message: string, cause?: unknown, userMessage?: string) {
    super(message, {
      code: 'REPOSITORY_ERROR',
      severity: 'error',
      userMessage: userMessage || 'Unable to load or save data. Please check your connection.',
      cause,
    });
    this.name = 'RepositoryError';
  }
}

export class SyncError extends AppError {
  constructor(message: string, cause?: unknown, userMessage?: string) {
    super(message, {
      code: 'SYNC_ERROR',
      severity: 'warning',
      userMessage: userMessage || 'Data synchronization encountered an issue.',
      cause,
    });
    this.name = 'SyncError';
  }
}

export class MarketDataError extends AppError {
  public readonly symbol?: string;

  constructor(message: string, symbol?: string, cause?: unknown) {
    super(message, {
      code: 'MARKET_DATA_ERROR',
      severity: 'warning',
      userMessage: `Unable to fetch live quote${symbol ? ` for ${symbol}` : ''}. Using cached rates.`,
      cause,
    });
    this.name = 'MarketDataError';
    this.symbol = symbol;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(message, {
      code: 'AUTH_ERROR',
      severity: 'error',
      userMessage: userMessage || 'Authentication failed. Please verify your PIN.',
    });
    this.name = 'AuthenticationError';
  }
}

/**
 * Converts any unknown thrown error into a user-friendly display message.
 */
export function toUserErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred. Please try again.';
}

import { describe, it, expect, vi } from 'vitest';
import { logger } from '../logger';

describe('Logger Infrastructure', () => {
  it('redacts sensitive keys including PIN, passwords, and tokens', () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.setLevel('info');
    logger.info('Test log', {
      userPin: '1234',
      api_key: 'secret-123',
      accountNumber: 'SB-987654321',
      policy_no: 'POL-112233',
      safeData: 'visible',
    });

    expect(consoleSpy).toHaveBeenCalled();
    const loggedContext = consoleSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(loggedContext.userPin).toBe('[REDACTED]');
    expect(loggedContext.api_key).toBe('[REDACTED]');
    expect(loggedContext.accountNumber).toBe('[REDACTED]');
    expect(loggedContext.policy_no).toBe('[REDACTED]');
    expect(loggedContext.safeData).toBe('visible');
    consoleSpy.mockRestore();
  });

  it('redacts sensitive data within nested arrays', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.setLevel('warn');
    logger.warn('Array log', {
      holdings: [
        { folio: 'FOLIO-123', units: 100 },
        { account: 'ACC-456', balance: 5000 },
      ],
    });

    expect(consoleSpy).toHaveBeenCalled();
    const loggedContext = consoleSpy.mock.calls[0][1] as Record<string, unknown>;
    const holdings = loggedContext.holdings as Array<Record<string, unknown>>;
    expect(holdings[0].folio).toBe('[REDACTED]');
    expect(holdings[0].units).toBe(100);
    expect(holdings[1].account).toBe('[REDACTED]');
    expect(holdings[1].balance).toBe(5000);
    consoleSpy.mockRestore();
  });
});

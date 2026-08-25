import { describe, it, expect } from 'vitest';
import { validateBackupJson } from '../portfolio/backup/backupValidator';

describe('Backup Validation', () => {
  it('validates a valid backup envelope successfully', () => {
    const validJson = JSON.stringify({
      version: '2.0.0',
      schemaVersion: '2.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        portfolios: [
          {
            id: 'p1',
            name: 'padmavathi',
            label: 'Padmavathi',
            holdings: [],
            fixedDeposits: [],
            rdAccounts: [],
            sipAccounts: [],
            goldHoldings: [],
            realEstate: [],
            insurances: [],
            documents: [],
          },
        ],
      },
    });

    const result = validateBackupJson(validJson);
    expect(result.isValid).toBe(true);
    expect(result.portfolioCount).toBe(1);
    expect(result.errors.length).toBe(0);
  });

  it('rejects invalid JSON syntax', () => {
    expect(() => validateBackupJson('{invalid json')).toThrow();
  });

  it('rejects empty portfolio backups', () => {
    const emptyJson = JSON.stringify({ data: { portfolios: [] } });
    const result = validateBackupJson(emptyJson);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

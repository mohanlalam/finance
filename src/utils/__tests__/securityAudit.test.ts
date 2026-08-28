// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { hashPin } from '../auth';
import { generateDocumentStoragePath } from '../supabaseStorage';
import { validateBackupJSON } from '../../domains/portfolio/backup/backupValidator';

describe('Security & Access Control Audit Suite', () => {
  describe('Cryptographic PIN Hashing', () => {
    it('produces standard 64-character SHA-256 hex digest', async () => {
      const pin = '3463';
      const hash = await hashPin(pin);
      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);

      // Deterministic check
      const hash2 = await hashPin(pin);
      expect(hash).toBe(hash2);
    });

    it('produces distinct hashes for distinct inputs', async () => {
      const hashA = await hashPin('1234');
      const hashB = await hashPin('1235');
      expect(hashA).not.toBe(hashB);
    });
  });

  describe('Storage Path Traversal Protection', () => {
    it('sanitizes malicious path traversal sequences in document filenames', () => {
      const maliciousName = '../../../../etc/passwd.pdf';
      const safePath = generateDocumentStoragePath('default', 'general', maliciousName);
      
      expect(safePath).not.toContain('..');
      expect(safePath).not.toContain('/etc/');
      expect(safePath.startsWith('default/general/')).toBe(true);
    });

    it('generates random UUID prefixes to prevent file enumeration', () => {
      const path1 = generateDocumentStoragePath('default', 'fd', 'statement.pdf');
      const path2 = generateDocumentStoragePath('default', 'fd', 'statement.pdf');
      
      expect(path1).not.toBe(path2);
    });
  });

  describe('Backup Schema Envelope Security', () => {
    it('rejects tampered or malformed backup JSON payloads', () => {
      const maliciousPayload = {
        version: '1.0',
        exportedAt: '2026-08-28T00:00:00Z',
        data: {
          portfolios: 'not-an-array',
        },
      };

      const result = validateBackupJSON(JSON.stringify(maliciousPayload));
      expect(result.isValid).toBe(false);
      expect(result.schemaErrors.length).toBeGreaterThan(0);
    });

    it('validates authentic backup envelopes with integrity', () => {
      const validPayload = {
        version: '2.0',
        app: 'Family Portfolio Tracker',
        exportedAt: '2026-08-28T10:00:00.000Z',
        data: {
          portfolios: [
            {
              id: 'p1',
              name: 'default',
              label: 'Family Portfolio',
              holdings: [],
              fixedDeposits: [],
              goldHoldings: [],
              realEstate: [],
              insurances: [],
              rdAccounts: [],
              sipAccounts: [],
              documents: [],
            },
          ],
          netWorthHistory: [],
        },
      };

      const result = validateBackupJSON(JSON.stringify(validPayload));
      expect(result.isValid).toBe(true);
      expect(result.schemaErrors).toHaveLength(0);
    });
  });
});

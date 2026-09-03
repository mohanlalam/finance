import { describe, it, expect } from 'vitest';
import {
  extractEvidenceAnchor,
  buildEvidenceHeatmap,
} from '../smart-import/services/evidenceHeatmapService';

describe('evidenceHeatmapService', () => {
  const sampleRawText = `
HDFC BANK LIMITED
Fixed Deposit Advice
Customer Name: Padmavathi Lalam
Principal Deposit: Rs 5,00,000.00
Interest Rate: 7.10% p.a.
Maturity Date: 14/10/2028
Maturity Amount: Rs 6,85,420.00
`;

  it('extracts source snippet and verifies interest rate in raw document text', () => {
    const anchor = extractEvidenceAnchor(
      'interestRate',
      'Interest Rate (% p.a.)',
      {
        value: 7.1,
        confidence: 0.85,
        status: 'verified',
      },
      sampleRawText
    );

    expect(anchor.isVerifiedInSource).toBe(true);
    expect(anchor.confidence).toBeGreaterThanOrEqual(0.92);
    expect(anchor.confidenceTier).toBe('high');
    expect(anchor.snippet).toContain('Interest Rate: 7.10% p.a.');
    expect(anchor.boundingBox[0]).toBeGreaterThan(0);
  });

  it('builds a full heatmap of critical financial numbers', () => {
    const fields = {
      principalAmount: { value: 500000, confidence: 0.95, status: 'verified' as const },
      interestRate: { value: 7.1, confidence: 0.90, status: 'verified' as const },
      maturityDate: { value: '2028-10-14', confidence: 0.88, status: 'verified' as const },
      hallmark: { value: '916', confidence: 0.70, status: 'needs_review' as const },
    };

    const heatmap = buildEvidenceHeatmap(fields, sampleRawText);

    expect(heatmap.principalAmount).toBeDefined();
    expect(heatmap.principalAmount.isVerifiedInSource).toBe(true);
    expect(heatmap.interestRate.isVerifiedInSource).toBe(true);
    expect(heatmap.hallmark.confidenceTier).toBe('medium');
  });
});

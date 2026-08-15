// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getGeminiApiKey, setStoredGeminiApiKey, fileToBase64, extractAssetFromDocument } from '../aiDocumentExtractor';

describe('aiDocumentExtractor', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('stores and retrieves custom Gemini API key', () => {
    setStoredGeminiApiKey('AIzaSyCustomKey123');
    expect(getGeminiApiKey()).toBe('AIzaSyCustomKey123');
    setStoredGeminiApiKey('');
  });

  it('converts a File object to base64 string', async () => {
    const blob = new Blob(['hello world'], { type: 'text/plain' });
    const file = new File([blob], 'test.txt', { type: 'text/plain' });
    const base64 = await fileToBase64(file);
    expect(typeof base64).toBe('string');
    expect(base64.length).toBeGreaterThan(0);
  });

  it('throws error if API key is missing', async () => {
    const file = new File(['dummy'], 'sample.pdf', { type: 'application/pdf' });
    await expect(extractAssetFromDocument(file, '')).rejects.toThrow(/Gemini API key is required/);
  });

  it('successfully extracts structured asset data from valid Gemini response', async () => {
    const mockJsonResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  assetType: 'fd',
                  confidence: 0.98,
                  title: 'HDFC Bank Term Deposit',
                  data: {
                    bankName: 'HDFC Bank',
                    principalAmount: 250000,
                    interestRate: 7.25,
                    startDate: '2024-05-01',
                    maturityDate: '2025-05-01',
                    maturityAmount: 268600,
                  },
                }),
              },
            ],
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockJsonResponse,
    } as unknown as Response);

    const file = new File(['dummy content'], 'fd_cert.pdf', { type: 'application/pdf' });
    const result = await extractAssetFromDocument(file, 'mock_key');

    expect(result.assetType).toBe('fd');
    expect(result.confidence).toBe(0.98);
    expect(result.data.bankName).toBe('HDFC Bank');
    expect(result.data.principalAmount).toBe(250000);
    expect(result.data.interestRate).toBe(7.25);
  });
});

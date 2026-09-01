// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getGeminiApiKey,
  setStoredGeminiApiKey,
  fileToBase64,
  extractAssetFromDocument,
  getModelPreferenceScore,
  fetchAvailableGeminiModels,
  clearDiscoveredModelsCache,
  normalizeToIsoDate,
  parseCleanNumber,
  normalizeExtractedResult,
} from '../aiDocumentExtractor';

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
    setStoredGeminiApiKey('test-custom-gemini-key-123');
    expect(getGeminiApiKey()).toBe('test-custom-gemini-key-123');
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

    globalThis.fetch = vi.fn().mockResolvedValue({
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

  it('successfully extracts gold and insurance data types', async () => {
    const mockGoldResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  assetType: 'gold',
                  confidence: 0.95,
                  title: 'Tanishq 24K Gold Bar',
                  data: {
                    itemName: '24K Gold Bar',
                    purity: '24K',
                    weightGrams: 20,
                    purchasePrice: 145000,
                  },
                }),
              },
            ],
          },
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGoldResponse,
    } as unknown as Response);

    const file = new File(['gold receipt'], 'gold_receipt.jpg', { type: 'image/jpeg' });
    const result = await extractAssetFromDocument(file, 'mock_key');

    expect(result.assetType).toBe('gold');
    expect(result.confidence).toBe(0.95);
    expect(result.data.itemName).toBe('24K Gold Bar');
    expect(result.data.weightGrams).toBe(20);
    expect(result.data.purchasePrice).toBe(145000);
  });

  it('falls back to next model when the first model returns 404', async () => {
    const mockSuccessResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  assetType: 'fd',
                  confidence: 0.9,
                  title: 'Fallback FD',
                  data: {
                    bankName: 'ICICI Bank',
                    principalAmount: 100000,
                  },
                }),
              },
            ],
          },
        },
      ],
    };

    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: false,
          status: 404,
          json: async () => ({
            error: {
              message: 'models/gemini-2.0-flash is not found for API version v1beta',
            },
          }),
        } as unknown as Response;
      }
      return {
        ok: true,
        json: async () => mockSuccessResponse,
      } as unknown as Response;
    });

    const file = new File(['sample'], 'doc.pdf', { type: 'application/pdf' });
    const result = await extractAssetFromDocument(file, 'mock_key');

    expect(callCount).toBe(2);
    expect(result.assetType).toBe('fd');
    expect(result.data.bankName).toBe('ICICI Bank');
  });

  it('throws immediately on invalid API key', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          message: 'API_KEY_INVALID: API key not valid. Please pass a valid API key.',
        },
      }),
    } as unknown as Response);

    const file = new File(['sample'], 'doc.png', { type: 'image/png' });
    await expect(extractAssetFromDocument(file, 'bad_key')).rejects.toThrow(/Invalid Gemini API Key/);
  });

  it('correctly scores model preference (flash > pro, 3.5 > 1.5)', () => {
    const score35Flash = getModelPreferenceScore('gemini-3.5-flash');
    const score35FlashLite = getModelPreferenceScore('gemini-3.5-flash-lite');
    const score25Flash = getModelPreferenceScore('gemini-2.5-flash');
    const score15Flash = getModelPreferenceScore('gemini-1.5-flash');
    const scoreEmbedding = getModelPreferenceScore('text-embedding-004');

    expect(score35FlashLite).toBeGreaterThan(score35Flash); // lite + flash
    expect(score35Flash).toBeGreaterThan(score25Flash);
    expect(score25Flash).toBeGreaterThan(score15Flash);
    expect(score15Flash).toBeGreaterThan(scoreEmbedding);
  });

  it('dynamically queries Gemini models API and ranks models', async () => {
    clearDiscoveredModelsCache();
    const mockModelsResponse = {
      models: [
        { name: 'models/gemini-1.5-pro', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-3.5-flash-lite', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] },
        { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockModelsResponse,
    } as unknown as Response);

    const models = await fetchAvailableGeminiModels('test_key');
    expect(models).toContain('gemini-3.5-flash-lite');
    expect(models).toContain('gemini-2.5-flash');
    expect(models).toContain('gemini-1.5-pro');
    expect(models).not.toContain('text-embedding-004');
    expect(models[0]).toBe('gemini-3.5-flash-lite');
  });

  it('successfully extracts data when Gemini wraps response in markdown code fences', async () => {
    const rawMarkdownJson = '```json\n{"assetType":"insurance","confidence":0.99,"title":"LIC Policy","data":{"policyName":"LIC Jeevan Labh","provider":"LIC","sumAssured":500000}}\n```';
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: rawMarkdownJson }] } }],
      }),
    } as unknown as Response);

    const file = new File(['lic doc'], 'lic.jpg', { type: 'image/jpeg' });
    const result = await extractAssetFromDocument(file, 'mock_key');
    expect(result.assetType).toBe('insurance');
    expect(result.data.policyName).toBe('LIC Jeevan Labh');
    expect(result.data.sumAssured).toBe(500000);
  });

  describe('normalizeToIsoDate', () => {
    it('converts Indian DD/MM/YYYY dates to ISO YYYY-MM-DD', () => {
      expect(normalizeToIsoDate('17/10/2026')).toBe('2026-10-17');
      expect(normalizeToIsoDate('05/01/2025')).toBe('2025-01-05');
      expect(normalizeToIsoDate('17-10-2026')).toBe('2026-10-17');
    });

    it('handles already ISO dates', () => {
      expect(normalizeToIsoDate('2026-10-17')).toBe('2026-10-17');
      expect(normalizeToIsoDate('2026/10/17')).toBe('2026-10-17');
    });

    it('returns empty string for null or empty input', () => {
      expect(normalizeToIsoDate('')).toBe('');
      expect(normalizeToIsoDate(null)).toBe('');
      expect(normalizeToIsoDate(undefined)).toBe('');
    });
  });

  describe('parseCleanNumber', () => {
    it('cleans currency symbols, commas and decimals', () => {
      expect(parseCleanNumber('₹ 1,13,045.00')).toBe(113045);
      expect(parseCleanNumber('₹ 25,00,000')).toBe(2500000);
      expect(parseCleanNumber('1,00,000')).toBe(100000);
      expect(parseCleanNumber(2500000)).toBe(2500000);
    });

    it('returns undefined for invalid inputs', () => {
      expect(parseCleanNumber(undefined)).toBeUndefined();
      expect(parseCleanNumber(null)).toBeUndefined();
      expect(parseCleanNumber('')).toBeUndefined();
      expect(parseCleanNumber('N/A')).toBeUndefined();
    });
  });

  describe('normalizeExtractedResult for LIC policy documents', () => {
    it('accurately normalizes LIC Jeevan Labh status report with synonyms', () => {
      const rawLICPayload = {
        assetType: 'insurance',
        confidence: 0.98,
        title: "LIC's Jeevan Labh",
        data: {
          insurer: 'Life Insurance Corporation of India',
          planName: "LIC's Jeevan Labh",
          policyNo: '619453640',
          sumAssured: '₹ 25,00,000',
          instalmentPremium: '₹ 1,13,045.00',
          premiumDueFrom: '17/10/2026',
          commencementDate: '17/10/2019',
          dateOfMaturity: '17/10/2044',
          nomineeName: 'L KONDA BABU',
          nomineeRelation: 'FATHER',
          policyTerm: 25,
          premiumPayingTerm: 16,
          bonus: '₹ 705000.0',
        },
      };

      const result = normalizeExtractedResult(rawLICPayload);

      expect(result.assetType).toBe('insurance');
      expect(result.data.provider).toBe('Life Insurance Corporation of India');
      expect(result.data.policyName).toBe("LIC's Jeevan Labh");
      expect(result.data.policyNumber).toBe('619453640');
      expect(result.data.sumAssured).toBe(2500000);
      expect(result.data.premiumAmount).toBe(113045);
      expect(result.data.renewalDate).toBe('2026-10-17');
      expect(result.data.insuranceType).toBe('life');
      expect(result.data.notes).toContain('Nominee: L KONDA BABU (FATHER)');
      expect(result.data.notes).toContain('Policy Term: 25 yrs');
      expect(result.data.notes).toContain('PPT: 16 yrs');
    });
  });
});

/**
 * AI Document & Receipt Extraction Utility using Google Gemini API (Free Tier)
 * Supports PDF documents, receipts, invoices, and photos on mobile and web.
 */

export interface ExtractedAssetResult {
  assetType: 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'stocks';
  confidence: number;
  title: string;
  data: {
    // FD / RD
    bankName?: string;
    principalAmount?: number;
    monthlyDeposit?: number;
    interestRate?: number;
    startDate?: string;
    maturityDate?: string;
    maturityAmount?: number;

    // Gold
    itemName?: string;
    purity?: string;
    weightGrams?: number;
    purchasePrice?: number;
    currentValuation?: number;
    purchaseDate?: string;

    // Real Estate
    propertyName?: string;
    propertyType?: 'apartment' | 'villa' | 'plot' | 'commercial' | 'agricultural' | 'other';
    location?: string;

    // Insurance
    policyName?: string;
    insuranceType?: 'life' | 'term' | 'health' | 'motor' | 'home' | 'travel' | 'other';
    provider?: string;
    policyNumber?: string;
    sumAssured?: number;
    premiumAmount?: number;
    renewalDate?: string;

    // Stocks / SIP
    stockName?: string;
    ticker?: string;
    fundName?: string;
    qty?: number;
    avgPrice?: number;
    units?: number;
    monthlySip?: number;
    expectedCagr?: number;
    notes?: string;
  };
}

const GEMINI_STORAGE_KEY = 'finance_gemini_api_key';

export function getGeminiApiKey(): string {
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? '';
  if (envKey.trim()) return envKey.trim();
  try {
    return localStorage.getItem(GEMINI_STORAGE_KEY)?.trim() || '';
  } catch {
    return '';
  }
}

export function setStoredGeminiApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(GEMINI_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota or security errors
  }
}

/** Converts a File object to base64 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data:mime/type;base64, prefix
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

const EXTRACTION_SYSTEM_PROMPT = `
You are an expert Indian financial document extraction assistant. 
Analyze the provided document image or text (which may be a Fixed Deposit Certificate, Recurring Deposit statement, Gold Jewellery Invoice/Receipt, Insurance Policy Document, Mutual Fund/SIP Statement, Stock Contract Note, or Property Sale Deed).

Identify the financial asset type and extract all relevant structured parameters into clean JSON.
The "assetType" must be one of: "fd", "rd", "sip", "gold", "real_estate", "insurance", "stocks".

Rules:
1. All dates must be in standard ISO "YYYY-MM-DD" format.
2. All financial amounts (Principal, Buy Price, Valuation, Premium, Sum Assured) must be numbers in INR without commas.
3. For Gold: Extract purity (e.g. "24K", "22K", "18K"), weight in grams, and total price paid.
4. For Fixed Deposit (FD): Extract bank name, principal amount, interest rate percentage (e.g. 7.1), start date, maturity date, and maturity amount.
5. For Insurance: Extract policy name, insurance type ("life" | "term" | "health" | "motor" | "home" | "travel"), insurer name, policy number, sum assured, premium, and next renewal date.
6. Provide a confidence rating between 0.0 and 1.0.

Respond ONLY with valid, minified JSON matching this exact structure:
{
  "assetType": "fd",
  "confidence": 0.95,
  "title": "SBI Term Deposit",
  "data": {
    "bankName": "State Bank of India",
    "principalAmount": 100000,
    "interestRate": 7.1,
    "startDate": "2024-01-15",
    "maturityDate": "2025-01-15",
    "maturityAmount": 107293,
    "notes": "Extracted from SBI FD Receipt"
  }
}
`;

export async function extractAssetFromDocument(
  file: File,
  apiKeyOverride?: string
): Promise<ExtractedAssetResult> {
  const apiKey = apiKeyOverride?.trim() || getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'Gemini API key is required for AI Smart Import. Get a 100% free key from Google AI Studio (aistudio.google.com).'
    );
  }

  const base64Data = await fileToBase64(file);
  const mimeType = file.type || 'image/jpeg';

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: EXTRACTION_SYSTEM_PROMPT },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      temperature: 0.1,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody?.error?.message || `Gemini API returned HTTP status ${response.status}`;
    if (response.status === 400 || response.status === 403) {
      throw new Error(`Invalid Gemini API Key or permissions issue: ${message}`);
    }
    throw new Error(`AI Extraction failed: ${message}`);
  }

  const result = await response.json();
  const rawText =
    result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (!rawText) {
    throw new Error('AI could not extract text from this document. Please try a clearer photo or file.');
  }

  try {
    const parsed = JSON.parse(rawText) as ExtractedAssetResult;
    if (!parsed.assetType || !parsed.data) {
      throw new Error('Incomplete data parsed from document.');
    }
    return parsed;
  } catch {
    throw new Error('Failed to parse AI extraction output. Please verify the document is legible.');
  }
}

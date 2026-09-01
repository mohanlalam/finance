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

const GEMINI_LOCAL_KEY = 'finance_gemini_api_key';
const GEMINI_SESSION_KEY = 'finance_gemini_api_key_session';

export function getGeminiApiKey(): string {
  try {
    const local = localStorage.getItem(GEMINI_LOCAL_KEY)?.trim();
    if (local) return local;
    const session = sessionStorage.getItem(GEMINI_SESSION_KEY)?.trim();
    if (session) return session;
    const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
    if (envKey) return envKey;
  } catch {
    // Ignore storage quota or security errors
  }
  return '';
}

export function setStoredGeminiApiKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(GEMINI_LOCAL_KEY, trimmed);
      sessionStorage.setItem(GEMINI_SESSION_KEY, trimmed);
    } else {
      localStorage.removeItem(GEMINI_LOCAL_KEY);
      sessionStorage.removeItem(GEMINI_SESSION_KEY);
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

/** Converts various Indian and International date formats (DD/MM/YYYY, DD-MM-YYYY, DD MMM YYYY, etc.) to standard ISO YYYY-MM-DD */
export function normalizeToIsoDate(rawDate?: string | null): string {
  if (!rawDate || typeof rawDate !== 'string') return '';
  const trimmed = rawDate.trim();
  if (!trimmed) return '';

  // Already standard ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) {
    return trimmed.replace(/\//g, '-');
  }

  // DD/MM/YYYY or DD-MM-YYYY (e.g. 17/10/2026 or 17-10-2026)
  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // DD/MM/YY or DD-MM-YY (e.g. 17/10/26)
  const dmyShortMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/);
  if (dmyShortMatch) {
    const day = dmyShortMatch[1].padStart(2, '0');
    const month = dmyShortMatch[2].padStart(2, '0');
    const shortYear = parseInt(dmyShortMatch[3], 10);
    const fullYear = shortYear > 50 ? 1900 + shortYear : 2000 + shortYear;
    return `${fullYear}-${month}-${day}`;
  }

  // Textual date parsing (e.g. "17 Oct 2026" or "October 17, 2026")
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

/** Cleans currency symbols, commas, spaces and returns clean float number */
export function parseCleanNumber(val: unknown): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'number') return isNaN(val) ? undefined : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[₹$,\s]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  }
  return undefined;
}

const EXTRACTION_SYSTEM_PROMPT = `
You are a senior expert Indian financial document extraction assistant.
Analyze the provided document image or text (which may be a Life/Health/Term Insurance Status Report or Policy Document, Fixed Deposit Certificate, Recurring Deposit Statement, Gold Jewellery Receipt/Invoice, Mutual Fund/SIP Statement, Stock Contract Note, or Property Document).

Identify the financial asset type and extract all relevant structured parameters into clean JSON.
The "assetType" must be one of: "insurance", "fd", "rd", "sip", "gold", "real_estate", "stocks".

CRITICAL EXTRACTION RULES:
1. Dates: Convert ALL Indian date formats (DD/MM/YYYY, DD-MM-YYYY, e.g. "17/10/2026") into ISO format "YYYY-MM-DD" (e.g. "2026-10-17").
2. Amounts: Extract financial amounts as clean pure numbers in INR without commas, currency symbols (₹), or strings (e.g. "₹ 1,13,045.00" -> 113045, "₹ 25,00,000" -> 2500000).
3. For Insurance Policies (LIC, HDFC Life, SBI Life, Max Life, ICICI Pru, Star Health, etc.):
   - "provider": Name of insurance company (e.g. "Life Insurance Corporation of India (LIC)", "HDFC Life", "Star Health Insurance"). Look at the header, logo, or footer.
   - "policyName": Name of the insurance plan (e.g. "LIC's Jeevan Labh", "HDFC Click 2 Protect").
   - "insuranceType": One of "life" (Endowment/Money-back/ULIP), "term" (Pure Term Life), "health" (Mediclaim), "motor", or "other".
   - "policyNumber": The unique policy number (e.g. "619453640").
   - "sumAssured": Total sum assured/coverage in INR (e.g. 2500000).
   - "premiumAmount": Annual or instalment premium amount in INR (e.g. 113045). Look for "Instalment Premium", "Amount Due", or "Premium Amount".
   - "renewalDate": Next premium due date / renewal date in "YYYY-MM-DD" (e.g. "Premium due from: 17/10/2026" -> "2026-10-17").
   - "notes": Extra details such as Nominee, Policy Term, Premium Paying Term, Maturity Date, Guaranteed Additions (e.g. "Nominee: L KONDA BABU (Father 100%) | Maturity: 2044-10-17 | Policy Term: 25 yrs | PPT: 16 yrs").
4. For Fixed Deposits (FD):
   - "bankName": Bank/Institution name (e.g. "State Bank of India", "HDFC Bank").
   - "principalAmount": Principal deposited in INR.
   - "interestRate": Annual interest rate percentage (e.g. 7.1).
   - "startDate": Start/commencement date in "YYYY-MM-DD".
   - "maturityDate": Maturity date in "YYYY-MM-DD".
   - "maturityAmount": Total maturity value in INR.
5. For Gold & Jewellery:
   - "itemName": Description (e.g. "24K Gold Bar", "22K Gold Necklace").
   - "purity": "24K", "22K", "18K", or "14K".
   - "weightGrams": Net weight in grams (e.g. 15.5).
   - "purchasePrice": Total invoice price in INR.
   - "purchaseDate": Invoice date in "YYYY-MM-DD".

Respond ONLY with valid, minified JSON matching this schema:
{
  "assetType": "insurance",
  "confidence": 0.98,
  "title": "LIC Jeevan Labh Policy",
  "data": {
    "provider": "Life Insurance Corporation of India (LIC)",
    "policyName": "LIC's Jeevan Labh",
    "insuranceType": "life",
    "policyNumber": "619453640",
    "sumAssured": 2500000,
    "premiumAmount": 113045,
    "renewalDate": "2026-10-17",
    "notes": "Nominee: L KONDA BABU (Father 100%) | Maturity: 2044-10-17 | Policy Term: 25 yrs | PPT: 16 yrs"
  }
}
`;

export const STATIC_FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
];

interface GeminiModelItem {
  name: string;
  supportedGenerationMethods?: string[];
  displayName?: string;
}

let discoveredModelsCache: { apiKey: string; models: string[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function clearDiscoveredModelsCache(): void {
  discoveredModelsCache = null;
}

export function getModelPreferenceScore(modelName: string): number {
  const name = modelName.toLowerCase();
  let score = 0;

  // Prefer fast/multimodal flash & lite models for document extraction
  if (name.includes('flash')) score += 100;
  if (name.includes('lite')) score += 10;

  // Prefer newer versions
  if (name.includes('3.5')) score += 50;
  else if (name.includes('3.0') || name.includes('3-')) score += 40;
  else if (name.includes('2.5')) score += 30;
  else if (name.includes('2.0') || name.includes('2-')) score += 20;
  else if (name.includes('1.5')) score += 10;

  // Deprioritize non-general / embedding / audio-only models
  if (name.includes('embedding') || name.includes('aqa') || name.includes('imagen') || name.includes('tts')) {
    score -= 1000;
  }

  return score;
}

export async function fetchAvailableGeminiModels(apiKey: string): Promise<string[]> {
  if (
    discoveredModelsCache &&
    discoveredModelsCache.apiKey === apiKey &&
    Date.now() - discoveredModelsCache.timestamp < CACHE_TTL_MS &&
    discoveredModelsCache.models.length > 0
  ) {
    return discoveredModelsCache.models;
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (res.ok) {
      const data = (await res.json()) as { models?: GeminiModelItem[] };
      if (Array.isArray(data.models) && data.models.length > 0) {
        const validModels = data.models
          .filter(
            (m) =>
              !m.supportedGenerationMethods ||
              m.supportedGenerationMethods.includes('generateContent')
          )
          .map((m) => m.name.replace(/^models\//, ''));

        const ranked = validModels.sort((a, b) => getModelPreferenceScore(b) - getModelPreferenceScore(a));

        if (ranked.length > 0) {
          discoveredModelsCache = {
            apiKey,
            models: ranked,
            timestamp: Date.now(),
          };
          return ranked;
        }
      }
    }
  } catch {
    // If dynamic discovery fails, use static fallback
  }

  return STATIC_FALLBACK_MODELS;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeExtractedResult(raw: any): ExtractedAssetResult {
  const assetType: ExtractedAssetResult['assetType'] = [
    'fd', 'rd', 'sip', 'gold', 'real_estate', 'insurance', 'stocks'
  ].includes(String(raw.assetType || raw.asset_type || '').toLowerCase())
    ? (String(raw.assetType || raw.asset_type).toLowerCase() as ExtractedAssetResult['assetType'])
    : 'fd';

  const rawData = raw.data || raw;
  const data: ExtractedAssetResult['data'] = {};

  // Bank & Provider normalizations
  const provider = rawData.provider || rawData.insurer || rawData.insurerName || rawData.insuranceProvider || rawData.insuranceCompany || rawData.company || rawData.institution;
  if (provider) {
    data.provider = String(provider).trim();
  } else if (assetType === 'insurance') {
    const combined = `${raw.title || ''} ${rawData.policyName || ''} ${rawData.planName || ''}`.toLowerCase();
    if (combined.includes('lic') || combined.includes('life insurance corporation') || combined.includes('jeevan')) {
      data.provider = 'Life Insurance Corporation of India (LIC)';
    }
  }

  const bankName = rawData.bankName || rawData.bank || rawData.bank_name || rawData.institution || rawData.branchName;
  if (bankName) data.bankName = String(bankName).trim();

  // Policy & Holding names
  const policyName = rawData.policyName || rawData.planName || rawData.policy_name || rawData.plan_name || rawData.schemeName || raw.title;
  if (policyName) data.policyName = String(policyName).trim();

  const policyNumber = rawData.policyNumber || rawData.policyNo || rawData.policy_number || rawData.policy_no || rawData.accountNumber;
  if (policyNumber) data.policyNumber = String(policyNumber).trim();

  // Insurance type normalization
  const insType = String(rawData.insuranceType || rawData.insurance_type || rawData.policyType || rawData.type || '').toLowerCase();
  if (insType) {
    if (insType.includes('term')) data.insuranceType = 'term';
    else if (insType.includes('health') || insType.includes('mediclaim')) data.insuranceType = 'health';
    else if (insType.includes('life') || insType.includes('endowment') || insType.includes('ulip') || insType.includes('jeevan')) data.insuranceType = 'life';
    else if (insType.includes('motor') || insType.includes('car') || insType.includes('bike') || insType.includes('vehicle')) data.insuranceType = 'motor';
    else data.insuranceType = 'other';
  } else if (assetType === 'insurance') {
    const combined = `${data.policyName || ''} ${data.provider || ''}`.toLowerCase();
    if (combined.includes('jeevan') || combined.includes('lic') || combined.includes('endowment') || combined.includes('ulip')) {
      data.insuranceType = 'life';
    }
  }

  // Insurance amounts & dates
  const sumAssured = parseCleanNumber(rawData.sumAssured ?? rawData.sum_assured ?? rawData.sumInsured ?? rawData.coverageAmount ?? rawData.lifeCover);
  if (sumAssured !== undefined) data.sumAssured = sumAssured;

  const premium = parseCleanNumber(
    rawData.premiumAmount ?? rawData.premium_amount ?? rawData.premium ?? rawData.instalmentPremium ?? rawData.installmentPremium ?? rawData.annualPremium ?? rawData.amountDue ?? rawData.amount_due
  );
  if (premium !== undefined) data.premiumAmount = premium;

  const renewalDate = normalizeToIsoDate(rawData.renewalDate || rawData.renewal_date || rawData.nextRenewalDate || rawData.next_renewal_date || rawData.premiumDueDate || rawData.premiumDueFrom || rawData.premium_due_from || rawData.dueDate);
  if (renewalDate) data.renewalDate = renewalDate;

  // FD & RD amounts & dates
  const principal = parseCleanNumber(rawData.principalAmount ?? rawData.principal_amount ?? rawData.principal ?? rawData.depositAmount ?? rawData.amount);
  if (principal !== undefined) data.principalAmount = principal;

  const monthlyDeposit = parseCleanNumber(rawData.monthlyDeposit ?? rawData.monthly_deposit ?? rawData.monthlyInstallment ?? rawData.installmentAmount);
  if (monthlyDeposit !== undefined) data.monthlyDeposit = monthlyDeposit;

  const interestRate = parseCleanNumber(rawData.interestRate ?? rawData.interest_rate ?? rawData.rate ?? rawData.roi ?? rawData.interest);
  if (interestRate !== undefined) data.interestRate = interestRate;

  const maturityAmount = parseCleanNumber(rawData.maturityAmount ?? rawData.maturity_amount ?? rawData.maturityValue ?? rawData.maturity_value);
  if (maturityAmount !== undefined) data.maturityAmount = maturityAmount;

  const startDate = normalizeToIsoDate(rawData.startDate || rawData.start_date || rawData.commencementDate || rawData.commencement_date || rawData.issueDate || rawData.openDate);
  if (startDate) data.startDate = startDate;

  const maturityDate = normalizeToIsoDate(rawData.maturityDate || rawData.maturity_date || rawData.dateOfMaturity || rawData.date_of_maturity || rawData.expiryDate);
  if (maturityDate) data.maturityDate = maturityDate;

  // Gold fields
  const itemName = rawData.itemName || rawData.item_name || rawData.item || rawData.description || rawData.jewelleryType;
  if (itemName) data.itemName = String(itemName).trim();

  const purity = rawData.purity || rawData.karat || rawData.goldPurity;
  if (purity) data.purity = String(purity).trim();

  const weight = parseCleanNumber(rawData.weightGrams ?? rawData.weight_grams ?? rawData.weightInGrams ?? rawData.weight ?? rawData.grams ?? rawData.netWeight);
  if (weight !== undefined) data.weightGrams = weight;

  const purchasePrice = parseCleanNumber(rawData.purchasePrice ?? rawData.purchase_price ?? rawData.totalAmount ?? rawData.invoiceAmount ?? rawData.price);
  if (purchasePrice !== undefined) data.purchasePrice = purchasePrice;

  const purchaseDate = normalizeToIsoDate(rawData.purchaseDate || rawData.purchase_date || rawData.invoiceDate || rawData.date);
  if (purchaseDate) data.purchaseDate = purchaseDate;

  // Real Estate fields
  const propertyName = rawData.propertyName || rawData.property_name || rawData.property || raw.title;
  if (propertyName) data.propertyName = String(propertyName).trim();
  const location = rawData.location || rawData.address || rawData.city;
  if (location) data.location = String(location).trim();
  const propType = String(rawData.propertyType || rawData.property_type || '').toLowerCase();
  if (propType) {
    if (propType.includes('villa') || propType.includes('house')) data.propertyType = 'villa';
    else if (propType.includes('plot') || propType.includes('land')) data.propertyType = 'plot';
    else if (propType.includes('commercial')) data.propertyType = 'commercial';
    else data.propertyType = 'apartment';
  }

  // Mutual Fund / Stocks fields
  const fundName = rawData.fundName || rawData.fund_name || rawData.schemeName || rawData.scheme;
  if (fundName) data.fundName = String(fundName).trim();

  const stockName = rawData.stockName || rawData.stock_name || rawData.companyName || rawData.securityName;
  if (stockName) data.stockName = String(stockName).trim();

  const ticker = rawData.ticker || rawData.symbol;
  if (ticker) data.ticker = String(ticker).trim();

  const qty = parseCleanNumber(rawData.qty ?? rawData.quantity ?? rawData.units ?? rawData.shares);
  if (qty !== undefined) data.qty = qty;

  const avgPrice = parseCleanNumber(rawData.avgPrice ?? rawData.avg_price ?? rawData.buyPrice ?? rawData.nav);
  if (avgPrice !== undefined) data.avgPrice = avgPrice;

  const monthlySip = parseCleanNumber(rawData.monthlySip ?? rawData.monthly_sip ?? rawData.sipAmount);
  if (monthlySip !== undefined) data.monthlySip = monthlySip;

  // Notes & extra details synthesis
  const notesList: string[] = [];
  if (rawData.notes) notesList.push(String(rawData.notes));
  if (rawData.nominee || rawData.nomineeName) {
    const nom = rawData.nominee || rawData.nomineeName;
    const rel = rawData.nomineeRelation || rawData.relation ? ` (${rawData.nomineeRelation || rawData.relation})` : '';
    notesList.push(`Nominee: ${nom}${rel}`);
  }
  if (rawData.policyTerm || rawData.policy_term) {
    notesList.push(`Policy Term: ${rawData.policyTerm || rawData.policy_term} yrs`);
  }
  if (rawData.premiumPayingTerm || rawData.premium_paying_term) {
    notesList.push(`PPT: ${rawData.premiumPayingTerm || rawData.premium_paying_term} yrs`);
  }
  if (rawData.bonus || rawData.guaranteedAddition) {
    notesList.push(`Bonus/Addition: ${rawData.bonus || rawData.guaranteedAddition}`);
  }
  if (notesList.length > 0) {
    data.notes = notesList.join(' | ');
  }

  // Bounds clamping
  if (data.principalAmount !== undefined) data.principalAmount = Math.max(0, Math.min(data.principalAmount, 100_000_000));
  if (data.monthlyDeposit !== undefined) data.monthlyDeposit = Math.max(0, Math.min(data.monthlyDeposit, 10_000_000));
  if (data.interestRate !== undefined) data.interestRate = Math.max(0, Math.min(data.interestRate, 50));
  if (data.maturityAmount !== undefined) data.maturityAmount = Math.max(0, Math.min(data.maturityAmount, 200_000_000));
  if (data.weightGrams !== undefined) data.weightGrams = Math.max(0, Math.min(data.weightGrams, 50_000));
  if (data.purchasePrice !== undefined) data.purchasePrice = Math.max(0, Math.min(data.purchasePrice, 1_000_000_000));
  if (data.currentValuation !== undefined) data.currentValuation = Math.max(0, Math.min(data.currentValuation, 1_000_000_000));
  if (data.sumAssured !== undefined) data.sumAssured = Math.max(0, Math.min(data.sumAssured, 500_000_000));
  if (data.premiumAmount !== undefined) data.premiumAmount = Math.max(0, Math.min(data.premiumAmount, 10_000_000));
  if (data.qty !== undefined) data.qty = Math.max(0, Math.min(data.qty, 10_000_000));
  if (data.avgPrice !== undefined) data.avgPrice = Math.max(0, Math.min(data.avgPrice, 100_000_000));
  if (data.monthlySip !== undefined) data.monthlySip = Math.max(0, Math.min(data.monthlySip, 10_000_000));
  if (data.expectedCagr !== undefined) data.expectedCagr = Math.max(0, Math.min(data.expectedCagr, 100));

  const confidence = typeof raw.confidence === 'number' ? Math.max(0, Math.min(raw.confidence, 1)) : 0.95;
  const title = raw.title || data.policyName || data.bankName || data.itemName || data.fundName || data.stockName || 'Imported Asset';

  return {
    assetType,
    confidence,
    title,
    data,
  };
}

export async function extractAssetFromDocument(
  file: File,
  apiKeyOverride?: string
): Promise<ExtractedAssetResult> {
  const apiKey = apiKeyOverride !== undefined ? apiKeyOverride.trim() : getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'Gemini API key is required for AI Smart Import. Get a 100% free key from Google AI Studio (aistudio.google.com).'
    );
  }

  const base64Data = await fileToBase64(file);
  const mimeType = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

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

  const candidateModels = await fetchAvailableGeminiModels(apiKey);
  let lastError: Error | null = null;
  let rawText = '';

  for (const model of candidateModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (rawText) {
          lastError = null;
          break;
        }
      } else {
        const errorBody = await response.json().catch(() => ({}));
        const message =
          errorBody?.error?.message || `Gemini API returned HTTP status ${response.status}`;

        if (
          response.status === 400 &&
          (message.toLowerCase().includes('api_key_invalid') || message.toLowerCase().includes('api key not valid'))
        ) {
          throw new Error(`Invalid Gemini API Key: ${message}`);
        }
        if (response.status === 403) {
          throw new Error(`Invalid Gemini API Key or permissions issue: ${message}`);
        }

        lastError = new Error(`AI Extraction failed (${model}): ${message}`);
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.message.includes('Invalid Gemini API Key') || err.message.includes('permissions issue'))
      ) {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  if (!rawText) {
    if (lastError) throw lastError;
    throw new Error('AI could not extract text from this document. Please try a clearer photo or file.');
  }

  try {
    let cleanJson = rawText.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    const rawParsed = JSON.parse(cleanJson);
    return normalizeExtractedResult(rawParsed);
  } catch {
    throw new Error('Failed to parse AI extraction output. Please verify the document is legible.');
  }
}

import { FinancialIntent } from '../types';

interface IntentRule {
  intent: FinancialIntent;
  patterns: RegExp[];
  confidence: number;
}

const INTENT_RULES: IntentRule[] = [
  {
    intent: 'NET_WORTH',
    patterns: [
      /net\s*worth/i,
      /total\s*wealth/i,
      /portfolio\s*value/i,
      /how\s*much\s*am\s*i\s*worth/i,
      /overall\s*valuation/i,
    ],
    confidence: 0.95,
  },
  {
    intent: 'TAX_HARVESTING',
    patterns: [
      /tax/i,
      /harvest/i,
      /capital\s*gains/i,
      /ltcg/i,
      /stcg/i,
      /loss\s*offset/i,
      /tax\s*saving/i,
    ],
    confidence: 0.95,
  },
  {
    intent: 'PERFORMANCE_XIRR',
    patterns: [
      /xirr/i,
      /cagr/i,
      /returns/i,
      /annualized/i,
      /how\s*is\s*my\s*portfolio\s*performing/i,
      /performance/i,
    ],
    confidence: 0.9,
  },
  {
    intent: 'GOLD_VALUATION',
    patterns: [/gold/i, /bullion/i, /24k/i, /22k/i, /hallmark/i, /tola/i],
    confidence: 0.95,
  },
  {
    intent: 'MATURITY_SCHEDULE',
    patterns: [/maturity/i, /fd\s*due/i, /deposit\s*matur/i, /upcoming\s*matur/i],
    confidence: 0.9,
  },
  {
    intent: 'INSURANCE_RENEWAL',
    patterns: [/insurance/i, /policy/i, /premium/i, /renewal/i, /sum\s*assured/i],
    confidence: 0.9,
  },
  {
    intent: 'ALLOCATION',
    patterns: [/allocation/i, /breakdown/i, /pie\s*chart/i, /asset\s*class/i, /distribution/i],
    confidence: 0.9,
  },
  {
    intent: 'TOP_GAINERS',
    patterns: [/best\s*stock/i, /top\s*gainer/i, /most\s*profit/i, /highest\s*return/i],
    confidence: 0.9,
  },
  {
    intent: 'TOP_LOSERS',
    patterns: [/worst\s*stock/i, /top\s*loser/i, /most\s*loss/i, /down/i],
    confidence: 0.9,
  },
  {
    intent: 'DATA_QUALITY',
    patterns: [/health/i, /data\s*quality/i, /missing/i, /audit/i, /clean\s*up/i],
    confidence: 0.9,
  },
  {
    intent: 'HELP',
    patterns: [/help/i, /what\s*can\s*you\s*do/i, /commands/i, /features/i],
    confidence: 0.9,
  },
];

export function classifyIntent(query: string): { intent: FinancialIntent; confidence: number } {
  const clean = (query || '').trim();
  if (!clean) {
    return { intent: 'HELP', confidence: 1.0 };
  }

  for (const rule of INTENT_RULES) {
    if (rule.patterns.some((p) => p.test(clean))) {
      return { intent: rule.intent, confidence: rule.confidence };
    }
  }

  return { intent: 'UNKNOWN', confidence: 0.5 };
}

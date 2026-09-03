/**
 * Cross-Asset Entity Disambiguation Service
 *
 * Disambiguates and pre-sorts financial documents into the corresponding family member
 * portfolio (Rammohan, Padmavathi, or Sai Laxmi) using PAN numbers, folio notes,
 * account holder names, and document text heuristics.
 *
 * Zero external dependencies. Pure TypeScript.
 */

import { DisambiguationResult } from '../types';

export interface DisambiguationContext {
  rawText?: string;
  fileName?: string;
  title?: string;
  notes?: string;
  accountNumber?: string;
  panNumber?: string;
}

interface MemberRule {
  canonicalName: string;
  portfolioName: string;
  aliases: string[];
}

const FAMILY_MEMBERS: MemberRule[] = [
  {
    canonicalName: 'Rammohan',
    portfolioName: 'rammohan',
    aliases: ['rammohan', 'ram mohan', 'rammohan lalam', 'lalam rammohan', 'ram mohan lalam', 'ram', 'mohan'],
  },
  {
    canonicalName: 'Padmavathi',
    portfolioName: 'padmavathi',
    aliases: ['padmavathi', 'padma', 'padmavathi lalam', 'lalam padmavathi', 'padmavati'],
  },
  {
    canonicalName: 'Sai Laxmi',
    portfolioName: 'sailaxmi',
    aliases: ['sai laxmi', 'sailaxmi', 'sai lakshmi', 'sailakshmi', 'sai laxmi lalam', 'lalam sai laxmi', 'laxmi', 'lakshmi'],
  },
];

/**
 * Normalizes string for token search
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Inspects document text, file name, and extracted hints to assign a family portfolio
 */
export function disambiguateEntity(
  context: DisambiguationContext,
  availablePortfolios: { name: string; label?: string }[] = [],
  activePortfolioName?: string
): DisambiguationResult {
  const combinedText = [
    context.fileName || '',
    context.title || '',
    context.notes || '',
    context.rawText || '',
    context.accountNumber || '',
  ].join(' ');

  const normalized = normalize(combinedText);

  // 1. Check for PAN card hints
  if (context.panNumber) {
    const cleanPan = context.panNumber.trim().toUpperCase();
    for (const member of FAMILY_MEMBERS) {
      if (cleanPan.includes(member.portfolioName.toUpperCase())) {
        return {
          portfolioName: member.portfolioName,
          memberLabel: member.canonicalName,
          matchType: 'pan',
          confidence: 0.98,
          details: `Matched PAN pattern: ${cleanPan}`,
        };
      }
    }
  }

  // 2. Exact multi-word alias matches (e.g. "sai laxmi", "ram mohan", "padmavathi lalam")
  for (const member of FAMILY_MEMBERS) {
    for (const alias of member.aliases) {
      // Word-boundary check
      const regex = new RegExp(`\\b${alias}\\b`, 'i');
      if (regex.test(normalized)) {
        return {
          portfolioName: member.portfolioName,
          memberLabel: member.canonicalName,
          matchType: 'name',
          confidence: alias.length > 5 ? 0.95 : 0.85,
          details: `Matched holder name: "${member.canonicalName}" (${alias})`,
        };
      }
    }
  }

  // 3. Check portfolio label matches in available portfolios
  for (const p of availablePortfolios) {
    const pLabelNorm = normalize(p.label || p.name);
    for (const member of FAMILY_MEMBERS) {
      if (p.name.toLowerCase() === member.portfolioName || pLabelNorm.includes(member.canonicalName.toLowerCase())) {
        if (normalized.includes(member.portfolioName)) {
          return {
            portfolioName: p.name,
            memberLabel: member.canonicalName,
            matchType: 'folio',
            confidence: 0.80,
            details: `Matched portfolio label hint: "${member.canonicalName}"`,
          };
        }
      }
    }
  }

  // 4. Fallback to active portfolio or default
  const defaultPortfolio = activePortfolioName && activePortfolioName !== 'all'
    ? activePortfolioName
    : (availablePortfolios[0]?.name || 'rammohan');

  const defaultMember = FAMILY_MEMBERS.find((m) => m.portfolioName === defaultPortfolio.toLowerCase()) || FAMILY_MEMBERS[0];

  return {
    portfolioName: defaultPortfolio,
    memberLabel: defaultMember.canonicalName,
    matchType: 'default',
    confidence: 0.50,
    details: `Defaulted to active member "${defaultMember.canonicalName}"`,
  };
}

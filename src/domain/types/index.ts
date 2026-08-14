/**
 * Domain Layer: Core Entities and Financial Value Objects
 * 
 * Clean Architecture Rule:
 * This layer has ZERO dependencies on React, Supabase, UI frameworks, or DOM APIs.
 * It contains the fundamental business entities and financial calculation contracts.
 */

export type AssetCategory =
  | 'EQUITY'
  | 'MUTUAL_FUNDS'
  | 'FIXED_DEPOSIT'
  | 'RECURRING_DEPOSIT'
  | 'GOLD'
  | 'REAL_ESTATE'
  | 'INSURANCE'
  | 'DOCUMENT';

export type CompoundingFrequency = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUALLY';

export interface MonetaryValue {
  amount: number;
  currency: 'INR' | 'USD';
}

export interface ValuationSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  dayChange?: number;
  dayChangePercentage?: number;
}

export interface CashFlowEntry {
  amount: number;
  date: string; // ISO format (YYYY-MM-DD)
}

export interface PortfolioEntity {
  id: string;
  name: string;
  isOwner?: boolean;
  avatarSeed?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AssetHoldingEntity {
  id: string;
  portfolioId: string;
  symbol: string;
  name: string;
  category: AssetCategory;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  investedAmount: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  lastUpdated: string;
}

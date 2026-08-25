import { AssetTab } from '../../types/portfolio';

export type HealthSeverity = 'critical' | 'warning' | 'info';

export interface HealthIssue {
  id: string;
  code?: string;
  category: 'deposit' | 'valuation' | 'document' | 'insurance' | 'sip' | 'market_data' | 'completeness';
  severity: HealthSeverity;
  title: string;
  description: string;
  assetTab: AssetTab;
  portfolioName?: string;
  portfolioLabel?: string;
  assetId?: string;
  actionLabel?: string;
}

export interface PortfolioHealthSummary {
  score: number; // 0 to 100
  totalChecks: number;
  passedChecks: number;
  issues: HealthIssue[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

export interface HealthSnapshot {
  timestamp: string; // ISO date string
  score: number;
  criticalCount: number;
  warningCount: number;
  totalChecks: number;
}

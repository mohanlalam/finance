export type Severity = 'info' | 'warning' | 'critical';

export interface DataQualityIssue {
  code: string;
  severity: Severity;
  entityType: string;
  entityId: string;
  portfolioId?: string;
  portfolioName?: string;
  message: string;
  fixable: boolean;
  actionHint?: string;
}

export interface DataQualityReport {
  score: number; // 0 to 100
  totalAssetsChecked: number;
  issues: DataQualityIssue[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  calculatedAt: string;
}

import { Portfolio } from '../../../types/portfolio';
import { NetWorthSnapshot } from '../calculations/netWorth';

export const CURRENT_BACKUP_SCHEMA_VERSION = '2.0.0';

export interface PortfolioBackupEnvelope {
  version: string;
  schemaVersion: string;
  exportedAt: string;
  appVersion?: string;
  data: {
    portfolios: Portfolio[];
    netWorthHistory?: NetWorthSnapshot[];
  };
}

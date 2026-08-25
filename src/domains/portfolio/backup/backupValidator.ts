import { PortfolioBackupEnvelope } from './backupSchema';
import { ValidationError } from '../../../shared/errors/AppError';

export interface ValidationResult {
  isValid: boolean;
  portfolioCount: number;
  totalAssetsCount: number;
  errors: string[];
  warnings: string[];
}

export function validateBackupJson(jsonString: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new ValidationError('Invalid JSON file format.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new ValidationError('Backup content is empty or invalid.');
  }

  const envelope = parsed as Partial<PortfolioBackupEnvelope>;

  // Handle both envelope and raw array backups
  let portfolios = envelope.data?.portfolios;
  if (!portfolios && Array.isArray(parsed)) {
    portfolios = parsed;
    warnings.push('Legacy backup format detected without envelope metadata.');
  }

  if (!Array.isArray(portfolios) || portfolios.length === 0) {
    errors.push('No valid portfolio records found in backup.');
    return {
      isValid: false,
      portfolioCount: 0,
      totalAssetsCount: 0,
      errors,
      warnings,
    };
  }

  let totalAssetsCount = 0;
  portfolios.forEach((p, idx) => {
    if (!p.name || typeof p.name !== 'string') {
      errors.push(`Portfolio at index ${idx} is missing a valid name.`);
    }
    totalAssetsCount += (p.holdings || []).length;
    totalAssetsCount += (p.fixedDeposits || []).length;
    totalAssetsCount += (p.rdAccounts || []).length;
    totalAssetsCount += (p.sipAccounts || []).length;
    totalAssetsCount += (p.goldHoldings || []).length;
    totalAssetsCount += (p.realEstate || []).length;
    totalAssetsCount += (p.insurances || []).length;
  });

  return {
    isValid: errors.length === 0,
    portfolioCount: portfolios.length,
    totalAssetsCount,
    errors,
    warnings,
  };
}

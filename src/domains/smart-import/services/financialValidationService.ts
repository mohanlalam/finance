import { calculateFDMaturityValue } from '../../assets/fd/calculations/fdCompounding';
import { SmartImportFormData, PurchasePriceType } from '../types';

export interface FinancialValidationResult {
  isValid: boolean;
  warnings: string[];
  autoCorrectedFields: Partial<SmartImportFormData>;
  suggestedMaturityAmount?: number;
  ambiguousPriceType?: {
    detectedValue: number;
    options: {
      type: PurchasePriceType;
      label: string;
      calculatedTotal: number;
      calculatedPerGram: number;
    }[];
  };
}

export function validateAndNormalizeFinancialData(
  assetType: string,
  formData: SmartImportFormData
): FinancialValidationResult {
  const warnings: string[] = [];
  const autoCorrected: Partial<SmartImportFormData> = {};

  if (assetType === 'fd') {
    const principal = parseFloat(formData.principalAmount) || 0;
    const rate = parseFloat(formData.interestRate) || 0;
    const start = formData.startDate;
    const maturity = formData.maturityDate;

    if (principal <= 0) warnings.push('Principal amount is required.');
    if (rate <= 0) warnings.push('Interest rate is required.');

    if (principal > 0 && rate > 0 && start && maturity) {
      const calculatedMaturity = Math.round(calculateFDMaturityValue(principal, rate, start, maturity));
      const extractedMaturity = parseFloat(formData.maturityAmount) || 0;

      if (calculatedMaturity > principal) {
        if (!extractedMaturity || extractedMaturity <= principal) {
          autoCorrected.maturityAmount = String(calculatedMaturity);
        } else {
          // Check if extracted maturity differs significantly (>3%) from calculated compounding
          const diffPct = Math.abs(extractedMaturity - calculatedMaturity) / calculatedMaturity;
          if (diffPct > 0.05) {
            warnings.push(
              `Extracted maturity amount (₹${extractedMaturity.toLocaleString('en-IN')}) differs from computed compound interest (₹${calculatedMaturity.toLocaleString('en-IN')}). Please verify certificate.`
            );
          }
        }
      }
    }
  } else if (assetType === 'rd') {
    const monthly = parseFloat(formData.monthlyDeposit) || 0;
    const installments = parseInt(formData.totalInstallments, 10) || 12;
    const rate = parseFloat(formData.interestRate) || 0;

    if (monthly <= 0) warnings.push('Monthly deposit is required.');
    
    // Auto-calculate approximate maturity with compounding rather than simple 12 * monthly
    if (monthly > 0 && installments > 0 && rate > 0) {
      const totalDeposited = monthly * installments;
      const r = rate / 400; // Quarterly compounding
      const n = installments / 3; // Quarters
      const approxMaturity = Math.round(monthly * ((Math.pow(1 + r, n) - 1) / (1 - Math.pow(1 + r, -1 / 3))));
      
      const extractedMat = parseFloat(formData.maturityAmount) || 0;
      if (!extractedMat || extractedMat <= totalDeposited) {
        autoCorrected.maturityAmount = String(approxMaturity > totalDeposited ? approxMaturity : totalDeposited);
      }
    }
  } else if (assetType === 'gold') {
    const grams = parseFloat(formData.weightGrams) || 0;
    const rawPrice = parseFloat(formData.purchasePrice) || 0;

    if (grams <= 0) {
      warnings.push('Gold weight in grams is required.');
    }

    // Detect price per gram vs total purchase cost ambiguity
    if (grams > 1 && rawPrice > 1000 && rawPrice <= 40000 && (rawPrice / grams) < 500) {
      const perGramTotal = Math.round(rawPrice * grams);
      return {
        isValid: warnings.length === 0,
        warnings,
        autoCorrectedFields: autoCorrected,
        ambiguousPriceType: {
          detectedValue: rawPrice,
          options: [
            {
              type: 'per_gram',
              label: `₹${rawPrice.toLocaleString('en-IN')}/gram (Total: ₹${perGramTotal.toLocaleString('en-IN')})`,
              calculatedTotal: perGramTotal,
              calculatedPerGram: rawPrice,
            },
            {
              type: 'total',
              label: `₹${rawPrice.toLocaleString('en-IN')} Total Cost (Rate: ₹${Math.round(rawPrice / grams).toLocaleString('en-IN')}/g)`,
              calculatedTotal: rawPrice,
              calculatedPerGram: Math.round(rawPrice / grams),
            },
          ],
        },
      };
    }
  } else if (assetType === 'real_estate') {
    const purchase = parseFloat(formData.purchasePriceRealty) || 0;
    const current = parseFloat(formData.currentValuationRealty) || 0;

    if (purchase <= 0 && current <= 0) {
      warnings.push('Property purchase price or current valuation is required.');
    }
    if (purchase > 0 && current <= 0) {
      autoCorrected.currentValuationRealty = String(purchase);
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    autoCorrectedFields: autoCorrected,
  };
}

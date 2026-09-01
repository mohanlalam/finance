import { Portfolio } from '../../../types/portfolio';
import { SmartImportFormData, DuplicateMatch } from '../types';

export function checkForDuplicateAsset(
  assetType: string,
  targetPortfolioName: string,
  formData: SmartImportFormData,
  portfolios: Portfolio[]
): DuplicateMatch | null {
  if (!portfolios || portfolios.length === 0) return null;

  // Search across targeted portfolio first, then all portfolios
  const searchPortfolios = portfolios.filter(
    (p) => targetPortfolioName === 'all' || p.name === targetPortfolioName
  );

  for (const p of searchPortfolios) {
    if (assetType === 'fd') {
      const pAmt = parseFloat(formData.principalAmount) || 0;
      const bank = (formData.institutionName || '').toLowerCase().trim();
      const sDate = formData.startDate;

      const match = p.fixedDeposits.find((fd) => {
        const matchBank = (fd.bank_name || '').toLowerCase().trim();
        const matchAmt = Math.abs((Number(fd.principal_amount) || 0) - pAmt) < 1;
        const matchDate = !sDate || fd.start_date === sDate;
        return matchBank.includes(bank) && matchAmt && matchDate;
      });

      if (match) {
        return {
          existingAssetId: match.id,
          existingAssetName: `${match.bank_name} FD (₹${Number(match.principal_amount).toLocaleString('en-IN')})`,
          portfolioName: p.name,
          assetType: 'fd',
          matchedFields: ['Bank Name', 'Principal Amount', 'Start Date'],
          matchScore: 0.95,
          details: `Existing FD with same principal and start date found in ${p.label || p.name}'s portfolio.`,
        };
      }
    } else if (assetType === 'stocks') {
      const sym = (formData.symbol || '').toUpperCase().trim();

      const match = p.holdings.find(
        (h) => (h.ticker && h.ticker.toUpperCase() === sym) || (h.stockName && h.stockName.toLowerCase().includes(formData.stockName.toLowerCase()))
      );

      if (match) {
        return {
          existingAssetId: match.id,
          existingAssetName: `${match.ticker || match.stockName} (${match.qty} shares)`,
          portfolioName: p.name,
          assetType: 'stocks',
          matchedFields: ['Symbol', 'Holding'],
          matchScore: 0.9,
          details: `You already hold ${match.qty} shares of ${match.ticker || match.stockName} in ${p.label || p.name}'s portfolio.`,
        };
      }
    } else if (assetType === 'insurance') {
      const polNum = (formData.policyNumber || '').toLowerCase().trim();
      if (polNum && polNum.length >= 4) {
        const match = p.insurances.find(
          (ins) => (ins.policy_number || '').toLowerCase().trim() === polNum
        );
        if (match) {
          return {
            existingAssetId: match.id,
            existingAssetName: `${match.policy_name} (#${match.policy_number})`,
            portfolioName: p.name,
            assetType: 'insurance',
            matchedFields: ['Policy Number'],
            matchScore: 0.99,
            details: `A policy with exact number ${formData.policyNumber} already exists in ${p.label || p.name}'s portfolio.`,
          };
        }
      }
    } else if (assetType === 'gold') {
      const g = parseFloat(formData.weightGrams) || 0;
      const name = (formData.itemName || '').toLowerCase().trim();

      const match = p.goldHoldings.find((gh) => {
        const sameWeight = Math.abs((Number(gh.weight_grams) || 0) - g) < 0.05;
        const sameName = (gh.item_name || '').toLowerCase().trim() === name;
        return sameWeight && sameName;
      });

      if (match) {
        return {
          existingAssetId: match.id,
          existingAssetName: `${match.item_name} (${match.weight_grams}g)`,
          portfolioName: p.name,
          assetType: 'gold',
          matchedFields: ['Item Name', 'Weight'],
          matchScore: 0.9,
          details: `Identical gold item (${match.item_name}, ${match.weight_grams}g) found in ${p.label || p.name}'s portfolio.`,
        };
      }
    }
  }

  return null;
}

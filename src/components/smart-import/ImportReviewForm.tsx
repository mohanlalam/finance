import React from 'react';
import { SmartImportFormData, SmartImportExtractionResult, DuplicateMatch } from '../../domains/smart-import/types';
import { ImportConfidenceBadge } from './ImportConfidenceBadge';
import { DuplicateWarningBanner } from './DuplicateWarningBanner';
import { formatINR } from '../../utils/formatters';

interface ImportReviewFormProps {
  assetType: string;
  formData: SmartImportFormData;
  extractedResult: SmartImportExtractionResult | null;
  duplicateMatch: DuplicateMatch | null;
  targetPortfolio: string;
  portfolioOptions: { name: string; label: string }[];
  onFormChange: (updater: (prev: SmartImportFormData) => SmartImportFormData) => void;
  onTargetPortfolioChange: (name: string) => void;
  onDismissDuplicate: () => void;
  liveGoldRate: number;
}

export const ImportReviewForm: React.FC<ImportReviewFormProps> = ({
  assetType,
  formData,
  extractedResult,
  duplicateMatch,
  targetPortfolio,
  portfolioOptions,
  onFormChange,
  onTargetPortfolioChange,
  onDismissDuplicate,
  liveGoldRate,
}) => {
  const fields = extractedResult?.fields || {};

  const handleFieldChange = (key: keyof SmartImportFormData, value: string) => {
    onFormChange((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Duplicate Warning */}
      {duplicateMatch && (
        <DuplicateWarningBanner
          duplicate={duplicateMatch}
          onDismiss={onDismissDuplicate}
        />
      )}

      {/* Target Portfolio Select */}
      {portfolioOptions.length > 1 && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Target Portfolio
          </label>
          <select
            value={targetPortfolio}
            onChange={(e) => onTargetPortfolioChange(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            {portfolioOptions.map((p) => (
              <option key={p.name} value={p.name}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* FD Fields */}
      {assetType === 'fd' && (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Bank / Institution *
              </label>
              <ImportConfidenceBadge confidence={fields.institutionName?.confidence} />
            </div>
            <input
              type="text"
              value={formData.institutionName}
              onChange={(e) => handleFieldChange('institutionName', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
              placeholder="e.g. HDFC Bank, SBI"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Principal Amount (₹) *
                </label>
                <ImportConfidenceBadge confidence={fields.principalAmount?.confidence} />
              </div>
              <input
                type="number"
                value={formData.principalAmount}
                onChange={(e) => handleFieldChange('principalAmount', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Interest Rate (% p.a.) *
                </label>
                <ImportConfidenceBadge confidence={fields.interestRate?.confidence} />
              </div>
              <input
                type="number"
                step="0.01"
                value={formData.interestRate}
                onChange={(e) => handleFieldChange('interestRate', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Start Date *
                </label>
                <ImportConfidenceBadge confidence={fields.startDate?.confidence} />
              </div>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleFieldChange('startDate', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Maturity Date *
                </label>
                <ImportConfidenceBadge confidence={fields.maturityDate?.confidence} />
              </div>
              <input
                type="date"
                value={formData.maturityDate}
                onChange={(e) => handleFieldChange('maturityDate', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Maturity Amount (₹)
              </label>
              <ImportConfidenceBadge confidence={fields.maturityAmount?.confidence} />
            </div>
            <input
              type="number"
              value={formData.maturityAmount}
              onChange={(e) => handleFieldChange('maturityAmount', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
            />
          </div>
        </div>
      )}

      {/* Gold Fields */}
      {assetType === 'gold' && (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Item Description *
              </label>
              <ImportConfidenceBadge confidence={fields.itemName?.confidence} />
            </div>
            <input
              type="text"
              value={formData.itemName}
              onChange={(e) => handleFieldChange('itemName', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
              placeholder="e.g. 22K Gold Bangle"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Purity
              </label>
              <select
                value={formData.purity}
                onChange={(e) => handleFieldChange('purity', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
              >
                <option value="24K">24K (999)</option>
                <option value="22K">22K (916)</option>
                <option value="18K">18K (750)</option>
                <option value="14K">14K (585)</option>
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Weight (grams) *
                </label>
                <ImportConfidenceBadge confidence={fields.weightGrams?.confidence} />
              </div>
              <input
                type="number"
                step="0.01"
                value={formData.weightGrams}
                onChange={(e) => handleFieldChange('weightGrams', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Total Purchase Price (₹)
                </label>
                <ImportConfidenceBadge confidence={fields.purchasePrice?.confidence} />
              </div>
              <input
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => handleFieldChange('purchasePrice', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Live Market Value (₹)
                </label>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                  {formatINR(liveGoldRate)}/g
                </span>
              </div>
              <input
                type="number"
                value={
                  formData.weightGrams && parseFloat(formData.weightGrams) > 0
                    ? Math.round(parseFloat(formData.weightGrams) * liveGoldRate)
                    : ''
                }
                readOnly
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 font-semibold cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      )}

      {/* Real Estate Fields */}
      {assetType === 'real_estate' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Property Name / Title *
            </label>
            <input
              type="text"
              value={formData.propertyName}
              onChange={(e) => handleFieldChange('propertyName', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
              placeholder="e.g. 3BHK Flat, Green Acres Plot"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Purchase Price (₹) *
              </label>
              <input
                type="number"
                value={formData.purchasePriceRealty}
                onChange={(e) => handleFieldChange('purchasePriceRealty', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Current Market Valuation (₹) *
              </label>
              <input
                type="number"
                value={formData.currentValuationRealty}
                onChange={(e) => handleFieldChange('currentValuationRealty', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
                placeholder="e.g. Bangalore East"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Monthly Rent (₹/mo)
              </label>
              <input
                type="number"
                value={formData.monthlyRent}
                onChange={(e) => handleFieldChange('monthlyRent', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Insurance Fields */}
      {assetType === 'insurance' && (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Policy Name / Provider *
              </label>
              <ImportConfidenceBadge confidence={fields.policyName?.confidence} />
            </div>
            <input
              type="text"
              value={formData.policyName}
              onChange={(e) => handleFieldChange('policyName', e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
              placeholder="e.g. LIC Tech Term, HDFC Ergo Health"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Policy Number
                </label>
                <ImportConfidenceBadge confidence={fields.policyNumber?.confidence} />
              </div>
              <input
                type="text"
                value={formData.policyNumber}
                onChange={(e) => handleFieldChange('policyNumber', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Sum Assured (₹) *
                </label>
                <ImportConfidenceBadge confidence={fields.sumAssured?.confidence} />
              </div>
              <input
                type="number"
                value={formData.sumAssured}
                onChange={(e) => handleFieldChange('sumAssured', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Annual Premium (₹) *
                </label>
                <ImportConfidenceBadge confidence={fields.premiumAmount?.confidence} />
              </div>
              <input
                type="number"
                value={formData.premiumAmount}
                onChange={(e) => handleFieldChange('premiumAmount', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Renewal Date *
                </label>
                <ImportConfidenceBadge confidence={fields.renewalDate?.confidence} />
              </div>
              <input
                type="date"
                value={formData.renewalDate}
                onChange={(e) => handleFieldChange('renewalDate', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* Optional Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
          Notes / Remarks
        </label>
        <textarea
          rows={2}
          value={formData.notes}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900"
          placeholder="Optional notes or references"
        />
      </div>
    </div>
  );
};

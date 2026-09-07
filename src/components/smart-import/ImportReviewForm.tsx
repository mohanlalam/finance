import React from 'react';
import { SmartImportFormData, SmartImportExtractionResult, DuplicateMatch } from '../../domains/smart-import/types';
import { ImportConfidenceBadge } from './ImportConfidenceBadge';
import { DuplicateWarningBanner } from './DuplicateWarningBanner';
import { formatINR } from '../../utils/formatters';
import { Sparkles } from '../icons/AppIcons';

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

  const renderConfidenceBadge = (fieldKey: string, label: string) => {
    const f = fields[fieldKey];
    return (
      <ImportConfidenceBadge
        confidence={f?.confidence}
        status={f?.status}
        source={f?.source}
        snippet={f?.snippet}
        boundingBox={f?.boundingBox}
        pageIndex={f?.pageIndex}
        fieldLabel={label}
      />
    );
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
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Target Portfolio
          </label>
          <select
            value={targetPortfolio}
            onChange={(e) => onTargetPortfolioChange(e.target.value)}
            className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
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
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Bank / Institution *
              </label>
              {renderConfidenceBadge('institutionName', 'Bank / Institution')}
            </div>
            <input
              type="text"
              value={formData.institutionName}
              onChange={(e) => handleFieldChange('institutionName', e.target.value)}
              className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
              placeholder="e.g. HDFC Bank, SBI"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Principal Amount (₹) *
                </label>
                {renderConfidenceBadge('principalAmount', 'Principal Amount')}
              </div>
              <input
                type="number"
                value={formData.principalAmount}
                onChange={(e) => handleFieldChange('principalAmount', e.target.value)}
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Interest Rate (% p.a.) *
                </label>
                {renderConfidenceBadge('interestRate', 'Interest Rate (% p.a.)')}
              </div>
              <input
                type="number"
                step="0.01"
                value={formData.interestRate}
                onChange={(e) => handleFieldChange('interestRate', e.target.value)}
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Start Date *
                </label>
                {renderConfidenceBadge('startDate', 'Start Date')}
              </div>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleFieldChange('startDate', e.target.value)}
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Maturity Date *
                </label>
                {renderConfidenceBadge('maturityDate', 'Maturity Date')}
              </div>
              <input
                type="date"
                value={formData.maturityDate}
                onChange={(e) => handleFieldChange('maturityDate', e.target.value)}
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Maturity Amount (₹)
              </label>
              {renderConfidenceBadge('maturityAmount', 'Maturity Amount')}
            </div>
            <input
              type="number"
              value={formData.maturityAmount}
              onChange={(e) => handleFieldChange('maturityAmount', e.target.value)}
              className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
            />
          </div>
        </div>
      )}

      {/* Gold Fields */}
      {assetType === 'gold' && (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Item Description *
              </label>
              {renderConfidenceBadge('itemName', 'Item Description')}
            </div>
            <input
              type="text"
              value={formData.itemName}
              onChange={(e) => handleFieldChange('itemName', e.target.value)}
              className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
              placeholder="e.g. 22K Gold Bangle"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Purity
              </label>
              <select
                value={formData.purity}
                onChange={(e) => handleFieldChange('purity', e.target.value)}
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
              >
                <option value="24K">24K (999)</option>
                <option value="22K">22K (916)</option>
                <option value="18K">18K (750)</option>
                <option value="14K">14K (585)</option>
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Weight (grams) *
                </label>
                {renderConfidenceBadge('weightGrams', 'Weight (grams)')}
              </div>
              <input
                type="number"
                step="0.01"
                value={formData.weightGrams}
                onChange={(e) => handleFieldChange('weightGrams', e.target.value)}
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Total Purchase Price (₹)
                </label>
                {renderConfidenceBadge('purchasePrice', 'Purchase Price')}
              </div>
              <input
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => handleFieldChange('purchasePrice', e.target.value)}
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Live Market Value (₹)
                </label>
                <span className="text-[10px] text-[var(--warning)] font-bold">
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
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface-secondary)] font-semibold cursor-not-allowed"
              />
            </div>
          </div>

          {/* One-Tap Ambiguity Quick Selector */}
          {formData.weightGrams && parseFloat(formData.weightGrams) > 1 && formData.purchasePrice && parseFloat(formData.purchasePrice) > 1000 && parseFloat(formData.purchasePrice) <= 40000 && (
            <div className="rounded-[var(--radius-medium)] border border-[var(--warning)]/30 bg-[var(--warning-soft)] p-3 space-y-2 animate-fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--warning)]">
                <Sparkles size={14} />
                <span>Price Ambiguity Detected for ₹{parseFloat(formData.purchasePrice).toLocaleString('en-IN')}</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Is ₹{parseFloat(formData.purchasePrice).toLocaleString('en-IN')} the price per gram, or the total purchase cost?
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const g = parseFloat(formData.weightGrams) || 1;
                    const rate = parseFloat(formData.purchasePrice) || 0;
                    const total = Math.round(rate * g);
                    onFormChange((prev) => ({
                      ...prev,
                      purchasePrice: String(total),
                      purchasePriceType: 'per_gram',
                    }));
                  }}
                  className={`px-2.5 py-1.5 rounded-[var(--radius-small)] text-xs font-semibold border transition-all text-left cursor-pointer ${
                    formData.purchasePriceType === 'per_gram'
                      ? 'bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-sm'
                      : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:bg-[var(--surface-secondary)]'
                  }`}
                >
                  <div className="font-bold">🔘 ₹{parseFloat(formData.purchasePrice).toLocaleString('en-IN')}/g Rate</div>
                  <div className="text-[10px] opacity-80">
                    Total: ₹{Math.round((parseFloat(formData.purchasePrice) || 0) * (parseFloat(formData.weightGrams) || 1)).toLocaleString('en-IN')}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onFormChange((prev) => ({
                      ...prev,
                      purchasePriceType: 'total',
                    }));
                  }}
                  className={`px-2.5 py-1.5 rounded-[var(--radius-small)] text-xs font-semibold border transition-all text-left cursor-pointer ${
                    formData.purchasePriceType === 'total'
                      ? 'bg-[var(--accent-blue)] text-white border-[var(--accent-blue)] shadow-sm'
                      : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:bg-[var(--surface-secondary)]'
                  }`}
                >
                  <div className="font-bold">🔘 ₹{parseFloat(formData.purchasePrice).toLocaleString('en-IN')} Total Cost</div>
                  <div className="text-[10px] opacity-80">
                    Rate: ₹{Math.round((parseFloat(formData.purchasePrice) || 0) / (parseFloat(formData.weightGrams) || 1)).toLocaleString('en-IN')}/g
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real Estate Fields */}
      {assetType === 'real_estate' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Property Name / Title *
            </label>
            <input
              type="text"
              value={formData.propertyName}
              onChange={(e) => handleFieldChange('propertyName', e.target.value)}
              className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
              placeholder="e.g. 3BHK Flat, Green Acres Plot"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Purchase Price (₹) *
              </label>
              <input
                type="number"
                value={formData.purchasePriceRealty}
                onChange={(e) => handleFieldChange('purchasePriceRealty', e.target.value)}
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Current Market Valuation (₹) *
              </label>
              <input
                type="number"
                value={formData.currentValuationRealty}
                onChange={(e) => handleFieldChange('currentValuationRealty', e.target.value)}
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
                placeholder="e.g. Bangalore East"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Monthly Rent (₹/mo)
              </label>
              <input
                type="number"
                value={formData.monthlyRent}
                onChange={(e) => handleFieldChange('monthlyRent', e.target.value)}
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
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
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Policy Name / Provider *
              </label>
              {renderConfidenceBadge('policyName', 'Policy Name / Provider')}
            </div>
            <input
              type="text"
              value={formData.policyName}
              onChange={(e) => handleFieldChange('policyName', e.target.value)}
              className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
              placeholder="e.g. LIC Tech Term, HDFC Ergo Health"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Policy Number
                </label>
                {renderConfidenceBadge('policyNumber', 'Policy Number')}
              </div>
              <input
                type="text"
                value={formData.policyNumber}
                onChange={(e) => handleFieldChange('policyNumber', e.target.value)}
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Sum Assured (₹) *
                </label>
                {renderConfidenceBadge('sumAssured', 'Sum Assured')}
              </div>
              <input
                type="number"
                value={formData.sumAssured}
                onChange={(e) => handleFieldChange('sumAssured', e.target.value)}
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Annual Premium (₹) *
                </label>
                {renderConfidenceBadge('premiumAmount', 'Annual Premium')}
              </div>
              <input
                type="number"
                value={formData.premiumAmount}
                onChange={(e) => handleFieldChange('premiumAmount', e.target.value)}
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Renewal Date *
                </label>
                {renderConfidenceBadge('renewalDate', 'Renewal Date')}
              </div>
              <input
                type="date"
                value={formData.renewalDate}
                onChange={(e) => handleFieldChange('renewalDate', e.target.value)}
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Optional Notes */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
          Notes / Remarks
        </label>
        <textarea
          rows={2}
          value={formData.notes}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-colors"
          placeholder="Optional notes or references"
        />
      </div>
    </div>
  );
};

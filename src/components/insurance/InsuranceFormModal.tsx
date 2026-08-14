import React, { useState, useEffect } from 'react';
import { Insurance, DocumentMetadata } from '../../types/portfolio';
import Modal from '../Modal';
import { DocumentAttachmentField, PendingDocument } from '../ui/DocumentAttachmentField';
import { uploadDocumentFile } from '../../utils/supabaseStorage';

interface PortfolioOption {
  name: string;
  label: string;
}

interface InsuranceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPolicy: Insurance | null;
  portfolioName: string;
  portfolioOptions: PortfolioOption[];
  documents?: DocumentMetadata[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAdd: (assetType: string, portfolioName: string, payload: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (assetType: string, id: string, payload: any) => Promise<void>;
  onDeleteDoc?: (assetType: string, id: string) => Promise<void>;
}

const TYPE_OPTIONS: Array<Insurance['insurance_type']> = ['health', 'term', 'life', 'motor', 'other'];

export const InsuranceFormModal = React.memo(function InsuranceFormModal({
  isOpen,
  onClose,
  editingPolicy,
  portfolioName,
  portfolioOptions,
  documents = [],
  onAdd,
  onUpdate,
  onDeleteDoc,
}: InsuranceFormModalProps) {
  const [policyName, setPolicyName] = useState('');
  const [insuranceType, setInsuranceType] = useState<Insurance['insurance_type']>('health');
  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [sumAssured, setSumAssured] = useState('');
  const [premiumAmount, setPremiumAmount] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [notes, setNotes] = useState('');
  const [targetPortfolio, setTargetPortfolio] = useState(portfolioName);
  const [pendingFiles, setPendingFiles] = useState<PendingDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const existingDocs = editingPolicy
    ? documents.filter((d) => d.asset_type === 'insurance' && d.asset_id === editingPolicy.id)
    : [];

  useEffect(() => {
    if (editingPolicy) {
      setPolicyName(editingPolicy.policy_name || '');
      setInsuranceType(editingPolicy.insurance_type || 'health');
      setProvider(editingPolicy.provider || '');
      setPolicyNumber(editingPolicy.policy_number || '');
      setSumAssured(editingPolicy.sum_assured ? String(editingPolicy.sum_assured) : '');
      setPremiumAmount(editingPolicy.premium_amount ? String(editingPolicy.premium_amount) : '');
      setRenewalDate(editingPolicy.renewal_date || '');
      setNotes(editingPolicy.notes || '');
      setTargetPortfolio(portfolioName);
    } else {
      setPolicyName('');
      setInsuranceType('health');
      setProvider('');
      setPolicyNumber('');
      setSumAssured('');
      setPremiumAmount('');
      setRenewalDate('');
      setNotes('');
      setTargetPortfolio(portfolioName);
    }
    setPendingFiles([]);
    setError(null);
  }, [editingPolicy, portfolioName, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyName.trim()) {
      setError('Policy name is required');
      return;
    }
    const sum = parseFloat(sumAssured);
    if (isNaN(sum) || sum <= 0) {
      setError('Please enter a valid sum assured');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        policy_name: policyName.trim(),
        insurance_type: insuranceType,
        provider: provider.trim() || undefined,
        policy_number: policyNumber.trim() || undefined,
        sum_assured: sum,
        premium_amount: premiumAmount ? parseFloat(premiumAmount) : undefined,
        renewal_date: renewalDate || undefined,
        notes: notes.trim() || undefined,
      };

      let assetId = editingPolicy?.id;

      if (editingPolicy) {
        await onUpdate('insurance', editingPolicy.id, payload);
      } else {
        const res = await onAdd('insurance', targetPortfolio, payload);
        assetId = res?.id || res?.data?.id;
      }

      // Upload and link all supporting documents
      if (pendingFiles.length > 0) {
        for (const doc of pendingFiles) {
          const ts = Date.now();
          const safeName = doc.file.name.replace(/[^\w.-]/g, '_');
          const storagePath = `${targetPortfolio}/insurance/${ts}_${safeName}`;
          await uploadDocumentFile('investment-documents', storagePath, doc.file);
          await onAdd('document', targetPortfolio, {
            name: doc.name.trim() || doc.file.name,
            filePath: storagePath,
            fileType: doc.file.type,
            linkedAssetType: 'insurance',
            linkedAssetId: assetId || null,
            expiryDate: doc.expiryDate || renewalDate || null,
          });
        }
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save policy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPolicy ? 'Edit Insurance Policy' : 'Add Insurance Policy'}
      preventClose={loading}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {portfolioOptions.length > 1 && !editingPolicy && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Portfolio
            </label>
            <select
              value={targetPortfolio}
              onChange={(e) => setTargetPortfolio(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            >
              {portfolioOptions.map((p) => (
                <option key={p.name} value={p.name}>{p.label}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Policy Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Family Health Optima, Super Top Up"
            value={policyName}
            onChange={(e) => setPolicyName(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Policy Type
            </label>
            <select
              value={insuranceType}
              onChange={(e) => setInsuranceType(e.target.value as Insurance['insurance_type'])}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 capitalize"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Insurer / Provider
            </label>
            <input
              type="text"
              placeholder="e.g. Star Health, HDFC ERGO"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Policy Number
            </label>
            <input
              type="text"
              placeholder="e.g. P/12345/01/2026"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Sum Assured (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 1000000"
              value={sumAssured}
              onChange={(e) => setSumAssured(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Premium Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 24000"
              value={premiumAmount}
              onChange={(e) => setPremiumAmount(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Renewal Date
            </label>
            <input
              type="date"
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Notes
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Includes maternity & room-rent cap rider"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 resize-none"
          />
        </div>

        {/* Supporting Document Attachment */}
        <DocumentAttachmentField
          files={pendingFiles}
          onFilesChange={setPendingFiles}
          showExpiryDate={true}
          expiryDateLabel="Policy Expiry / Renewal Date (optional)"
          existingDocuments={existingDocs}
          onDeleteExistingDoc={onDeleteDoc ? (docId) => onDeleteDoc('document', docId) : undefined}
          assetTypeLabel="policy"
          hintText="Upload policy bonds, health e-cards, premium receipts, or terms copies"
        />

        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-[14px] px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm rounded-[14px] py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-rose-600 text-white font-semibold text-sm rounded-[14px] py-2.5 hover:bg-rose-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : editingPolicy ? 'Save Changes' : 'Add Policy'}
          </button>
        </div>
      </form>
    </Modal>
  );
});

export default InsuranceFormModal;

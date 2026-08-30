import React, { useState, useEffect, useRef } from 'react';
import { RealEstate, DocumentMetadata } from '../../types/portfolio';
import Modal from '../Modal';
import { DocumentAttachmentField, PendingDocument } from '../ui/DocumentAttachmentField';
import { uploadDocumentFile, generateDocumentStoragePath } from '../../utils/supabaseStorage';

interface PortfolioOption {
  name: string;
  label: string;
}

interface RealEstateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProperty: RealEstate | null;
  portfolioName: string;
  portfolioOptions: PortfolioOption[];
  documents?: DocumentMetadata[];
  onAdd: (assetType: string, portfolioName: string, payload: Record<string, unknown>) => Promise<{ id?: string; data?: { id?: string } } | void>;
  onUpdate: (assetType: string, id: string, payload: Record<string, unknown>) => Promise<void>;
  onDeleteDoc?: (assetType: string, id: string) => Promise<void>;
}

const TYPE_OPTIONS: Array<RealEstate['property_type']> = ['apartment', 'house', 'plot', 'commercial'];

export const RealEstateFormModal = React.memo(function RealEstateFormModal({
  isOpen,
  onClose,
  editingProperty,
  portfolioName,
  portfolioOptions,
  documents = [],
  onAdd,
  onUpdate,
  onDeleteDoc,
}: RealEstateFormModalProps) {
  const [propertyName, setPropertyName] = useState('');
  const [propertyType, setPropertyType] = useState<RealEstate['property_type']>('apartment');
  const [location, setLocation] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentValuation, setCurrentValuation] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [targetPortfolio, setTargetPortfolio] = useState(portfolioName);
  const [pendingFiles, setPendingFiles] = useState<PendingDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const existingDocs = editingProperty
    ? documents.filter((d) => d.asset_type === 'real_estate' && d.asset_id === editingProperty.id)
    : [];

  const createdAssetIdRef = useRef<string | null>(null);

  useEffect(() => {
    createdAssetIdRef.current = null;
    if (editingProperty) {
      setPropertyName(editingProperty.property_name || '');
      setPropertyType(editingProperty.property_type || 'apartment');
      setLocation(editingProperty.location || '');
      setPurchasePrice(editingProperty.purchase_price ? String(editingProperty.purchase_price) : '');
      setCurrentValuation(editingProperty.current_valuation ? String(editingProperty.current_valuation) : '');
      setPurchaseDate(editingProperty.purchase_date || '');
      setNotes(editingProperty.notes || '');
      setTargetPortfolio(portfolioName);
    } else {
      setPropertyName('');
      setPropertyType('apartment');
      setLocation('');
      setPurchasePrice('');
      setCurrentValuation('');
      setPurchaseDate('');
      setNotes('');
      setTargetPortfolio(portfolioName);
    }
    setPendingFiles([]);
    setError(null);
  }, [editingProperty, portfolioName, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyName.trim()) {
      setError('Property name is required');
      return;
    }

    const buyPrice = purchasePrice ? parseFloat(purchasePrice) : undefined;
    if (buyPrice !== undefined && (isNaN(buyPrice) || buyPrice < 0 || buyPrice > 5_000_000_000)) {
      setError('Purchase price cannot exceed ₹500 Crore');
      return;
    }

    const currVal = currentValuation ? parseFloat(currentValuation) : undefined;
    if (currVal !== undefined && (isNaN(currVal) || currVal < 0 || currVal > 5_000_000_000)) {
      setError('Current valuation cannot exceed ₹500 Crore');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        property_name: propertyName.trim(),
        property_type: propertyType,
        location: location.trim() || undefined,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
        current_valuation: currentValuation ? parseFloat(currentValuation) : undefined,
        purchase_date: purchaseDate || undefined,
        notes: notes.trim() || undefined,
      };

      const createdId = createdAssetIdRef.current || editingProperty?.id;
      let assetId = createdId;

      if (createdId) {
        await onUpdate('real_estate', createdId, payload);
      } else {
        const res = await onAdd('real_estate', targetPortfolio, payload);
        assetId = res?.id || res?.data?.id;
        if (assetId) {
          createdAssetIdRef.current = assetId;
        }
      }

      // Upload and link all supporting documents
      if (pendingFiles.length > 0) {
        for (const doc of pendingFiles) {
          const storagePath = generateDocumentStoragePath(targetPortfolio, 'real_estate', doc.file.name);
          await uploadDocumentFile('investment-documents', storagePath, doc.file);
          await onAdd('document', targetPortfolio, {
            name: doc.name.trim() || doc.file.name,
            filePath: storagePath,
            fileType: doc.file.type,
            linkedAssetType: 'real_estate',
            linkedAssetId: assetId || null,
            expiryDate: doc.expiryDate || null,
          });
        }
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProperty ? 'Edit Property' : 'Add Property'}
      preventClose={loading}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {portfolioOptions.length > 1 && !editingProperty && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Portfolio
            </label>
            <select
              value={targetPortfolio}
              onChange={(e) => setTargetPortfolio(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              {portfolioOptions.map((p) => (
                <option key={p.name} value={p.name}>{p.label}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Property Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 3BHK Apartment, Green Acres Plot"
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Property Type
            </label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as RealEstate['property_type'])}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 capitalize"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              City / Location
            </label>
            <input
              type="text"
              placeholder="e.g. Bangalore, Whitefield"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Purchase Price (₹)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="e.g. 7500000"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Current Valuation (₹)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="e.g. 9200000"
              value={currentValuation}
              onChange={(e) => setCurrentValuation(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Purchase Date
          </label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Notes
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Tenant lease ends Dec 2026"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-[14px] px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
          />
        </div>

        {/* Supporting Document Attachment */}
        <DocumentAttachmentField
          files={pendingFiles}
          onFilesChange={setPendingFiles}
          showExpiryDate={true}
          expiryDateLabel="Agreement / Lease Expiry Date (optional)"
          existingDocuments={existingDocs}
          onDeleteExistingDoc={onDeleteDoc ? (docId) => onDeleteDoc('document', docId) : undefined}
          assetTypeLabel="property"
          hintText="Upload title deeds, sale agreements, registry copies, or tax receipts"
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
            className="flex-1 bg-emerald-600 text-white font-semibold text-sm rounded-[14px] py-2.5 hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : editingProperty ? 'Save Changes' : 'Add Property'}
          </button>
        </div>
      </form>
    </Modal>
  );
});

export default RealEstateFormModal;

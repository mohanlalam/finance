import { useState, useRef, DragEvent } from 'react';
import { Upload, Sparkles, CheckCircle, AlertCircle, FileText, Camera, Key } from './icons/AppIcons';
import Modal from './Modal';
import { Button } from './ui/Button';
import { extractAssetFromDocument, getGeminiApiKey, setStoredGeminiApiKey, ExtractedAssetResult } from '../utils/aiDocumentExtractor';
import { uploadDocumentFile } from '../utils/supabaseStorage';
import { usePortfolioActions, usePortfolioState } from '../contexts/PortfolioContext';

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SmartImportModal({ isOpen, onClose }: SmartImportModalProps) {
  const { portfolios, activeTab } = usePortfolioState();
  const { addAsset } = usePortfolioActions();

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(() => getGeminiApiKey());
  const [showApiKeyInput, setShowApiKeyInput] = useState(() => !getGeminiApiKey());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [extractedResult, setExtractedResult] = useState<ExtractedAssetResult | null>(null);

  const [targetPortfolio, setTargetPortfolio] = useState<string>(() => activeTab || (portfolios[0]?.name ?? 'Personal'));
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setExtractedResult(null);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      setStoredGeminiApiKey(apiKey.trim());
      setShowApiKeyInput(false);
    }
  };

  const handleProcessDocument = async () => {
    if (!file) {
      setError('Please select a document or image file first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgressStep('Analyzing document structure...');

    try {
      setTimeout(() => setProgressStep('Extracting financial values with Gemini AI...'), 1200);
      const result = await extractAssetFromDocument(file, apiKey || undefined);
      setExtractedResult(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to extract financial data from document.');
    } finally {
      setIsProcessing(false);
      setProgressStep('');
    }
  };

  const normalizeInsuranceType = (type?: string): 'health' | 'term' | 'life' | 'motor' | 'other' => {
    if (!type) return 'life';
    const t = type.toLowerCase();
    if (t === 'health' || t === 'term' || t === 'life' || t === 'motor') return t;
    return 'other'; // home, travel, etc. map cleanly to 'other'
  };

  const normalizePropertyType = (type?: string): 'apartment' | 'plot' | 'house' | 'commercial' => {
    if (!type) return 'apartment';
    const t = type.toLowerCase();
    if (t === 'apartment' || t === 'plot' || t === 'house' || t === 'commercial') return t;
    if (t === 'villa') return 'house';
    return 'apartment'; // fallback
  };

  const handleSaveAsset = async () => {
    if (!extractedResult || !file) return;
    setIsSaving(true);
    setError(null);

    try {
      const { assetType, data } = extractedResult;
      let createdAssetId: string | undefined;

      // 1. Create the financial holding
      if (assetType === 'fd') {
        const principal = data.principalAmount || 0;
        const rate = data.interestRate || 0;
        const maturityAmt = data.maturityAmount || principal * (1 + (rate * 0.01));
        const res = await addAsset('fd', targetPortfolio, {
          bank_name: data.bankName || 'Unknown Bank',
          principal_amount: principal,
          interest_rate: rate,
          start_date: data.startDate || new Date().toISOString().split('T')[0],
          maturity_date: data.maturityDate || null,
          maturity_amount: maturityAmt,
          status: 'active',
          notes: data.notes,
        });
        createdAssetId = res?.id;
      } else if (assetType === 'gold') {
        const pPrice = data.purchasePrice || 0;
        const res = await addAsset('gold', targetPortfolio, {
          item_name: data.itemName || 'Gold Holding',
          purity: data.purity || '24K',
          weight_grams: data.weightGrams || 0,
          purchase_price: pPrice,
          current_valuation: data.currentValuation || pPrice,
          purchase_date: data.purchaseDate,
          notes: data.notes,
        });
        createdAssetId = res?.id;
      } else if (assetType === 'insurance') {
        const res = await addAsset('insurance', targetPortfolio, {
          policy_name: data.policyName || 'Insurance Policy',
          insurance_type: normalizeInsuranceType(data.insuranceType),
          provider: data.provider || 'Unknown Provider',
          policy_number: data.policyNumber,
          sum_assured: data.sumAssured || 0,
          premium_amount: data.premiumAmount || 0,
          renewal_date: data.renewalDate,
          notes: data.notes,
        });
        createdAssetId = res?.id;
      } else if (assetType === 'real_estate') {
        const pPrice = data.purchasePrice || 0;
        const res = await addAsset('real_estate', targetPortfolio, {
          property_name: data.propertyName || 'Real Estate Property',
          property_type: normalizePropertyType(data.propertyType),
          location: data.location,
          purchase_price: pPrice,
          current_valuation: data.currentValuation || pPrice,
          purchase_date: data.startDate || data.purchaseDate,
          monthly_rent: 0,
          notes: data.notes,
        });
        createdAssetId = res?.id;
      } else if (assetType === 'sip') {
        const monthlySip = data.monthlySip || 0;
        const res = await addAsset('sip', targetPortfolio, {
          fund_name: data.fundName || 'Mutual Fund SIP',
          monthly_sip: monthlySip,
          expected_cagr: data.expectedCagr || 12,
          units: data.units || 0,
          start_date: data.startDate || new Date().toISOString().split('T')[0],
          fallback_valuation: monthlySip * 12,
          notes: data.notes,
        });
        createdAssetId = res?.id;
      }

      // 2. Upload file to Supabase storage and link to Document Vault
      const ts = Date.now();
      const safeName = file.name.replace(/[^\w.-]/g, '_');
      const storagePath = `${targetPortfolio}/${assetType}/${ts}_${safeName}`;
      await uploadDocumentFile('investment-documents', storagePath, file);

      await addAsset('document', targetPortfolio, {
        name: `${extractedResult.title || file.name}`,
        filePath: storagePath,
        fileType: file.type || 'application/pdf',
        linkedAssetType: assetType,
        linkedAssetId: createdAssetId || null,
        expiryDate: data.maturityDate || data.renewalDate || null,
      });

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save asset and document.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="✨ Smart AI Document Import"
      maxWidth="max-w-lg"
      preventClose={isProcessing || isSaving}
    >
      <div className="p-5 space-y-4">
        {/* API Key Banner / Config */}
        {showApiKeyInput ? (
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-[var(--radius-medium)] text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Key size={14} /> Free Gemini API Key
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 dark:text-blue-400 font-bold underline hover:opacity-80"
              >
                Get Free Key (0$/mo) ↗
              </a>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Google AI Studio provides 1,500 free document analyses per day without requiring a credit card.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Paste AI Studio API Key (AIzaSy...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-[var(--radius-small)] text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-[var(--radius-small)] font-bold text-xs hover:bg-blue-700 ios-press"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <Sparkles size={13} className="text-amber-500" /> Powered by Free Gemini Flash 1.5
            </span>
            <button
              type="button"
              onClick={() => setShowApiKeyInput(true)}
              className="underline text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Change Key
            </button>
          </div>
        )}

        {!extractedResult ? (
          /* File Upload Screen */
          <div className="space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-[var(--radius-large)] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-zinc-800/30 group"
            >
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="max-h-40 rounded-lg shadow-sm mb-3 object-contain" />
              ) : file ? (
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mb-3">
                  <FileText size={24} />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 group-hover:text-blue-500 flex items-center justify-center mb-3 transition-colors">
                  <Upload size={22} />
                </div>
              )}

              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {file ? file.name : 'Tap to upload or drag & drop document'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports FD certificates, Gold receipts, Insurance policies, PDF statements & images
              </p>
            </div>

            {/* Mobile Camera Option */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[var(--surface-secondary)] text-[var(--text-primary)] rounded-[var(--radius-medium)] text-xs font-bold ios-press hover:opacity-90"
              >
                <Camera size={16} /> Take Photo
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[var(--surface-secondary)] text-[var(--text-primary)] rounded-[var(--radius-medium)] text-xs font-bold ios-press hover:opacity-90"
              >
                <Upload size={16} /> Choose File
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-[var(--radius-medium)] text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="button"
              variant="primary"
              onClick={handleProcessDocument}
              disabled={!file || isProcessing}
              className="w-full py-2.5"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Sparkles size={15} className="animate-spin" /> {progressStep || 'Extracting with AI...'}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Sparkles size={15} /> Extract Financial Details
                </span>
              )}
            </Button>
          </div>
        ) : (
          /* Extracted Data Review & Confirmation Screen */
          <div className="space-y-4 animate-fade-in">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-[var(--radius-medium)] text-xs flex items-center justify-between text-emerald-800 dark:text-emerald-300">
              <span className="font-bold flex items-center gap-1.5">
                <CheckCircle size={15} className="text-emerald-600" />
                Detected: <span className="uppercase">{extractedResult.assetType}</span> ({Math.round(extractedResult.confidence * 100)}% Match)
              </span>
              <button
                type="button"
                onClick={() => setExtractedResult(null)}
                className="text-[11px] underline text-slate-500 hover:text-slate-700"
              >
                Scan Another
              </button>
            </div>

            {/* Target Portfolio Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Add to Portfolio</label>
              <select
                value={targetPortfolio}
                onChange={(e) => setTargetPortfolio(e.target.value)}
                className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none"
              >
                {portfolios.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Extracted Fields Summary Grid */}
            <div className="bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-large)] p-4 space-y-2.5 text-xs">
              <h4 className="font-bold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-1.5">
                {extractedResult.title || 'Extracted Holding Summary'}
              </h4>

              {extractedResult.assetType === 'fd' && (
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div><span className="text-slate-400">Bank:</span> {extractedResult.data.bankName || 'N/A'}</div>
                  <div><span className="text-slate-400">Principal:</span> ₹{(extractedResult.data.principalAmount || 0).toLocaleString('en-IN')}</div>
                  <div><span className="text-slate-400">Rate:</span> {extractedResult.data.interestRate}% p.a.</div>
                  <div><span className="text-slate-400">Maturity Date:</span> {extractedResult.data.maturityDate || 'N/A'}</div>
                  <div><span className="text-slate-400">Maturity Amount:</span> ₹{(extractedResult.data.maturityAmount || 0).toLocaleString('en-IN')}</div>
                </div>
              )}

              {extractedResult.assetType === 'gold' && (
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div><span className="text-slate-400">Item:</span> {extractedResult.data.itemName || 'Gold Bullion'}</div>
                  <div><span className="text-slate-400">Purity:</span> {extractedResult.data.purity || '24K'}</div>
                  <div><span className="text-slate-400">Weight:</span> {extractedResult.data.weightGrams} grams</div>
                  <div><span className="text-slate-400">Price Paid:</span> ₹{(extractedResult.data.purchasePrice || 0).toLocaleString('en-IN')}</div>
                </div>
              )}

              {extractedResult.assetType === 'insurance' && (
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div><span className="text-slate-400">Policy:</span> {extractedResult.data.policyName || 'Policy'}</div>
                  <div><span className="text-slate-400">Provider:</span> {extractedResult.data.provider || 'N/A'}</div>
                  <div><span className="text-slate-400">Sum Assured:</span> ₹{(extractedResult.data.sumAssured || 0).toLocaleString('en-IN')}</div>
                  <div><span className="text-slate-400">Premium:</span> ₹{(extractedResult.data.premiumAmount || 0).toLocaleString('en-IN')}</div>
                  <div><span className="text-slate-400">Renewal Date:</span> {extractedResult.data.renewalDate || 'N/A'}</div>
                </div>
              )}

              {extractedResult.assetType === 'real_estate' && (
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div><span className="text-slate-400">Property:</span> {extractedResult.data.propertyName}</div>
                  <div><span className="text-slate-400">Location:</span> {extractedResult.data.location || 'N/A'}</div>
                  <div><span className="text-slate-400">Price:</span> ₹{(extractedResult.data.purchasePrice || 0).toLocaleString('en-IN')}</div>
                </div>
              )}

              {extractedResult.data.notes && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic pt-1">
                  "{extractedResult.data.notes}"
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-[var(--radius-medium)] text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setExtractedResult(null)}
                disabled={isSaving}
                className="flex-1"
              >
                Back / Rescan
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveAsset}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? 'Saving & Linking...' : 'Save & Link to Vault'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

import { useState, useRef, DragEvent } from 'react';
import { 
  Upload, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Camera, 
  Key, 
  RotateCcw
} from './icons/AppIcons';
import Modal from './Modal';
import { Button } from './ui/Button';
import { extractAssetFromDocument, getGeminiApiKey, setStoredGeminiApiKey, ExtractedAssetResult } from '../utils/aiDocumentExtractor';
import { uploadDocumentFile, removeDocumentFiles, generateDocumentStoragePath } from '../utils/supabaseStorage';
import { usePortfolioActions, usePortfolioEntities } from '../contexts/PortfolioContext';

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SupportedAssetType = 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'stocks';

interface EditableFormData {
  assetType: SupportedAssetType;
  // FD & RD
  bankName: string;
  principalAmount: number;
  monthlyDeposit: number;
  interestRate: number;
  startDate: string;
  maturityDate: string;
  maturityAmount: number;
  // Gold
  itemName: string;
  purity: string;
  weightGrams: number;
  purchasePrice: number;
  currentValuation: number;
  purchaseDate: string;
  // Real Estate
  propertyName: string;
  propertyType: 'apartment' | 'house' | 'plot' | 'commercial';
  location: string;
  // Insurance
  policyName: string;
  insuranceType: 'health' | 'term' | 'life' | 'motor' | 'other';
  provider: string;
  policyNumber: string;
  sumAssured: number;
  premiumAmount: number;
  renewalDate: string;
  // Stocks / SIP
  stockName: string;
  ticker: string;
  fundName: string;
  qty: number;
  avgPrice: number;
  monthlySip: number;
  expectedCagr: number;
  notes: string;
}

const defaultFormData: EditableFormData = {
  assetType: 'fd',
  bankName: '',
  principalAmount: 0,
  monthlyDeposit: 0,
  interestRate: 7,
  startDate: new Date().toISOString().split('T')[0],
  maturityDate: '',
  maturityAmount: 0,
  itemName: 'Gold Bullion',
  purity: '24K',
  weightGrams: 0,
  purchasePrice: 0,
  currentValuation: 0,
  purchaseDate: new Date().toISOString().split('T')[0],
  propertyName: '',
  propertyType: 'apartment',
  location: '',
  policyName: '',
  insuranceType: 'term',
  provider: '',
  policyNumber: '',
  sumAssured: 0,
  premiumAmount: 0,
  renewalDate: '',
  stockName: '',
  ticker: '',
  fundName: '',
  qty: 0,
  avgPrice: 0,
  monthlySip: 0,
  expectedCagr: 12,
  notes: '',
};

export default function SmartImportModal({ isOpen, onClose }: SmartImportModalProps) {
  const { portfolios, activeTab } = usePortfolioEntities();
  const { addAsset } = usePortfolioActions();

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(() => getGeminiApiKey());
  const [showApiKeyInput, setShowApiKeyInput] = useState(() => !getGeminiApiKey());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [extractedResult, setExtractedResult] = useState<ExtractedAssetResult | null>(null);
  const [formData, setFormData] = useState<EditableFormData>(defaultFormData);

  const [targetPortfolio, setTargetPortfolio] = useState<string>(() => {
    const validPortfolio = portfolios.find((p) => p.name === activeTab);
    return validPortfolio ? validPortfolio.name : (portfolios[0]?.name ?? 'personal');
  });
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE_MB = 20;

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File is too large (${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

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

  const populateFormWithExtractedData = (result: ExtractedAssetResult) => {
    const d = result.data;
    const initialType = (['fd', 'rd', 'sip', 'gold', 'real_estate', 'insurance', 'stocks'].includes(result.assetType)
      ? result.assetType
      : 'fd') as SupportedAssetType;

    setFormData({
      ...defaultFormData,
      assetType: initialType,
      bankName: d.bankName || '',
      principalAmount: d.principalAmount || 0,
      monthlyDeposit: d.monthlyDeposit || 0,
      interestRate: d.interestRate || 7,
      startDate: d.startDate || new Date().toISOString().split('T')[0],
      maturityDate: d.maturityDate || '',
      maturityAmount: d.maturityAmount || (d.principalAmount ? Math.round(d.principalAmount * 1.07) : 0),
      itemName: d.itemName || 'Gold Holding',
      purity: d.purity || '24K',
      weightGrams: d.weightGrams || 0,
      purchasePrice: d.purchasePrice || 0,
      currentValuation: d.currentValuation || d.purchasePrice || 0,
      purchaseDate: d.purchaseDate || new Date().toISOString().split('T')[0],
      propertyName: d.propertyName || '',
      propertyType: (d.propertyType === 'villa' ? 'house' : d.propertyType || 'apartment') as EditableFormData['propertyType'],
      location: d.location || '',
      policyName: d.policyName || '',
      insuranceType: (d.insuranceType === 'life' || d.insuranceType === 'term' || d.insuranceType === 'health' || d.insuranceType === 'motor' ? d.insuranceType : 'other') as EditableFormData['insuranceType'],
      provider: d.provider || '',
      policyNumber: d.policyNumber || '',
      sumAssured: d.sumAssured || 0,
      premiumAmount: d.premiumAmount || 0,
      renewalDate: d.renewalDate || '',
      stockName: d.stockName || '',
      ticker: d.ticker || '',
      fundName: d.fundName || '',
      qty: d.qty || 0,
      avgPrice: d.avgPrice || 0,
      monthlySip: d.monthlySip || 0,
      expectedCagr: d.expectedCagr || 12,
      notes: d.notes || '',
    });
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
      populateFormWithExtractedData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to extract financial data from document.');
    } finally {
      setIsProcessing(false);
      setProgressStep('');
    }
  };

  const handleFieldChange = (field: keyof EditableFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAsset = async () => {
    if (!file) return;
    setIsSaving(true);
    setError(null);

    try {
      const { assetType } = formData;
      let createdAssetId: string | undefined;

      // 1. Create the financial holding with user-reviewed values
      if (assetType === 'fd') {
        const principal = Number(formData.principalAmount) || 0;
        const rate = Number(formData.interestRate) || 0;
        const maturityAmt = Number(formData.maturityAmount) || principal * (1 + (rate * 0.01));
        const res = await addAsset('fd', targetPortfolio, {
          bank_name: formData.bankName.trim() || 'Unknown Bank',
          principal_amount: principal,
          interest_rate: rate,
          start_date: formData.startDate || new Date().toISOString().split('T')[0],
          maturity_date: formData.maturityDate || null,
          maturity_amount: maturityAmt,
          status: 'active',
          notes: formData.notes,
        });
        createdAssetId = res?.id;
      } else if (assetType === 'rd') {
        const monthly = Number(formData.monthlyDeposit) || 0;
        const rate = Number(formData.interestRate) || 0;
        const res = await addAsset('rd', targetPortfolio, {
          bank_name: formData.bankName.trim() || 'Unknown Bank',
          monthly_deposit: monthly,
          interest_rate: rate,
          start_date: formData.startDate || new Date().toISOString().split('T')[0],
          maturity_date: formData.maturityDate || formData.startDate || new Date().toISOString().split('T')[0],
          maturity_amount: Number(formData.maturityAmount) || monthly * 12,
          status: 'active',
          notes: formData.notes,
        });
        createdAssetId = res?.id;
      } else if (assetType === 'gold') {
        const pPrice = Number(formData.purchasePrice) || 0;
        const res = await addAsset('gold', targetPortfolio, {
          item_name: formData.itemName.trim() || 'Gold Holding',
          purity: formData.purity || '24K',
          weight_grams: Number(formData.weightGrams) || 0,
          purchase_price: pPrice,
          current_valuation: Number(formData.currentValuation) || pPrice,
          purchase_date: formData.purchaseDate,
          notes: formData.notes,
        });
        createdAssetId = res?.id;
      } else if (assetType === 'insurance') {
        const res = await addAsset('insurance', targetPortfolio, {
          policy_name: formData.policyName.trim() || 'Insurance Policy',
          insurance_type: formData.insuranceType,
          provider: formData.provider.trim() || 'Unknown Provider',
          policy_number: formData.policyNumber.trim() || undefined,
          sum_assured: Number(formData.sumAssured) || 0,
          premium_amount: Number(formData.premiumAmount) || 0,
          renewal_date: formData.renewalDate || undefined,
          notes: formData.notes,
        });
        createdAssetId = res?.id;
      } else if (assetType === 'real_estate') {
        const pPrice = Number(formData.purchasePrice) || 0;
        const res = await addAsset('real_estate', targetPortfolio, {
          property_name: formData.propertyName.trim() || 'Real Estate Property',
          property_type: formData.propertyType,
          location: formData.location.trim() || undefined,
          purchase_price: pPrice,
          current_valuation: Number(formData.currentValuation) || pPrice,
          purchase_date: formData.startDate || formData.purchaseDate,
          monthly_rent: 0,
          notes: formData.notes,
        });
        createdAssetId = res?.id;
      } else if (assetType === 'sip') {
        const monthlySip = Number(formData.monthlySip) || 0;
        const res = await addAsset('sip', targetPortfolio, {
          fund_name: formData.fundName.trim() || 'Mutual Fund SIP',
          monthly_sip: monthlySip,
          expected_cagr: Number(formData.expectedCagr) || 12,
          units: 0,
          start_date: formData.startDate || new Date().toISOString().split('T')[0],
          fallback_valuation: monthlySip * 12,
          notes: formData.notes,
        });
        createdAssetId = res?.id;
      } else if (assetType === 'stocks') {
        const qty = Number(formData.qty) || 0;
        const avgPrice = Number(formData.avgPrice) || 0;
        const ticker = formData.ticker.trim().toUpperCase() || 'STOCK.NS';
        const res = await addAsset('holding', targetPortfolio, {
          stockName: formData.stockName.trim() || ticker,
          ticker: ticker,
          yahooSymbol: ticker.includes('.') ? ticker : `${ticker}.NS`,
          qty: qty,
          avgPrice: avgPrice,
          amountInvested: qty * avgPrice,
        });
        createdAssetId = res?.id;
      }

      // 2. Upload file to Supabase storage and link to Document Vault
      const storagePath = generateDocumentStoragePath(targetPortfolio, assetType, file.name);
      await uploadDocumentFile('investment-documents', storagePath, file);

      try {
        await addAsset('document', targetPortfolio, {
          name: `${formData.bankName || formData.policyName || formData.propertyName || formData.itemName || file.name}`,
          filePath: storagePath,
          fileType: file.type || 'application/pdf',
          linkedAssetType: assetType,
          linkedAssetId: createdAssetId || null,
          expiryDate: formData.maturityDate || formData.renewalDate || null,
        });
      } catch (docErr) {
        // Rollback: remove physical file from storage so it doesn't get orphaned
        await removeDocumentFiles('investment-documents', [storagePath]).catch(() => {});
        throw docErr;
      }

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
      maxWidth={extractedResult ? 'max-w-4xl' : 'max-w-lg'}
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
                className="px-3 py-1.5 bg-blue-600 text-white rounded-[var(--radius-small)] font-bold text-xs hover:bg-blue-700 ios-press cursor-pointer"
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
              className="underline text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
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
                <img src={filePreview} alt="Preview" width={320} height={160} className="w-auto h-40 max-h-40 rounded-lg shadow-sm mb-3 object-contain" />
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
                Supports FD certificates, Gold receipts, Insurance policies, PDF statements & photos
              </p>
            </div>

            {/* Mobile Camera / File Options */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[var(--surface-secondary)] text-[var(--text-primary)] rounded-[var(--radius-medium)] text-xs font-bold ios-press hover:opacity-90 cursor-pointer"
              >
                <Camera size={16} /> Take Photo
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[var(--surface-secondary)] text-[var(--text-primary)] rounded-[var(--radius-medium)] text-xs font-bold ios-press hover:opacity-90 cursor-pointer"
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
              className="w-full py-2.5 cursor-pointer"
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
          /* ── Quarantined Review & Edit Screen (Side-by-Side on Desktop) ── */
          <div className="space-y-4 animate-fade-in">
            {/* Quarantine Notice Banner */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-[var(--radius-medium)] flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
              <span className="font-bold flex items-center gap-1.5">
                <CheckCircle size={15} className="text-amber-600 dark:text-amber-400" />
                Quarantined Review — Verify & edit extracted numbers before saving
              </span>
              <button
                type="button"
                onClick={() => setExtractedResult(null)}
                className="text-[11px] underline text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} /> Rescan
              </button>
            </div>

            {/* Split View Container */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Left Column: Original Document Thumbnail / Info (4 cols) */}
              <div className="md:col-span-4 bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-large)] p-3.5 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-tertiary)] block mb-2">
                    Scanned Document
                  </span>
                  {filePreview ? (
                    <div className="rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-black/5 dark:bg-white/5 p-1 flex items-center justify-center max-h-56">
                      <img
                        src={filePreview}
                        alt="Uploaded document scan"
                        className="max-h-52 w-auto object-contain rounded"
                      />
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-center">
                      <FileText size={36} className="mx-auto text-blue-500 mb-2" />
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">{file?.name}</p>
                      <p className="text-[10.5px] text-[var(--text-tertiary)] mt-0.5">
                        {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · ${file.type || 'PDF'}` : ''}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-tertiary)] space-y-1">
                  <p className="flex justify-between">
                    <span>AI Confidence:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {Math.round(extractedResult.confidence * 100)}%
                    </strong>
                  </p>
                  <p className="flex justify-between">
                    <span>Target Vault:</span>
                    <strong className="text-[var(--text-primary)] truncate max-w-[120px]">
                      {targetPortfolio}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Right Column: Editable Fields (8 cols) */}
              <div className="md:col-span-8 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-large)] p-4 space-y-3.5">
                
                {/* Header Controls: Category & Portfolio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 border-b border-[var(--border-subtle)]">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      Asset Category
                    </label>
                    <select
                      value={formData.assetType}
                      onChange={(e) => handleFieldChange('assetType', e.target.value as SupportedAssetType)}
                      className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none"
                    >
                      <option value="fd">🏦 Fixed Deposit (FD)</option>
                      <option value="rd">🔄 Recurring Deposit (RD)</option>
                      <option value="sip">📈 Mutual Fund SIP</option>
                      <option value="gold">🪙 Gold Bullion</option>
                      <option value="real_estate">🏠 Real Estate</option>
                      <option value="insurance">🛡️ Insurance Policy</option>
                      <option value="stocks">📊 Stock / ETF Holding</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      Target Portfolio
                    </label>
                    <select
                      value={targetPortfolio}
                      onChange={(e) => setTargetPortfolio(e.target.value)}
                      className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none"
                    >
                      {portfolios.map((p) => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Form Fields: Specific to Asset Type */}
                <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                  
                  {/* Fixed Deposit Fields */}
                  {formData.assetType === 'fd' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Bank / Institution</label>
                        <input
                          type="text"
                          value={formData.bankName}
                          onChange={(e) => handleFieldChange('bankName', e.target.value)}
                          placeholder="e.g. HDFC Bank, SBI"
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Principal Amount (₹)</label>
                        <input
                          type="number"
                          value={formData.principalAmount || ''}
                          onChange={(e) => handleFieldChange('principalAmount', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Interest Rate (% p.a.)</label>
                        <input
                          type="number"
                          step="0.05"
                          value={formData.interestRate || ''}
                          onChange={(e) => handleFieldChange('interestRate', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Start Date</label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => handleFieldChange('startDate', e.target.value)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Maturity Date</label>
                        <input
                          type="date"
                          value={formData.maturityDate}
                          onChange={(e) => handleFieldChange('maturityDate', e.target.value)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Maturity Amount (₹)</label>
                        <input
                          type="number"
                          value={formData.maturityAmount || ''}
                          onChange={(e) => handleFieldChange('maturityAmount', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Recurring Deposit Fields */}
                  {formData.assetType === 'rd' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={formData.bankName}
                          onChange={(e) => handleFieldChange('bankName', e.target.value)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Monthly Deposit (₹)</label>
                        <input
                          type="number"
                          value={formData.monthlyDeposit || ''}
                          onChange={(e) => handleFieldChange('monthlyDeposit', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Interest Rate (%)</label>
                        <input
                          type="number"
                          step="0.05"
                          value={formData.interestRate || ''}
                          onChange={(e) => handleFieldChange('interestRate', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Start Date</label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => handleFieldChange('startDate', e.target.value)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Maturity Date</label>
                        <input
                          type="date"
                          value={formData.maturityDate}
                          onChange={(e) => handleFieldChange('maturityDate', e.target.value)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Gold Fields */}
                  {formData.assetType === 'gold' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Item Name</label>
                        <input
                          type="text"
                          value={formData.itemName}
                          onChange={(e) => handleFieldChange('itemName', e.target.value)}
                          placeholder="e.g. 24K Gold Bar, Gold Coins"
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Purity</label>
                        <select
                          value={formData.purity}
                          onChange={(e) => handleFieldChange('purity', e.target.value)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        >
                          <option value="24K">24K (99.9% Pure)</option>
                          <option value="22K">22K / 916 Hallmark</option>
                          <option value="18K">18K (75.0% Pure)</option>
                          <option value="14K">14K (58.5% Pure)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Weight (Grams)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.weightGrams || ''}
                          onChange={(e) => handleFieldChange('weightGrams', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Purchase Price (₹)</label>
                        <input
                          type="number"
                          value={formData.purchasePrice || ''}
                          onChange={(e) => handleFieldChange('purchasePrice', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Purchase Date</label>
                        <input
                          type="date"
                          value={formData.purchaseDate}
                          onChange={(e) => handleFieldChange('purchaseDate', e.target.value)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Insurance Fields */}
                  {formData.assetType === 'insurance' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Policy Name</label>
                        <input
                          type="text"
                          value={formData.policyName}
                          onChange={(e) => handleFieldChange('policyName', e.target.value)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Insurance Type</label>
                        <select
                          value={formData.insuranceType}
                          onChange={(e) => handleFieldChange('insuranceType', e.target.value as EditableFormData['insuranceType'])}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        >
                          <option value="term">Term Life Insurance</option>
                          <option value="health">Health Insurance</option>
                          <option value="life">Endowment / ULIP</option>
                          <option value="motor">Motor Insurance</option>
                          <option value="other">Other Coverage</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Insurance Provider</label>
                        <input
                          type="text"
                          value={formData.provider}
                          onChange={(e) => handleFieldChange('provider', e.target.value)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Policy Number</label>
                        <input
                          type="text"
                          value={formData.policyNumber}
                          onChange={(e) => handleFieldChange('policyNumber', e.target.value)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Sum Assured (₹)</label>
                        <input
                          type="number"
                          value={formData.sumAssured || ''}
                          onChange={(e) => handleFieldChange('sumAssured', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Annual Premium (₹)</label>
                        <input
                          type="number"
                          value={formData.premiumAmount || ''}
                          onChange={(e) => handleFieldChange('premiumAmount', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Renewal Date</label>
                        <input
                          type="date"
                          value={formData.renewalDate}
                          onChange={(e) => handleFieldChange('renewalDate', e.target.value)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Real Estate Fields */}
                  {formData.assetType === 'real_estate' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Property Name</label>
                        <input
                          type="text"
                          value={formData.propertyName}
                          onChange={(e) => handleFieldChange('propertyName', e.target.value)}
                          placeholder="e.g. Skyline Residency #402"
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Property Type</label>
                        <select
                          value={formData.propertyType}
                          onChange={(e) => handleFieldChange('propertyType', e.target.value as EditableFormData['propertyType'])}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        >
                          <option value="apartment">Apartment / Flat</option>
                          <option value="house">House / Villa</option>
                          <option value="plot">Land / Plot</option>
                          <option value="commercial">Commercial Space</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Location</label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => handleFieldChange('location', e.target.value)}
                          placeholder="City, Area"
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Purchase / Current Value (₹)</label>
                        <input
                          type="number"
                          value={formData.purchasePrice || ''}
                          onChange={(e) => handleFieldChange('purchasePrice', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Mutual Fund SIP Fields */}
                  {formData.assetType === 'sip' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Fund Name</label>
                        <input
                          type="text"
                          value={formData.fundName}
                          onChange={(e) => handleFieldChange('fundName', e.target.value)}
                          placeholder="e.g. Parag Parikh Flexi Cap Fund"
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Monthly SIP (₹)</label>
                        <input
                          type="number"
                          value={formData.monthlySip || ''}
                          onChange={(e) => handleFieldChange('monthlySip', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Expected CAGR (%)</label>
                        <input
                          type="number"
                          value={formData.expectedCagr || ''}
                          onChange={(e) => handleFieldChange('expectedCagr', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Stock / ETF Holding Fields */}
                  {formData.assetType === 'stocks' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Stock Ticker (NSE/BSE)</label>
                        <input
                          type="text"
                          value={formData.ticker}
                          onChange={(e) => handleFieldChange('ticker', e.target.value.toUpperCase())}
                          placeholder="e.g. RELIANCE.NS, INFY.NS"
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Company Name</label>
                        <input
                          type="text"
                          value={formData.stockName}
                          onChange={(e) => handleFieldChange('stockName', e.target.value)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Quantity (Shares)</label>
                        <input
                          type="number"
                          value={formData.qty || ''}
                          onChange={(e) => handleFieldChange('qty', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Avg Buy Price (₹)</label>
                        <input
                          type="number"
                          value={formData.avgPrice || ''}
                          onChange={(e) => handleFieldChange('avgPrice', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Notes Field */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Extracted Notes / Remarks</label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => handleFieldChange('notes', e.target.value)}
                      placeholder="Optional notes or details"
                      className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-[var(--radius-medium)] text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="flex gap-3 pt-3 border-t border-[var(--border-subtle)]">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setExtractedResult(null)}
                    disabled={isSaving}
                    className="flex-1 cursor-pointer"
                  >
                    Back / Rescan
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSaveAsset}
                    disabled={isSaving}
                    className="flex-1 cursor-pointer"
                  >
                    {isSaving ? 'Saving & Linking...' : 'Confirm & Save to Portfolio'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

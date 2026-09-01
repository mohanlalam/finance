import { useState, useEffect, useCallback, useMemo } from 'react';
import { extractAssetFromDocument } from '../../../utils/aiDocumentExtractor';
import { deriveGoldRates } from '../../../utils/goldPricing';
import { portfolioSyncService } from '../../portfolio/services/portfolioSyncService';
import { Portfolio } from '../../../types/portfolio';
import {
  SmartImportFormData,
  SmartImportExtractionResult,
  ImportSaveStep,
  DuplicateMatch,
} from '../types';
import { validateAndNormalizeFinancialData } from '../services/financialValidationService';
import { checkForDuplicateAsset } from '../services/duplicateDetectionService';
import { executeImportPersistence } from '../services/importPersistenceService';

const INITIAL_FORM_DATA: SmartImportFormData = {
  institutionName: '',
  principalAmount: '',
  interestRate: '',
  startDate: '',
  maturityDate: '',
  maturityAmount: '',
  monthlyDeposit: '',
  totalInstallments: '',
  paidInstallments: '',
  fundName: '',
  folioNumber: '',
  monthlySip: '',
  sipDate: '',
  nav: '',
  units: '',
  currentValuation: '',
  expectedCagr: '12',
  itemName: '',
  purity: '22K',
  weightGrams: '',
  purchasePrice: '',
  purchasePriceType: 'unknown',
  ratePerGram: '',
  stockName: '',
  symbol: '',
  quantity: '',
  avgBuyPrice: '',
  propertyName: '',
  propertyType: 'Residential',
  location: '',
  purchasePriceRealty: '',
  currentValuationRealty: '',
  monthlyRent: '0',
  policyName: '',
  policyNumber: '',
  insuranceType: 'Term',
  sumAssured: '',
  premiumAmount: '',
  renewalDate: '',
  policyTermYears: '',
  notes: '',
};

interface UseSmartImportPipelineProps {
  isOpen: boolean;
  onClose: () => void;
  activePortfolio: string;
  portfolios: Portfolio[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addAsset: (assetType: string, portfolioName: string, payload: any, options?: { reload?: boolean }) => Promise<any>;
  loadPortfolios: () => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function useSmartImportPipeline({
  isOpen,
  onClose,
  activePortfolio,
  portfolios,
  addAsset,
  loadPortfolios,
  showToast,
}: UseSmartImportPipelineProps) {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [extractedResult, setExtractedResult] = useState<SmartImportExtractionResult | null>(null);
  const [formData, setFormData] = useState<SmartImportFormData>(INITIAL_FORM_DATA);
  const [targetPortfolio, setTargetPortfolio] = useState<string>(activePortfolio || 'Personal');
  const [duplicateMatch, setDuplicateMatch] = useState<DuplicateMatch | null>(null);
  const [dismissedDuplicate, setDismissedDuplicate] = useState(false);

  // Save state machine
  const [saveStep, setSaveStep] = useState<ImportSaveStep>('IDLE');
  const [saveMessage, setSaveMessage] = useState('');

  // Complete state teardown on open/close
  const resetAllState = useCallback(() => {
    setFile(null);
    setFilePreview(null);
    setIsProcessing(false);
    setProcessingProgress(0);
    setProcessingStatus('');
    setError(null);
    setExtractedResult(null);
    setFormData(INITIAL_FORM_DATA);
    setDuplicateMatch(null);
    setDismissedDuplicate(false);
    setSaveStep('IDLE');
    setSaveMessage('');
    portfolioSyncService.reset();
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetAllState();
      setTargetPortfolio(activePortfolio && activePortfolio !== 'all' ? activePortfolio : 'Personal');
    }
  }, [isOpen, activePortfolio, resetAllState]);

  // Live spot rates
  const goldRates = useMemo(() => deriveGoldRates(), []);
  const currentLiveGoldRate = formData.purity === '22K' ? goldRates.rate22kPerGram : goldRates.rate24kPerGram;

  // Handle file select and AI extraction
  const handleFileSelect = async (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }

    setIsProcessing(true);
    setProcessingProgress(15);
    setProcessingStatus('Reading document contents...');

    try {
      setProcessingProgress(40);
      setProcessingStatus('Analyzing document with Gemini AI...');

      const result = await extractAssetFromDocument(selectedFile);
      setProcessingProgress(80);
      setProcessingStatus('Validating extracted fields...');

      // Build initial form data from extracted fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData: any = result.data || {};
      const newForm: SmartImportFormData = {
        ...INITIAL_FORM_DATA,
        institutionName: rawData.bankName || rawData.institutionName || rawData.companyName || '',
        principalAmount: rawData.principalAmount ? String(rawData.principalAmount) : '',
        interestRate: rawData.interestRate ? String(rawData.interestRate) : '',
        startDate: rawData.startDate || rawData.depositDate || rawData.purchaseDate || '',
        maturityDate: rawData.maturityDate || rawData.expiryDate || '',
        maturityAmount: rawData.maturityAmount ? String(rawData.maturityAmount) : '',
        monthlyDeposit: rawData.monthlyDeposit ? String(rawData.monthlyDeposit) : '',
        totalInstallments: rawData.totalInstallments ? String(rawData.totalInstallments) : '12',
        paidInstallments: rawData.paidInstallments ? String(rawData.paidInstallments) : '1',
        fundName: rawData.fundName || rawData.schemeName || '',
        folioNumber: rawData.folioNumber || '',
        monthlySip: rawData.monthlyInvestment || rawData.monthlySip ? String(rawData.monthlyInvestment || rawData.monthlySip) : '',
        sipDate: rawData.sipDate ? String(rawData.sipDate) : '1',
        nav: rawData.nav ? String(rawData.nav) : '',
        units: rawData.units ? String(rawData.units) : '',
        currentValuation: rawData.currentValuation ? String(rawData.currentValuation) : '',
        itemName: rawData.itemName || rawData.description || '',
        purity: (rawData.purity as '24K' | '22K' | '18K' | '14K') || '22K',
        weightGrams: rawData.weightGrams ? String(rawData.weightGrams) : '',
        purchasePrice: rawData.purchasePrice ? String(rawData.purchasePrice) : '',
        purchasePriceType: (result as unknown as { purchasePriceType?: 'total' | 'per_gram' | 'unknown' }).purchasePriceType || 'unknown',
        stockName: rawData.stockName || rawData.name || '',
        symbol: rawData.symbol || '',
        quantity: rawData.quantity || rawData.qty ? String(rawData.quantity || rawData.qty) : '1',
        avgBuyPrice: rawData.avgPrice || rawData.avgBuyPrice ? String(rawData.avgPrice || rawData.avgBuyPrice) : '',
        propertyName: rawData.propertyName || rawData.title || '',
        purchasePriceRealty: rawData.purchasePrice ? String(rawData.purchasePrice) : '',
        currentValuationRealty: rawData.currentValuation || rawData.purchasePrice ? String(rawData.currentValuation || rawData.purchasePrice) : '',
        monthlyRent: rawData.monthlyRent ? String(rawData.monthlyRent) : '0',
        policyName: rawData.policyName || rawData.planName || '',
        policyNumber: rawData.policyNumber || '',
        insuranceType: rawData.insuranceType || 'Term',
        sumAssured: rawData.sumAssured ? String(rawData.sumAssured) : '',
        premiumAmount: rawData.premiumAmount ? String(rawData.premiumAmount) : '',
        renewalDate: rawData.renewalDate || rawData.nextPremiumDate || '',
      };

      // Apply mathematical auto-calculations
      const validation = validateAndNormalizeFinancialData(result.assetType, newForm);
      const mergedForm = { ...newForm, ...validation.autoCorrectedFields };

      // Build structured field map
      const fields: Record<string, { value: unknown; confidence: number; status: 'verified' | 'needs_review' | 'missing' }> = {};
      Object.keys(mergedForm).forEach((k) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const val = (mergedForm as any)[k];
        if (val) {
          fields[k] = {
            value: val,
            confidence: result.confidence || 0.95,
            status: 'verified',
          };
        }
      });

      const rawResult = result as unknown as { documentType?: SmartImportExtractionResult['documentType']; rawText?: string };
      setExtractedResult({
        assetType: result.assetType as SmartImportExtractionResult['assetType'],
        documentType: rawResult.documentType || 'general_document',
        overallConfidence: result.confidence || 0.95,
        fields,
        warnings: validation.warnings,
        missingFields: [],
        rawText: rawResult.rawText,
      });

      setFormData(mergedForm);

      // Check for duplicate asset
      const duplicate = checkForDuplicateAsset(result.assetType, targetPortfolio, mergedForm, portfolios);
      setDuplicateMatch(duplicate);

      setProcessingProgress(100);
      setProcessingStatus('Extraction complete!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract data from document');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Save Pipeline
  const handleSave = async () => {
    if (!extractedResult) return;

    setSaveStep('VALIDATING');
    const res = await executeImportPersistence(
      extractedResult.assetType,
      targetPortfolio,
      formData,
      file,
      {
        onStepChange: (step, msg) => {
          setSaveStep(step);
          setSaveMessage(msg);
        },
        addAsset,
        loadPortfolios,
      }
    );

    if (res.success) {
      showToast(
        `Successfully imported ${extractedResult.assetType.toUpperCase()} asset!`,
        'success'
      );
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setError(res.error || 'Failed to import holding');
    }
  };

  return {
    file,
    filePreview,
    isProcessing,
    processingProgress,
    processingStatus,
    error,
    extractedResult,
    formData,
    setFormData,
    targetPortfolio,
    setTargetPortfolio,
    duplicateMatch: dismissedDuplicate ? null : duplicateMatch,
    dismissDuplicate: () => setDismissedDuplicate(true),
    saveStep,
    saveMessage,
    currentLiveGoldRate,
    handleFileSelect,
    handleSave,
    resetAllState,
  };
}

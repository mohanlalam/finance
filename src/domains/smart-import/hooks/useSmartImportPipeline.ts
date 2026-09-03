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
  BatchImportItem,
  ExtractedField,
} from '../types';
import { validateAndNormalizeFinancialData } from '../services/financialValidationService';
import { checkForDuplicateAsset } from '../services/duplicateDetectionService';
import { executeImportPersistence } from '../services/importPersistenceService';
import { disambiguateEntity } from '../services/entityDisambiguationService';
import { buildEvidenceHeatmap } from '../services/evidenceHeatmapService';
import { enhanceDocumentImage } from '../../../utils/imageEnhancer';

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

  // Batch multi-statement synthesis state
  const [batchItems, setBatchItems] = useState<BatchImportItem[]>([]);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);

  const [extractedResult, setExtractedResult] = useState<SmartImportExtractionResult | null>(null);
  const [formData, setFormData] = useState<SmartImportFormData>(INITIAL_FORM_DATA);

  const resolveValidPortfolio = useCallback((): string => {
    if (activePortfolio && activePortfolio !== 'all' && portfolios.some((p) => p.name === activePortfolio)) {
      return activePortfolio;
    }
    return portfolios.length > 0 ? portfolios[0].name : 'rammohan';
  }, [activePortfolio, portfolios]);

  const [targetPortfolio, setTargetPortfolio] = useState<string>(() => resolveValidPortfolio());
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
    setBatchItems([]);
    setActiveBatchIndex(0);
    setDuplicateMatch(null);
    setDismissedDuplicate(false);
    setSaveStep('IDLE');
    setSaveMessage('');
    setTargetPortfolio(resolveValidPortfolio());
    portfolioSyncService.reset();
  }, [resolveValidPortfolio]);

  useEffect(() => {
    if (isOpen) {
      resetAllState();
      setTargetPortfolio(resolveValidPortfolio());
    }
  }, [isOpen, resolveValidPortfolio, resetAllState]);

  // Live spot rates
  const goldRates = useMemo(() => deriveGoldRates(), []);
  const currentLiveGoldRate = formData.purity === '22K' ? goldRates.rate22kPerGram : goldRates.rate24kPerGram;

  /**
   * Helper to extract a single file with disambiguation and evidence heatmaps
   */
  const processSingleFile = useCallback(async (selectedFile: File): Promise<BatchImportItem> => {
    let fileToExtract = selectedFile;
    let preview = selectedFile.type.startsWith('image/')
      ? URL.createObjectURL(selectedFile)
      : null;
    let wasEnhanced = false;
    let contrastGainPct = 0;

    // Mobile Photo Contrast & Sharpness Auto-Enhancer
    if (selectedFile.type.startsWith('image/')) {
      try {
        const enhancement = await enhanceDocumentImage(selectedFile);
        if (enhancement.wasEnhanced) {
          fileToExtract = enhancement.enhancedFile;
          preview = enhancement.previewUrl;
          wasEnhanced = true;
          contrastGainPct = enhancement.metrics?.contrastGainPct || 15;
        }
      } catch {
        // Fallback to original file
      }
    }

    const result = await extractAssetFromDocument(fileToExtract);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData: any = result.data || {};
    const rawResult = result as unknown as { documentType?: SmartImportExtractionResult['documentType']; rawText?: string };

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
      notes: rawData.notes || '',
    };

    const validation = validateAndNormalizeFinancialData(result.assetType, newForm);
    const mergedForm = { ...newForm, ...validation.autoCorrectedFields };

    // Build raw field map
    const initialFields: Record<string, ExtractedField<unknown>> = {};
    Object.keys(mergedForm).forEach((k) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = (mergedForm as any)[k];
      if (val) {
        initialFields[k] = {
          value: val,
          confidence: result.confidence || 0.95,
          status: 'verified',
        };
      }
    });

    // Compute evidence anchors and confidence heatmaps
    const heatmap = buildEvidenceHeatmap(initialFields, rawResult.rawText);
    const enrichedFields: Record<string, ExtractedField<unknown>> = {};
    for (const [k, f] of Object.entries(initialFields)) {
      const anchor = heatmap[k];
      enrichedFields[k] = {
        ...f,
        confidence: anchor ? anchor.confidence : f.confidence,
        snippet: anchor?.snippet,
        boundingBox: anchor?.boundingBox,
        pageIndex: anchor?.pageIndex,
      };
    }

    // Cross-Asset Entity Disambiguation
    const disambiguation = disambiguateEntity(
      {
        fileName: selectedFile.name,
        title: result.title,
        notes: rawData.notes,
        rawText: rawResult.rawText,
        accountNumber: rawData.policyNumber || rawData.folioNumber,
      },
      portfolios.map((p) => ({ name: p.name, label: p.label || p.name })),
      activePortfolio
    );

    const extResult: SmartImportExtractionResult = {
      assetType: result.assetType as SmartImportExtractionResult['assetType'],
      documentType: rawResult.documentType || 'general_document',
      overallConfidence: result.confidence || 0.95,
      fields: enrichedFields,
      warnings: validation.warnings,
      missingFields: [],
      rawText: rawResult.rawText,
      disambiguation,
    };

    const duplicate = checkForDuplicateAsset(result.assetType, disambiguation.portfolioName, mergedForm, portfolios);

    return {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      file: selectedFile,
      filePreview: preview,
      status: 'ready',
      extractedResult: extResult,
      formData: mergedForm,
      targetPortfolio: disambiguation.portfolioName,
      disambiguation,
      duplicateMatch: duplicate,
      wasEnhanced,
      contrastGainPct,
    };
  }, [activePortfolio, portfolios]);

  // Handle single file select
  const handleFileSelect = async (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);
    setIsProcessing(true);
    setProcessingProgress(20);
    setProcessingStatus('Analyzing document with Gemini AI...');

    try {
      const item = await processSingleFile(selectedFile);
      setFilePreview(item.filePreview);
      setExtractedResult(item.extractedResult);
      setFormData(item.formData);
      setTargetPortfolio(item.targetPortfolio);
      setDuplicateMatch(item.duplicateMatch || null);
      setBatchItems([item]);
      setActiveBatchIndex(0);
      setProcessingProgress(100);
      setProcessingStatus('Extraction complete!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract data from document');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle multiple files batch select
  const handleFilesSelect = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    if (selectedFiles.length === 1) {
      return handleFileSelect(selectedFiles[0]);
    }

    setError(null);
    setIsProcessing(true);
    setProcessingProgress(10);
    setProcessingStatus(`Processing batch of ${selectedFiles.length} documents...`);

    const items: BatchImportItem[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const currFile = selectedFiles[i];
        setProcessingStatus(`Analyzing document ${i + 1} of ${selectedFiles.length}: ${currFile.name}...`);
        setProcessingProgress(Math.round(((i + 1) / selectedFiles.length) * 90));

        try {
          const item = await processSingleFile(currFile);
          items.push(item);
        } catch (itemErr) {
          items.push({
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            file: currFile,
            filePreview: null,
            status: 'error',
            error: itemErr instanceof Error ? itemErr.message : 'Extraction error',
            extractedResult: null,
            formData: INITIAL_FORM_DATA,
            targetPortfolio: resolveValidPortfolio(),
            disambiguation: {
              portfolioName: resolveValidPortfolio(),
              memberLabel: 'Rammohan',
              matchType: 'default',
              confidence: 0.5,
              details: 'Failed to extract',
            },
          });
        }
      }

      setBatchItems(items);
      setActiveBatchIndex(0);

      const firstReady = items.find((it) => it.status === 'ready') || items[0];
      if (firstReady && firstReady.extractedResult) {
        setFile(firstReady.file);
        setFilePreview(firstReady.filePreview);
        setExtractedResult(firstReady.extractedResult);
        setFormData(firstReady.formData);
        setTargetPortfolio(firstReady.targetPortfolio);
        setDuplicateMatch(firstReady.duplicateMatch || null);
      }

      setProcessingProgress(100);
      setProcessingStatus(`Batch synthesis complete (${items.filter((i) => i.status === 'ready').length} ready)!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch extraction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Switch between batch items
  const handleSelectBatchIndex = (index: number) => {
    if (index < 0 || index >= batchItems.length) return;
    setActiveBatchIndex(index);
    const item = batchItems[index];
    if (item && item.extractedResult) {
      setFile(item.file);
      setFilePreview(item.filePreview);
      setExtractedResult(item.extractedResult);
      setFormData(item.formData);
      setTargetPortfolio(item.targetPortfolio);
      setDuplicateMatch(item.duplicateMatch || null);
    }
  };

  // Remove item from batch
  const handleRemoveBatchItem = (id: string) => {
    const updated = batchItems.filter((i) => i.id !== id);
    setBatchItems(updated);
    if (updated.length === 0) {
      resetAllState();
    } else {
      const nextIdx = Math.min(activeBatchIndex, updated.length - 1);
      handleSelectBatchIndex(nextIdx);
    }
  };

  // Update target portfolio and check duplicates
  const handleTargetPortfolioChange = useCallback((newPortfolio: string) => {
    setTargetPortfolio(newPortfolio);
    setDismissedDuplicate(false);

    if (batchItems.length > 0 && batchItems[activeBatchIndex]) {
      const updated = [...batchItems];
      updated[activeBatchIndex].targetPortfolio = newPortfolio;
      setBatchItems(updated);
    }

    if (extractedResult) {
      const duplicate = checkForDuplicateAsset(
        extractedResult.assetType,
        newPortfolio,
        formData,
        portfolios
      );
      setDuplicateMatch(duplicate);
    }
  }, [activeBatchIndex, batchItems, extractedResult, formData, portfolios]);

  // Update form data and sync back to active batch item
  const handleFormDataChange = useCallback((updater: (prev: SmartImportFormData) => SmartImportFormData) => {
    setFormData((prev) => {
      const next = updater(prev);
      if (batchItems.length > 0 && batchItems[activeBatchIndex]) {
        const updated = [...batchItems];
        updated[activeBatchIndex].formData = next;
        setBatchItems(updated);
      }
      return next;
    });
  }, [activeBatchIndex, batchItems]);

  // Execute Save Pipeline (Single Item)
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
        `Successfully imported ${extractedResult.assetType.toUpperCase()} to ${targetPortfolio}!`,
        'success'
      );
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setError(res.error || 'Failed to import holding');
    }
  };

  // Execute Batch Save Pipeline
  const handleSaveAll = async () => {
    const readyItems = batchItems.filter((i) => i.status === 'ready' && i.extractedResult);
    if (readyItems.length === 0) return;

    setSaveStep('SAVING_ASSET');
    let successCount = 0;

    for (let i = 0; i < readyItems.length; i++) {
      const item = readyItems[i];
      setSaveMessage(`Importing ${i + 1} of ${readyItems.length}: ${item.file.name} to ${item.targetPortfolio}...`);

      const res = await executeImportPersistence(
        item.extractedResult!.assetType,
        item.targetPortfolio,
        item.formData,
        item.file,
        {
          onStepChange: (_step, msg) => setSaveMessage(msg),
          addAsset,
          loadPortfolios,
        }
      );

      if (res.success) {
        successCount++;
        item.status = 'saved';
      }
    }

    setSaveStep('SUCCESS');
    showToast(`Successfully batch imported ${successCount} assets across family registries!`, 'success');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const isSaving = saveStep !== 'IDLE' && saveStep !== 'SUCCESS' && saveStep !== 'ERROR';

  return {
    file,
    filePreview,
    isProcessing,
    processingProgress,
    processingStatus,
    error,
    batchItems,
    activeBatchIndex,
    isBatchMode: batchItems.length > 1,
    wasEnhanced: Boolean(batchItems[activeBatchIndex]?.wasEnhanced),
    contrastGainPct: batchItems[activeBatchIndex]?.contrastGainPct || 0,
    extractedResult,
    formData,
    setFormData: handleFormDataChange,
    targetPortfolio,
    setTargetPortfolio: handleTargetPortfolioChange,
    duplicateMatch: dismissedDuplicate ? null : duplicateMatch,
    dismissDuplicate: () => setDismissedDuplicate(true),
    saveStep,
    saveMessage,
    isSaving,
    currentLiveGoldRate,
    handleFileSelect,
    handleFilesSelect,
    handleSelectBatchIndex,
    handleRemoveBatchItem,
    handleSave,
    handleSaveAll,
    resetAllState,
  };
}

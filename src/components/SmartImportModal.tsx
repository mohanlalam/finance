import React, { useMemo } from 'react';
import Modal from './Modal';
import { Button } from './ui/Button';
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
} from './icons/AppIcons';
import { usePortfolioActions, usePortfolioEntities } from '../contexts/PortfolioContext';
import { useToastActions } from '../contexts/ToastContext';
import { useSmartImportPipeline } from '../domains/smart-import/hooks/useSmartImportPipeline';
import { ImportDropZone } from './smart-import/ImportDropZone';
import { ImportReviewForm } from './smart-import/ImportReviewForm';
import { ImportSaveProgress } from './smart-import/ImportSaveProgress';
import { BatchQuarantineReview } from './smart-import/BatchQuarantineReview';

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SmartImportStep = 'upload' | 'processing' | 'review' | 'saving';

export const SmartImportModal: React.FC<SmartImportModalProps> = ({ isOpen, onClose }) => {
  const { activePortfolio, portfolios } = usePortfolioEntities();
  const { addAsset, load } = usePortfolioActions();
  const { addToast } = useToastActions();

  const {
    file,
    filePreview,
    isProcessing,
    processingProgress,
    processingStatus,
    error,
    batchItems,
    activeBatchIndex,
    isBatchMode,
    extractedResult,
    formData,
    setFormData,
    targetPortfolio,
    setTargetPortfolio,
    duplicateMatch,
    dismissDuplicate,
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
  } = useSmartImportPipeline({
    isOpen,
    onClose,
    activePortfolio: activePortfolio?.name || (portfolios[0]?.name || ''),
    portfolios,
    addAsset,
    loadPortfolios: load,
    showToast: addToast,
  });

  const portfolioOptions = useMemo(
    () =>
      portfolios.map((p) => ({
        name: p.name,
        label: p.label || p.name,
      })),
    [portfolios]
  );

  const handleCloseModal = () => {
    if (isSaving) {
      addToast('Import is saving to portfolio. Please wait...', 'info');
      return;
    }
    resetAllState();
    onClose();
  };

  // Explicit UI step state machine
  const currentStep: SmartImportStep = isSaving
    ? 'saving'
    : isProcessing
    ? 'processing'
    : extractedResult
    ? 'review'
    : 'upload';

  const modalTitle = isBatchMode
    ? `✨ Multi-Document Family Vault Agent (${batchItems.length} statements)`
    : '✨ Smart AI Document Import';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      preventClose={isSaving}
      title={modalTitle}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-3 sm:space-y-5">
        {/* Header Description */}
        <div className="pb-2 sm:pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-snug">
              Upload statements or receipts. Auto-sorts by <span className="font-semibold text-[var(--text-primary)]">Rammohan</span>, <span className="font-semibold text-[var(--text-primary)]">Padmavathi</span>, or <span className="font-semibold text-[var(--text-primary)]">Sai Laxmi</span>.
            </p>
          </div>
          {isBatchMode && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-500/25 shrink-0">
              <Sparkles size={10} />
              Batch ({batchItems.length})
            </span>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 flex items-start gap-2 text-rose-700 dark:text-rose-400 animate-slide-up">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1 text-[11px] sm:text-xs">
              <span className="font-bold">Extraction Error: </span>
              {typeof error === 'string' ? error : (error as { message?: string })?.message || String(error)}
            </div>
          </div>
        )}

        {/* Step: Processing State */}
        {currentStep === 'processing' && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 sm:p-8 text-center space-y-3 sm:space-y-4 animate-pulse">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-500/20 text-amber-600 mx-auto flex items-center justify-center animate-spin">
              <RefreshCw size={20} />
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                Multi-Document Quarantine &amp; Entity Disambiguation
              </h5>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono truncate max-w-sm mx-auto">
                {processingStatus}
              </p>
            </div>
            <div className="w-48 sm:w-56 mx-auto bg-slate-200 dark:bg-slate-700 h-1.5 sm:h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Step: Saving State */}
        {currentStep === 'saving' && (
          <ImportSaveProgress step={saveStep} message={saveMessage} />
        )}

        {/* Step: Upload DropZone */}
        {currentStep === 'upload' && (
          <ImportDropZone
            onFileSelect={handleFileSelect}
            onFilesSelect={handleFilesSelect}
            isProcessing={isProcessing}
          />
        )}

        {/* Step: Review and Edit Form */}
        {(currentStep === 'review' || (currentStep === 'saving' && extractedResult)) && extractedResult && (
          <div className="space-y-3 sm:space-y-5 animate-fade-in">
            {/* Batch Quarantine Table & Controls (When multiple items exist) */}
            {isBatchMode && (
              <BatchQuarantineReview
                batchItems={batchItems}
                activeIndex={activeBatchIndex}
                onSelectIndex={handleSelectBatchIndex}
                onRemoveItem={handleRemoveBatchItem}
                onSaveAll={handleSaveAll}
                isSaving={isSaving}
              />
            )}

            <div className="flex items-center justify-between pt-0.5 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  {extractedResult.assetType.toUpperCase()}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                  {extractedResult.documentType.replace(/_/g, ' ').toUpperCase()}
                </span>
                {extractedResult.disambiguation && (
                  <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" title={extractedResult.disambiguation.details}>
                    👤 {extractedResult.disambiguation.memberLabel}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={resetAllState}
                disabled={isSaving}
                aria-label="Upload different document"
                className="text-[11px] sm:text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <ArrowLeft size={12} />
                Upload different file(s)
              </button>
            </div>

            {/* Side-by-Side Layout for Desktop / Stacked for Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
              {/* Document Thumbnail Preview */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 bg-slate-50 dark:bg-slate-900/40 flex flex-col items-center justify-center min-h-[70px] sm:min-h-[140px] md:min-h-[220px]">
                {filePreview ? (
                  <img
                    src={filePreview}
                    alt="Document scan"
                    className="max-h-36 sm:max-h-60 md:max-h-72 object-contain rounded-xl shadow-xs border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="text-center p-2 sm:p-6 space-y-1 sm:space-y-2 flex sm:flex-col items-center gap-2.5 sm:gap-0">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mx-auto flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0">
                      PDF
                    </div>
                    <div className="text-left sm:text-center">
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[180px] sm:max-w-[200px]">
                        {file?.name}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-400">
                        {((file?.size || 0) / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Fields Review */}
              <div className="max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-1">
                <ImportReviewForm
                  assetType={extractedResult.assetType}
                  formData={formData}
                  extractedResult={extractedResult}
                  duplicateMatch={duplicateMatch}
                  targetPortfolio={targetPortfolio}
                  portfolioOptions={portfolioOptions}
                  onFormChange={setFormData}
                  onTargetPortfolioChange={setTargetPortfolio}
                  onDismissDuplicate={dismissDuplicate}
                  liveGoldRate={currentLiveGoldRate}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="ghost"
                onClick={handleCloseModal}
                disabled={isSaving}
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                {isBatchMode && (
                  <Button
                    variant="secondary"
                    onClick={handleSaveAll}
                    isLoading={isSaving}
                    disabled={isSaving}
                    className="text-xs font-bold"
                  >
                    <CheckCircle2 size={13} className="mr-1" />
                    Save All ({batchItems.filter((i) => i.status === 'ready').length})
                  </Button>
                )}

                <Button
                  variant="primary"
                  onClick={handleSave}
                  isLoading={isSaving}
                  disabled={isSaving}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  <Sparkles size={14} className="mr-1.5" />
                  {isBatchMode ? 'Save This Item' : 'Confirm & Save to Portfolio'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SmartImportModal;

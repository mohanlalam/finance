import React, { useState } from 'react';
import Modal from './Modal';
import { Button } from './ui/Button';
import { Sparkles, AlertCircle, RefreshCw, Key, ArrowLeft } from './icons/AppIcons';
import { usePortfolioActions, usePortfolioEntities } from '../contexts/PortfolioContext';
import { useToastActions } from '../contexts/ToastContext';
import { getGeminiApiKey, setStoredGeminiApiKey } from '../utils/aiDocumentExtractor';
import { useSmartImportPipeline } from '../domains/smart-import/hooks/useSmartImportPipeline';
import { ImportDropZone } from './smart-import/ImportDropZone';
import { ImportReviewForm } from './smart-import/ImportReviewForm';
import { ImportSaveProgress } from './smart-import/ImportSaveProgress';

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartImportModal: React.FC<SmartImportModalProps> = ({ isOpen, onClose }) => {
  const { activePortfolio, portfolios } = usePortfolioEntities();
  const { addAsset, load } = usePortfolioActions();
  const { addToast } = useToastActions();

  // API Key management modal state
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');

  const {
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
    duplicateMatch,
    dismissDuplicate,
    saveStep,
    saveMessage,
    currentLiveGoldRate,
    handleFileSelect,
    handleSave,
    resetAllState,
  } = useSmartImportPipeline({
    isOpen,
    onClose,
    activePortfolio: activePortfolio?.name || 'Personal',
    portfolios,
    addAsset,
    loadPortfolios: load,
    showToast: addToast,
  });

  const portfolioOptions = portfolios.map((p) => ({
    name: p.name,
    label: p.label || p.name,
  }));

  const handleSaveApiKey = () => {
    if (customApiKey.trim()) {
      setStoredGeminiApiKey(customApiKey.trim());
      setShowApiKeyModal(false);
      addToast('Custom Gemini API Key saved!', 'success');
    }
  };

  const isSaving = saveStep !== 'IDLE' && saveStep !== 'SUCCESS' && saveStep !== 'ERROR';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (!isSaving) {
            resetAllState();
            onClose();
          }
        }}
        title="✨ Smart AI Document Import"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-5">
          {/* Header Description & API Key Settings */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                AI Quarantine & Review Pipeline
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Upload your financial document. Review and verify extracted fields before saving to your portfolio.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCustomApiKey(getGeminiApiKey());
                setShowApiKeyModal(true);
              }}
              title="Configure Gemini API Key"
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
            >
              <Key size={16} />
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-start gap-2.5 text-rose-700 dark:text-rose-400 animate-slide-up">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <span className="font-bold">Extraction Error: </span>
                {error}
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-4 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-600 mx-auto flex items-center justify-center animate-spin">
                <RefreshCw size={24} />
              </div>
              <div>
                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Analyzing Document with Multi-Model Gemini Vision
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {processingStatus}
                </p>
              </div>
              <div className="w-48 mx-auto bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Save Progress State */}
          {saveStep !== 'IDLE' && (
            <ImportSaveProgress step={saveStep} message={saveMessage} />
          )}

          {/* Step 1: Upload DropZone */}
          {!extractedResult && !isProcessing && (
            <ImportDropZone
              onFileSelect={handleFileSelect}
              isProcessing={isProcessing}
            />
          )}

          {/* Step 2: Side-by-Side Review and Edit Form */}
          {extractedResult && !isProcessing && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    {extractedResult.assetType.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {extractedResult.documentType.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={resetAllState}
                  disabled={isSaving}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={13} />
                  Choose another file
                </button>
              </div>

              {/* Side-by-Side Layout for Desktop / Stacked for Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Document Thumbnail Preview */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/40 flex flex-col items-center justify-center min-h-[220px]">
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="Document scan"
                      className="max-h-72 object-contain rounded-xl shadow-md border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mx-auto flex items-center justify-center font-bold text-xs">
                        PDF
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                        {file?.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {((file?.size || 0) / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  )}
                </div>

                {/* Form Fields Review */}
                <div className="max-h-[60vh] overflow-y-auto pr-1">
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
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  variant="ghost"
                  onClick={() => {
                    resetAllState();
                    onClose();
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  isLoading={isSaving}
                  disabled={isSaving}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  <Sparkles size={14} className="mr-1.5" />
                  Confirm & Save to Portfolio
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Manual API Key Modal */}
      {showApiKeyModal && (
        <Modal
          isOpen={showApiKeyModal}
          onClose={() => setShowApiKeyModal(false)}
          title="🔑 Gemini API Key Settings"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Enter your personal Google AI Gemini API key to enable document scanning and AI assistance.
            </p>
            <input
              type="password"
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowApiKeyModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveApiKey}>
                Save Key
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default SmartImportModal;

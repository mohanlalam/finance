import React, { useRef } from 'react';
import { Upload, Camera } from '../icons/AppIcons';

interface ImportDropZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  onOpenManualApiKeyModal?: () => void;
}

export const ImportDropZone: React.FC<ImportDropZoneProps> = ({
  onFileSelect,
  isProcessing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      onFileSelect(droppedFile);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500/60 dark:hover:border-amber-500/60 rounded-2xl p-8 text-center transition-all bg-slate-50/50 dark:bg-slate-900/30 group"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleChange}
        disabled={isProcessing}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
        disabled={isProcessing}
      />

      <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Upload size={28} />
      </div>

      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
        Upload Investment Document
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
        Drop your Fixed Deposit advice, Gold bill, Mutual Fund statement, or Insurance receipt (PDF, JPG, PNG)
      </p>

      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="px-4 py-2 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)]/80 text-xs font-bold text-[var(--text-primary)] border border-[var(--border-subtle)] transition-all cursor-pointer ios-press"
        >
          Browse Files
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isProcessing}
          className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer ios-press"
        >
          <Camera size={14} />
          Scan with Camera
        </button>
      </div>
    </div>
  );
};

import React, { useRef } from 'react';
import { Upload, Camera, Sparkles, FolderOpen } from '../icons/AppIcons';

interface ImportDropZoneProps {
  onFileSelect: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  isProcessing: boolean;
  onOpenManualApiKeyModal?: () => void;
}

export const ImportDropZone: React.FC<ImportDropZoneProps> = ({
  onFileSelect,
  onFilesSelect,
  isProcessing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || isProcessing) return;
    const fileArray = Array.from(files);
    if (fileArray.length > 1 && onFilesSelect) {
      onFilesSelect(fileArray);
    } else if (fileArray.length === 1 && onFilesSelect) {
      onFilesSelect(fileArray);
    } else {
      onFileSelect(fileArray[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500/60 dark:hover:border-amber-500/60 rounded-2xl p-4 sm:p-6 md:p-8 text-center transition-all bg-slate-50/50 dark:bg-slate-900/30 group relative overflow-hidden"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
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

      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-2 sm:mb-3.5 group-hover:scale-105 transition-transform">
        <Upload size={20} className="sm:hidden" />
        <Upload size={26} className="hidden sm:block" />
      </div>

      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] sm:text-[10px] font-bold tracking-wide uppercase mb-1.5 sm:mb-2">
        <Sparkles size={10} />
        Multi-Document Batch Supported
      </div>

      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
        Drop Statements or Receipts
      </h4>
      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 max-w-sm sm:max-w-md mx-auto leading-snug sm:leading-relaxed">
        Upload Zerodha CAS, FD advice, RD slip, Gold bill, or Insurance policies. AI automatically assigns to Rammohan, Padmavathi, or Sai Laxmi.
      </p>

      <div className="mt-3.5 sm:mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-secondary)]/80 text-xs font-bold text-[var(--text-primary)] border border-[var(--border-subtle)] transition-all cursor-pointer ios-press flex items-center justify-center gap-1.5"
        >
          <FolderOpen size={14} />
          Browse Files (Single or Batch)
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isProcessing}
          className="px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer ios-press"
        >
          <Camera size={14} />
          Scan with Camera
        </button>
      </div>
    </div>
  );
};

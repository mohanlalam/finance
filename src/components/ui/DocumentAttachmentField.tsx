import React, { useId, useState } from 'react';
import { FileText, Upload, X, Trash2, Paperclip, ExternalLink, Calendar, Plus } from '../icons/AppIcons';
import { DocumentMetadata } from '../../types/portfolio';
import { getDocumentUrl } from '../../utils/formatters';

export interface PendingDocument {
  id: string;
  file: File;
  name: string;
  expiryDate?: string;
}

interface DocumentAttachmentFieldProps {
  files: PendingDocument[];
  onFilesChange: (files: PendingDocument[]) => void;
  showExpiryDate?: boolean;
  expiryDateLabel?: string;
  existingDocuments?: DocumentMetadata[];
  onDeleteExistingDoc?: (docId: string) => Promise<void>;
  assetTypeLabel?: string;
  hintText?: string;
}

export function DocumentAttachmentField({
  files,
  onFilesChange,
  showExpiryDate = true,
  expiryDateLabel = 'Document Expiry / Renewal Date (optional)',
  existingDocuments = [],
  onDeleteExistingDoc,
  assetTypeLabel = 'asset',
  hintText = 'Upload receipts, certificates, deeds, or policy bonds (PDF, JPG, PNG, DOCX, XLSX up to 10MB)',
}: DocumentAttachmentFieldProps) {
  const inputId = useId();
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const addFiles = (newFileList: FileList | File[]) => {
    const newDocs: PendingDocument[] = Array.from(newFileList).map((file, idx) => ({
      id: `pending-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      name: file.name.replace(/\.[^/.]+$/, ''), // Default name without file extension for clean display
      expiryDate: '',
    }));
    onFilesChange([...files, ...newDocs]);
  };

  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleRemovePendingFile = (id: string) => {
    onFilesChange(files.filter((d) => d.id !== id));
  };

  const handleUpdatePendingName = (id: string, name: string) => {
    onFilesChange(files.map((d) => (d.id === id ? { ...d, name } : d)));
  };

  const handleUpdatePendingExpiry = (id: string, expiryDate: string) => {
    onFilesChange(files.map((d) => (d.id === id ? { ...d, expiryDate } : d)));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
          <Paperclip size={13} className="text-[var(--accent-blue)]" />
          <span>Supporting Documents</span>
        </label>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--surface-secondary)] text-[var(--text-tertiary)]">
          {files.length > 0 ? `${files.length} selected` : 'Optional'}
        </span>
      </div>

      {/* Existing Attached Documents */}
      {existingDocuments.length > 0 && (
        <div className="space-y-1.5 mb-2">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
            Attached to this {assetTypeLabel} ({existingDocuments.length}):
          </span>
          <div className="space-y-1">
            {existingDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2.5 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-xs shadow-xs"
              >
                <a
                  href={getDocumentUrl(doc.file_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[var(--accent-blue)] hover:underline font-medium truncate max-w-[80%]"
                  title="Open document"
                >
                  <FileText size={14} className="shrink-0 text-[var(--accent-blue)]" />
                  <span className="truncate">{doc.name}</span>
                  <ExternalLink size={11} className="shrink-0 opacity-70" />
                </a>
                {onDeleteExistingDoc && (
                  <button
                    type="button"
                    onClick={() => onDeleteExistingDoc(doc.id)}
                    className="text-[var(--text-tertiary)] hover:text-[var(--negative)] p-1 rounded hover:bg-[var(--surface)] transition-colors cursor-pointer"
                    title="Delete document"
                    aria-label={`Delete ${doc.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Files to Upload */}
      {files.length > 0 && (
        <div className="space-y-2.5">
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">New Documents to Attach:</span>
          {files.map((doc, idx) => (
            <div
              key={doc.id}
              className="space-y-2.5 p-3 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] shadow-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-[var(--radius-small)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] flex items-center justify-center shrink-0 text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-xs" title={doc.file.name}>
                      {doc.file.name}
                    </p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">
                      {formatFileSize(doc.file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePendingFile(doc.id)}
                  className="w-6 h-6 rounded-full hover:bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-[var(--negative)] flex items-center justify-center transition-colors cursor-pointer"
                  title="Remove this file"
                  aria-label="Remove document"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Editable Label */}
              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Document Label / Description
                </label>
                <input
                  type="text"
                  value={doc.name}
                  onChange={(e) => handleUpdatePendingName(doc.id, e.target.value)}
                  placeholder="e.g. Purchase Invoice / Hallmark Certificate / Deed"
                  className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-small)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
                />
              </div>

              {/* Optional Expiry Date */}
              {showExpiryDate && (
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar size={10} />
                    <span>{expiryDateLabel}</span>
                  </label>
                  <input
                    type="date"
                    value={doc.expiryDate || ''}
                    onChange={(e) => handleUpdatePendingExpiry(doc.id, e.target.value)}
                    className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-small)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hidden File Input - Native HTML label trigger guarantees 100% mobile compatibility */}
      <input
        id={inputId}
        type="file"
        multiple
        onChange={handleSelectFiles}
        accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.csv"
        className="sr-only"
      />

      {/* Upload Dropzone / Add Trigger */}
      <label
        htmlFor={inputId}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full flex ${
          files.length > 0 ? 'flex-row py-2.5 px-3.5 gap-2' : 'flex-col py-4 px-4 gap-1.5'
        } items-center justify-center border-2 border-dashed rounded-[var(--radius-medium)] text-xs transition-all cursor-pointer select-none active:scale-[0.99] ${
          isDraggingOver
            ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]'
            : 'border-[var(--border-subtle)] hover:border-[var(--accent-blue)] bg-[var(--surface-secondary)] hover:bg-[var(--accent-blue-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)]'
        }`}
      >
        {files.length === 0 ? (
          <>
            <div className="w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-blue)] shadow-xs pointer-events-none">
              <Upload size={14} />
            </div>
            <p className="font-semibold text-center pointer-events-none">
              <span className="text-[var(--accent-blue)] underline">Click to upload</span> or drag &amp; drop files
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)] text-center pointer-events-none">{hintText}</p>
          </>
        ) : (
          <>
            <Plus size={14} className="text-[var(--accent-blue)]" />
            <span className="font-semibold text-[var(--accent-blue)]">Attach Another Document</span>
          </>
        )}
      </label>
    </div>
  );
}

export default DocumentAttachmentField;

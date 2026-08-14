import React, { useRef, useState } from 'react';
import { FileText, Upload, X, Trash2, Paperclip, ExternalLink, Calendar } from '../icons/AppIcons';
import { DocumentMetadata } from '../../types/portfolio';
import { getDocumentUrl } from '../../utils/formatters';

interface DocumentAttachmentFieldProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  documentName?: string;
  onDocumentNameChange?: (name: string) => void;
  expiryDate?: string;
  onExpiryDateChange?: (date: string) => void;
  showExpiryDate?: boolean;
  expiryDateLabel?: string;
  existingDocuments?: DocumentMetadata[];
  onDeleteExistingDoc?: (docId: string) => Promise<void>;
  assetTypeLabel?: string;
  hintText?: string;
}

export function DocumentAttachmentField({
  file,
  onFileChange,
  documentName = '',
  onDocumentNameChange,
  expiryDate = '',
  onExpiryDateChange,
  showExpiryDate = true,
  expiryDateLabel = 'Document Expiry / Renewal Date (optional)',
  existingDocuments = [],
  onDeleteExistingDoc,
  assetTypeLabel = 'asset',
  hintText = 'Upload receipt, certificate, deed, or policy bond (PDF, JPG, PNG, DOCX, XLSX up to 10MB)',
}: DocumentAttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    onFileChange(selected);
    if (onDocumentNameChange && !documentName) {
      onDocumentNameChange(selected.name);
    }
    if (inputRef.current) inputRef.current.value = '';
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
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      onFileChange(droppedFile);
      if (onDocumentNameChange && !documentName) {
        onDocumentNameChange(droppedFile.name);
      }
    }
  };

  const handleRemoveFile = () => {
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = '';
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
          <span>Supporting Document</span>
        </label>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--surface-secondary)] text-[var(--text-tertiary)]">Optional</span>
      </div>

      {/* Existing Attached Documents */}
      {existingDocuments.length > 0 && (
        <div className="space-y-1.5 mb-2">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)]">Attached to this {assetTypeLabel}:</span>
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
                    className="text-[var(--text-tertiary)] hover:text-[var(--negative)] p-1 rounded hover:bg-[var(--surface)] transition-colors"
                    title="Delete document"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Upload Trigger or Selected File View */}
      {!file ? (
        <div>
          <input
            ref={inputRef}
            type="file"
            onChange={handleSelectFile}
            accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.csv"
            className="hidden"
            id="supporting-doc-input"
          />
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`w-full flex flex-col items-center justify-center gap-1.5 py-3.5 px-4 border-2 border-dashed rounded-[var(--radius-medium)] text-xs transition-all cursor-pointer ${
              isDraggingOver
                ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]'
                : 'border-[var(--border-subtle)] hover:border-[var(--accent-blue)] bg-[var(--surface-secondary)] hover:bg-[var(--accent-blue-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)]'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-blue)] shadow-xs">
              <Upload size={14} />
            </div>
            <p className="font-medium">
              <span className="text-[var(--accent-blue)] underline">Click to upload</span> or drag & drop
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)] text-center">{hintText}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 p-3.5 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-[var(--radius-small)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] flex items-center justify-center shrink-0">
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[220px]">
                  {file.name}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="w-6 h-6 rounded-full hover:bg-[var(--surface)] text-[var(--text-tertiary)] hover:text-[var(--negative)] flex items-center justify-center transition-colors"
              title="Remove file"
            >
              <X size={14} />
            </button>
          </div>

          {/* Optional Name Override */}
          {onDocumentNameChange && (
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                Document Label
              </label>
              <input
                type="text"
                value={documentName}
                onChange={(e) => onDocumentNameChange(e.target.value)}
                placeholder="e.g. Title Deed / Purchase Invoice / Policy Bond"
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-small)] px-3 py-1.5 text-xs text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
              />
            </div>
          )}

          {/* Optional Expiry Date */}
          {showExpiryDate && onExpiryDateChange && (
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                <Calendar size={11} className="text-[var(--text-tertiary)]" />
                <span>{expiryDateLabel}</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => onExpiryDateChange(e.target.value)}
                className="w-full border border-[var(--border-subtle)] rounded-[var(--radius-small)] px-3 py-1.5 text-xs text-[var(--text-primary)] bg-[var(--surface)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

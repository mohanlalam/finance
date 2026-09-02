/**
 * supabaseStorage.ts — Backward-compatible facade for Document Storage operations.
 * Delegates to the clean architectural domain service (DocumentStorageService).
 */

import { documentStorageService } from '../domains/portfolio/services/documentStorageService';
import { StorageUploadResult } from '../domains/portfolio/repositories/IDocumentStorageRepository';

export type { StorageUploadResult };

export function generateDocumentStoragePath(
  portfolio: string,
  folder: string,
  fileName: string
): string {
  return documentStorageService.generateStoragePath(
    portfolio,
    folder,
    fileName
  );
}

export async function getDocumentSignedUrl(filePath: string): Promise<string> {
  return documentStorageService.getDocumentSignedUrl(filePath);
}

export async function openSecureDocument(filePath: string): Promise<void> {
  return documentStorageService.openSecureDocument(filePath);
}

export async function uploadDocumentFile(
  bucket: string,
  storagePath: string,
  file: File | Blob
): Promise<StorageUploadResult> {
  return documentStorageService.uploadDocument(
    bucket,
    storagePath,
    file
  );
}

export async function removeDocumentFiles(
  bucket: string,
  paths: string[]
): Promise<void> {
  return documentStorageService.removeDocuments(bucket, paths);
}

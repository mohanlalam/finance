/**
 * supabaseStorage.ts — Backward-compatible facade for Document Storage operations.
 * Delegates to the clean architectural repository (SupabaseDocumentStorageRepository)
 * and domain service (DocumentStorageService).
 */

import {
  supabaseDocumentStorageRepository,
} from '../infrastructure/supabase/repositories/SupabaseDocumentStorageRepository';
import {
  StorageUploadResult,
} from '../domains/portfolio/repositories/IDocumentStorageRepository';

export type { StorageUploadResult };

export function generateDocumentStoragePath(
  portfolio: string,
  folder: string,
  fileName: string
): string {
  return supabaseDocumentStorageRepository.generateDocumentStoragePath(
    portfolio,
    folder,
    fileName
  );
}

export async function getDocumentSignedUrl(filePath: string): Promise<string> {
  return supabaseDocumentStorageRepository.getDocumentSignedUrl(filePath);
}

export async function openSecureDocument(filePath: string): Promise<void> {
  return supabaseDocumentStorageRepository.openSecureDocument(filePath);
}

export async function uploadDocumentFile(
  bucket: string,
  storagePath: string,
  file: File | Blob
): Promise<StorageUploadResult> {
  return supabaseDocumentStorageRepository.uploadDocumentFile(
    bucket,
    storagePath,
    file
  );
}

export async function removeDocumentFiles(
  bucket: string,
  paths: string[]
): Promise<void> {
  return supabaseDocumentStorageRepository.removeDocumentFiles(bucket, paths);
}

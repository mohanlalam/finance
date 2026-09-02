import { useCallback } from 'react';
import { documentStorageService } from '../services/documentStorageService';
import { StorageUploadResult } from '../repositories/IDocumentStorageRepository';

export function useDocumentStorage() {
  const generateStoragePath = useCallback(
    (portfolio: string, folder: string, fileName: string): string => {
      return documentStorageService.generateStoragePath(portfolio, folder, fileName);
    },
    []
  );

  const getSignedUrl = useCallback(async (filePath: string): Promise<string> => {
    return documentStorageService.getDocumentSignedUrl(filePath);
  }, []);

  const openDocument = useCallback(async (filePath: string): Promise<void> => {
    return documentStorageService.openSecureDocument(filePath);
  }, []);

  const uploadFile = useCallback(
    async (
      bucket: string,
      storagePath: string,
      file: File | Blob
    ): Promise<StorageUploadResult> => {
      return documentStorageService.uploadDocument(bucket, storagePath, file);
    },
    []
  );

  const removeFiles = useCallback(
    async (bucket: string, paths: string[]): Promise<void> => {
      return documentStorageService.removeDocuments(bucket, paths);
    },
    []
  );

  return {
    generateStoragePath,
    getSignedUrl,
    openDocument,
    uploadFile,
    removeFiles,
  };
}

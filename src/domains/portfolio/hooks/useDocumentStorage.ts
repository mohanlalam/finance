import { useCallback } from 'react';
import { documentStorageService } from '../services/documentStorageService';
import { StorageUploadResult } from '../repositories/IDocumentStorageRepository';
import { isReauthRequired, updateLastAuthTime } from '../../../utils/sessionStore';
import { isBiometricsEnrolled, authenticateWithBiometrics } from '../../../utils/biometrics';

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
    // Enforce automated biometric re-authentication after 15 minutes of inactivity
    if (isReauthRequired(15 * 60 * 1000)) {
      if (isBiometricsEnrolled()) {
        const pinHash = await authenticateWithBiometrics();
        if (!pinHash) {
          throw new Error('Biometric re-authentication required to view confidential document');
        }
      }
      updateLastAuthTime();
    } else {
      updateLastAuthTime();
    }

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

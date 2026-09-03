import {
  IDocumentStorageRepository,
  StorageUploadResult,
} from '../repositories/IDocumentStorageRepository';
import { supabaseDocumentStorageRepository } from '../../../infrastructure/supabase/repositories/SupabaseDocumentStorageRepository';
import { isDocumentCryptoSupported } from '../../../utils/documentCrypto';

export class DocumentStorageService {
  private repository: IDocumentStorageRepository;

  constructor(repository: IDocumentStorageRepository = supabaseDocumentStorageRepository) {
    this.repository = repository;
  }

  isZeroKnowledgeSupported(): boolean {
    return isDocumentCryptoSupported();
  }

  generateStoragePath(portfolio: string, folder: string, fileName: string): string {
    return this.repository.generateDocumentStoragePath(portfolio, folder, fileName);
  }

  async getDocumentSignedUrl(filePath: string): Promise<string> {
    return this.repository.getDocumentSignedUrl(filePath);
  }

  async openSecureDocument(filePath: string): Promise<void> {
    return this.repository.openSecureDocument(filePath);
  }

  async uploadDocument(
    bucket: string,
    storagePath: string,
    file: File | Blob
  ): Promise<StorageUploadResult> {
    return this.repository.uploadDocumentFile(bucket, storagePath, file);
  }

  async removeDocuments(bucket: string, paths: string[]): Promise<void> {
    return this.repository.removeDocumentFiles(bucket, paths);
  }
}

export const documentStorageService = new DocumentStorageService();

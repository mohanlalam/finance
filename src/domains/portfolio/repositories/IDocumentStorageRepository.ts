export interface StorageUploadResult {
  path: string;
}

export interface IDocumentStorageRepository {
  /**
   * Generates a clean, collision-resistant storage path for document uploads.
   */
  generateDocumentStoragePath(
    portfolio: string,
    folder: string,
    fileName: string
  ): string;

  /**
   * Retrieves a short-lived PIN-authenticated signed URL for viewing/downloading a document.
   */
  getDocumentSignedUrl(filePath: string): Promise<string>;

  /**
   * Securely opens a document in a new browser tab using a PIN-authenticated signed URL.
   */
  openSecureDocument(filePath: string): Promise<void>;

  /**
   * Uploads a file to private document storage via authenticated Edge Function.
   */
  uploadDocumentFile(
    bucket: string,
    storagePath: string,
    file: File | Blob
  ): Promise<StorageUploadResult>;

  /**
   * Deletes one or more files from private document storage.
   */
  removeDocumentFiles(bucket: string, paths: string[]): Promise<void>;
}

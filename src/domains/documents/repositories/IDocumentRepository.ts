import { DocumentMetadata, DocumentPayload } from '../../../types/portfolio';

export interface IDocumentRepository {
  getAll(portfolioId: string): Promise<DocumentMetadata[]>;
  getById(id: string): Promise<DocumentMetadata | null>;
  create(portfolioName: string, payload: DocumentPayload): Promise<{ id?: string } | undefined>;
  update(id: string, payload: Partial<DocumentPayload>): Promise<void>;
  delete(id: string): Promise<void>;
  uploadFile(file: File, path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
}

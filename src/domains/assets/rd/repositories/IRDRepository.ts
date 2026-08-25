import { RDAccount, RDPayload } from '../../../../types/portfolio';

export interface IRDRepository {
  getAll(portfolioId: string): Promise<RDAccount[]>;
  getById(id: string): Promise<RDAccount | null>;
  create(portfolioName: string, payload: RDPayload): Promise<{ id?: string } | undefined>;
  update(id: string, payload: Partial<RDPayload>): Promise<void>;
  delete(id: string): Promise<void>;
}

import { SIPAccount, SIPPayload } from '../../../../types/portfolio';

export interface ISIPRepository {
  getAll(portfolioId: string): Promise<SIPAccount[]>;
  getById(id: string): Promise<SIPAccount | null>;
  create(portfolioName: string, payload: SIPPayload): Promise<{ id?: string } | undefined>;
  update(id: string, payload: Partial<SIPPayload>): Promise<void>;
  delete(id: string): Promise<void>;
}

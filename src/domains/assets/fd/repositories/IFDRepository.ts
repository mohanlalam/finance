import { FixedDeposit, FDPayload } from '../../../../types/portfolio';

export interface IFDRepository {
  getAll(portfolioId: string): Promise<FixedDeposit[]>;
  getById(id: string): Promise<FixedDeposit | null>;
  create(portfolioName: string, payload: FDPayload): Promise<{ id?: string } | undefined>;
  update(id: string, payload: Partial<FDPayload>): Promise<void>;
  delete(id: string): Promise<void>;
}

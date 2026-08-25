import { GoldHolding, GoldPayload } from '../../../../types/portfolio';

export interface IGoldRepository {
  getAll(portfolioId: string): Promise<GoldHolding[]>;
  getById(id: string): Promise<GoldHolding | null>;
  create(portfolioName: string, payload: GoldPayload): Promise<{ id?: string } | undefined>;
  update(id: string, payload: Partial<GoldPayload>): Promise<void>;
  delete(id: string): Promise<void>;
}

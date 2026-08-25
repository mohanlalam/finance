import { RealEstate, RealEstatePayload } from '../../../../types/portfolio';

export interface IRealEstateRepository {
  getAll(portfolioId: string): Promise<RealEstate[]>;
  getById(id: string): Promise<RealEstate | null>;
  create(portfolioName: string, payload: RealEstatePayload): Promise<{ id?: string } | undefined>;
  update(id: string, payload: Partial<RealEstatePayload>): Promise<void>;
  delete(id: string): Promise<void>;
}

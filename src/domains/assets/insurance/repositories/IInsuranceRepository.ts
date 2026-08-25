import { Insurance, InsurancePayload } from '../../../../types/portfolio';

export interface IInsuranceRepository {
  getAll(portfolioId: string): Promise<Insurance[]>;
  getById(id: string): Promise<Insurance | null>;
  create(portfolioName: string, payload: InsurancePayload): Promise<{ id?: string } | undefined>;
  update(id: string, payload: Partial<InsurancePayload>): Promise<void>;
  delete(id: string): Promise<void>;
}

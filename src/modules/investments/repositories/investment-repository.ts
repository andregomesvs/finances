import type { Investment } from "../domain/investment";

export interface InvestmentRepository {
  list(userId: string): Promise<Investment[]>;
  findById(id: string, userId: string): Promise<Investment | null>;
  save(investment: Investment): Promise<void>;
  saveMany(investments: Investment[]): Promise<void>;
  softDelete(id: string, userId: string, deletedAt: Date): Promise<void>;
}

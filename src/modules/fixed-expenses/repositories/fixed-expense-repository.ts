import type { FixedExpense } from "../domain/fixed-expense";

export interface FixedExpenseRepository {
  list(userId: string): Promise<FixedExpense[]>;
  findById(id: string, userId: string): Promise<FixedExpense | null>;
  save(expense: FixedExpense): Promise<void>;
  softDelete(id: string, userId: string, deletedAt: Date): Promise<void>;
}

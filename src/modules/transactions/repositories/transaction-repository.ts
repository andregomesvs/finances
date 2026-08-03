import type { Transaction } from "../domain/transaction";

export interface TransactionRepository {
  findById(id: string, userId: string): Promise<Transaction | null>;
  listByPeriod(userId: string, from: Date, to: Date): Promise<Transaction[]>;
  save(transaction: Transaction): Promise<void>;
}

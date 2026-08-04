import type { Transaction } from "../domain/transaction";

export interface TransactionRepository {
  findById(id: string, userId: string): Promise<Transaction | null>;
  listByPeriod(userId: string, from: Date, to: Date): Promise<Transaction[]>;
  listRecent(userId: string, limit: number): Promise<Transaction[]>;
  listLatestCreated(userId: string, limit: number): Promise<Transaction[]>;
  findByInstallmentGroup(userId: string, groupId: string): Promise<Transaction[]>;
  save(transaction: Transaction): Promise<void>;
  saveMany(transactions: Transaction[]): Promise<void>;
  softDelete(id: string, userId: string, deletedAt: Date): Promise<void>;
  softDeleteMany(ids: string[], userId: string, deletedAt: Date): Promise<void>;
  replaceMany(idsToDelete: string[], replacements: Transaction[], deletedAt: Date): Promise<void>;
}

import type { TransactionRepository } from "@/modules/transactions/repositories/transaction-repository";
import type { CardExpenseInput } from "../schemas/card-expense-schema";
import { buildCardExpenseTransactions } from "./build-card-expense-transactions";

export class CardExpenseNotFoundError extends Error {
  constructor() { super("Compra não encontrada."); }
}

export class UpdateCardExpenseService {
  constructor(private readonly transactions: TransactionRepository) {}
  async execute(groupId: string, userId: string, input: CardExpenseInput): Promise<void> {
    const existing = await this.transactions.findByInstallmentGroup(userId, groupId);
    if (existing.length === 0) throw new CardExpenseNotFoundError();
    const createdAt = existing.reduce((earliest, item) => item.createdAt < earliest ? item.createdAt : earliest, existing[0]!.createdAt);
    const replacements = buildCardExpenseTransactions(userId, input, groupId, createdAt);
    await this.transactions.replaceMany(existing.map((item) => item.id), replacements, new Date());
  }
}

export class DeleteCardExpenseService {
  constructor(private readonly transactions: TransactionRepository) {}
  async execute(groupId: string, userId: string): Promise<void> {
    const existing = await this.transactions.findByInstallmentGroup(userId, groupId);
    if (existing.length === 0) throw new CardExpenseNotFoundError();
    await this.transactions.softDeleteMany(existing.map((item) => item.id), userId, new Date());
  }
}

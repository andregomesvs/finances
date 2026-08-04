import type { TransactionRepository } from "@/modules/transactions/repositories/transaction-repository";
import type { CardExpenseInput } from "../schemas/card-expense-schema";
import { buildCardExpenseTransactions } from "./build-card-expense-transactions";

export class CreateCardExpenseService {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(userId: string, input: CardExpenseInput) {
    const installments = buildCardExpenseTransactions(userId, input);

    await this.transactions.saveMany(installments);
    return installments;
  }
}

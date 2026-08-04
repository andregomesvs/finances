import type { TransactionRepository } from "@/modules/transactions/repositories/transaction-repository";
import { IncomeNotFoundError } from "./income-not-found-error";

export class DeleteIncomeService {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    const existing = await this.transactions.findById(id, userId);
    if (!existing || existing.type !== "INCOME") throw new IncomeNotFoundError();

    await this.transactions.softDelete(id, userId, new Date());
  }
}

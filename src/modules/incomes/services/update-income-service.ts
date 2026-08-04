import type { Transaction } from "@/modules/transactions/domain/transaction";
import type { TransactionRepository } from "@/modules/transactions/repositories/transaction-repository";
import type { IncomeInput } from "../schemas/income-schema";
import { IncomeNotFoundError } from "./income-not-found-error";

export class UpdateIncomeService {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(id: string, userId: string, input: IncomeInput): Promise<Transaction> {
    const existing = await this.transactions.findById(id, userId);
    if (!existing || existing.type !== "INCOME") throw new IncomeNotFoundError();

    const updated: Transaction = {
      ...existing,
      categoryId: input.categoryId,
      amountInCents: BigInt(input.amountInCents),
      description: input.description,
      occurredAt: new Date(`${input.occurredAt}T12:00:00.000Z`),
      updatedAt: new Date(),
    };

    await this.transactions.save(updated);
    return updated;
  }
}

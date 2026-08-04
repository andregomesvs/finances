import type { Transaction } from "@/modules/transactions/domain/transaction";
import type { TransactionRepository } from "@/modules/transactions/repositories/transaction-repository";
import type { IncomeInput } from "../schemas/income-schema";

export class CreateIncomesService {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(userId: string, inputs: IncomeInput[]): Promise<Transaction[]> {
    const now = new Date();
    const entries = inputs.map<Transaction>((input) => ({
      id: crypto.randomUUID(),
      userId,
      accountId: null,
      categoryId: input.categoryId,
      type: "INCOME",
      amountInCents: BigInt(input.amountInCents),
      description: input.description,
      occurredAt: new Date(`${input.occurredAt}T12:00:00.000Z`),
      createdAt: now,
      updatedAt: now,
    }));

    await this.transactions.saveMany(entries);
    return entries;
  }
}

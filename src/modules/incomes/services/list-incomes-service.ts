import type { TransactionRepository } from "@/modules/transactions/repositories/transaction-repository";
import { getIncomeCategoryLabel } from "../domain/income-category";
import type { IncomeCategory } from "../domain/income-category";

export interface IncomeListItem {
  id: string;
  description: string;
  categoryId: IncomeCategory;
  category: string;
  amountInCents: string;
  occurredAt: string;
}

export class ListIncomesService {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(userId: string): Promise<IncomeListItem[]> {
    const recent = await this.transactions.listRecent(userId, 100);

    return recent
      .filter((transaction) => transaction.type === "INCOME")
      .map((transaction) => ({
        id: transaction.id,
        description: transaction.description,
        categoryId: (transaction.categoryId ?? "other") as IncomeCategory,
        category: getIncomeCategoryLabel(transaction.categoryId),
        amountInCents: transaction.amountInCents.toString(),
        occurredAt: transaction.occurredAt.toISOString(),
      }));
  }
}

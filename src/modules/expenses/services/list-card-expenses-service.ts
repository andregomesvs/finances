import type { TransactionRepository } from "@/modules/transactions/repositories/transaction-repository";
import type { ExpenseCategory } from "../domain/expense-category";
import { getExpenseCategoryLabel } from "../domain/expense-category";

export interface CardExpenseListItem {
  id: string;
  description: string;
  categoryId: ExpenseCategory;
  category: string;
  creditCardName: string;
  amountInCents: string;
  originalAmountInCents: string;
  dueDate: string;
  installmentGroupId: string;
  installmentNumber: number;
  installmentCount: number;
}

export class ListCardExpensesService {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(userId: string): Promise<CardExpenseListItem[]> {
    const transactions = await this.transactions.listByPeriod(
      userId,
      new Date("2000-01-01T00:00:00.000Z"),
      new Date("2100-01-01T00:00:00.000Z"),
    );

    return transactions
      .filter((transaction) => transaction.type === "EXPENSE" && transaction.creditCardName)
      .sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime())
      .map((transaction) => ({
        id: transaction.id,
        description: transaction.description,
        categoryId: (transaction.categoryId ?? "other") as ExpenseCategory,
        category: getExpenseCategoryLabel(transaction.categoryId),
        creditCardName: transaction.creditCardName!,
        amountInCents: transaction.amountInCents.toString(),
        originalAmountInCents: (transaction.originalAmountInCents ?? transaction.amountInCents).toString(),
        dueDate: transaction.occurredAt.toISOString(),
        installmentGroupId: transaction.installmentGroupId ?? transaction.id,
        installmentNumber: transaction.installmentNumber ?? 1,
        installmentCount: transaction.installmentCount ?? 1,
      }));
  }
}

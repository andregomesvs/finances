import type { ExpenseCategory } from "@/modules/expenses/domain/expense-category";

export interface FixedExpense {
  id: string;
  userId: string;
  description: string;
  categoryId: ExpenseCategory;
  amountInCents: bigint;
  dueDay: number;
  startMonth: string;
  endMonth: string | null;
  createdAt: Date;
  updatedAt: Date;
}

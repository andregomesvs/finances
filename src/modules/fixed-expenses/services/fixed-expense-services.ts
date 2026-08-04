import { getExpenseCategoryLabel } from "../../expenses/domain/expense-category";
import type { FixedExpense } from "../domain/fixed-expense";
import type { FixedExpenseRepository } from "../repositories/fixed-expense-repository";
import type { FixedExpenseInput } from "../schemas/fixed-expense-schema";

export class FixedExpenseNotFoundError extends Error {
  constructor() { super("Gasto fixo não encontrado."); }
}

export interface FixedExpenseListItem {
  id: string;
  description: string;
  categoryId: FixedExpense["categoryId"];
  category: string;
  amountInCents: string;
  dueDay: number;
  startMonth: string;
  endMonth: string | null;
}

export function isFixedExpenseActiveInMonth(expense: Pick<FixedExpense, "startMonth" | "endMonth">, month: string) {
  return expense.startMonth <= month && (!expense.endMonth || expense.endMonth >= month);
}

export class ListFixedExpensesService {
  constructor(private readonly expenses: FixedExpenseRepository) {}
  async execute(userId: string): Promise<FixedExpenseListItem[]> {
    return (await this.expenses.list(userId)).map((expense) => ({ ...expense, amountInCents: expense.amountInCents.toString(), category: getExpenseCategoryLabel(expense.categoryId) }));
  }
}

export class CreateFixedExpenseService {
  constructor(private readonly expenses: FixedExpenseRepository) {}
  async execute(userId: string, input: FixedExpenseInput): Promise<FixedExpense> {
    const now = new Date();
    const expense: FixedExpense = { id: crypto.randomUUID(), userId, ...input, amountInCents: BigInt(input.amountInCents), createdAt: now, updatedAt: now };
    await this.expenses.save(expense);
    return expense;
  }
}

export class UpdateFixedExpenseService {
  constructor(private readonly expenses: FixedExpenseRepository) {}
  async execute(id: string, userId: string, input: FixedExpenseInput): Promise<FixedExpense> {
    const existing = await this.expenses.findById(id, userId);
    if (!existing) throw new FixedExpenseNotFoundError();
    const updated: FixedExpense = { ...existing, ...input, amountInCents: BigInt(input.amountInCents), updatedAt: new Date() };
    await this.expenses.save(updated);
    return updated;
  }
}

export class DeleteFixedExpenseService {
  constructor(private readonly expenses: FixedExpenseRepository) {}
  async execute(id: string, userId: string): Promise<void> {
    if (!(await this.expenses.findById(id, userId))) throw new FixedExpenseNotFoundError();
    await this.expenses.softDelete(id, userId, new Date());
  }
}

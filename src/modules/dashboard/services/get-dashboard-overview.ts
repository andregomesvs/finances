import { getIncomeCategoryLabel } from "@/modules/incomes/domain/income-category";
import type { TransactionRepository } from "@/modules/transactions/repositories/transaction-repository";
import type { FixedExpenseRepository } from "@/modules/fixed-expenses/repositories/fixed-expense-repository";
import { isFixedExpenseActiveInMonth } from "@/modules/fixed-expenses/services/fixed-expense-services";

export interface DashboardOverview {
  incomeThisMonthInCents: string;
  expenseThisMonthInCents: string;
  recent: Array<{
    id: string;
    description: string;
    meta: string;
    type: "INCOME" | "EXPENSE" | "TRANSFER";
    amountInCents: string;
  }>;
  months: Array<{ label: string; incomeInCents: string; expenseInCents: string }>;
}

export class GetDashboardOverviewService {
  constructor(private readonly transactions: TransactionRepository, private readonly fixedExpenses: FixedExpenseRepository) {}

  async execute(userId: string): Promise<DashboardOverview> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const [periodTransactions, latestTransactions, fixedExpenses] = await Promise.all([
      this.transactions.listByPeriod(userId, periodStart, nextMonthStart),
      this.transactions.listLatestCreated(userId, 30),
      this.fixedExpenses.list(userId),
    ]);

    let incomeThisMonth = 0n;
    let expenseThisMonth = 0n;
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", ""),
        income: 0n,
        expense: 0n,
      };
    });

    for (const transaction of periodTransactions) {
      const key = `${transaction.occurredAt.getFullYear()}-${transaction.occurredAt.getMonth()}`;
      const month = months.find((item) => item.key === key);
      if (month && transaction.type === "INCOME") month.income += transaction.amountInCents;
      if (month && transaction.type === "EXPENSE") month.expense += transaction.amountInCents;

      if (transaction.occurredAt >= currentMonthStart && transaction.occurredAt < nextMonthStart) {
        if (transaction.type === "INCOME") incomeThisMonth += transaction.amountInCents;
        if (transaction.type === "EXPENSE") expenseThisMonth += transaction.amountInCents;
      }
    }

    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    for (const fixedExpense of fixedExpenses) {
      if (isFixedExpenseActiveInMonth(fixedExpense, currentMonthKey)) expenseThisMonth += fixedExpense.amountInCents;
      for (const month of months) {
        const [year, zeroBasedMonth] = month.key.split("-").map(Number);
        const monthKey = `${year}-${String(zeroBasedMonth + 1).padStart(2, "0")}`;
        if (isFixedExpenseActiveInMonth(fixedExpense, monthKey)) month.expense += fixedExpense.amountInCents;
      }
    }

    return {
      incomeThisMonthInCents: incomeThisMonth.toString(),
      expenseThisMonthInCents: expenseThisMonth.toString(),
      months: months.map((month) => ({
        label: month.label,
        incomeInCents: month.income.toString(),
        expenseInCents: month.expense.toString(),
      })),
      recent: latestTransactions.filter((transaction, index, transactions) => {
        if (!transaction.installmentGroupId) return true;
        return transactions.findIndex((candidate) => candidate.installmentGroupId === transaction.installmentGroupId) === index;
      }).slice(0, 3).map((transaction) => ({
        id: transaction.id,
        description: transaction.description,
        meta: transaction.type === "INCOME"
          ? `${getIncomeCategoryLabel(transaction.categoryId)} · ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(transaction.occurredAt)}`
          : `${transaction.creditCardName ?? "Cartão"} · ${transaction.installmentCount ?? 1}x`,
        type: transaction.type,
        amountInCents: (transaction.type === "EXPENSE" && transaction.originalAmountInCents
          ? transaction.originalAmountInCents
          : transaction.amountInCents).toString(),
      })),
    };
  }
}

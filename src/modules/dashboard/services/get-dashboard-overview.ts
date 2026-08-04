import { getIncomeCategoryLabel } from "@/modules/incomes/domain/income-category";
import type { TransactionRepository } from "@/modules/transactions/repositories/transaction-repository";

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
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(userId: string): Promise<DashboardOverview> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const [periodTransactions, recentTransactions] = await Promise.all([
      this.transactions.listByPeriod(userId, periodStart, nextMonthStart),
      this.transactions.listRecent(userId, 3),
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

    return {
      incomeThisMonthInCents: incomeThisMonth.toString(),
      expenseThisMonthInCents: expenseThisMonth.toString(),
      months: months.map((month) => ({
        label: month.label,
        incomeInCents: month.income.toString(),
        expenseInCents: month.expense.toString(),
      })),
      recent: recentTransactions.map((transaction) => ({
        id: transaction.id,
        description: transaction.description,
        meta: `${transaction.type === "INCOME" ? getIncomeCategoryLabel(transaction.categoryId) : "Movimentação"} · ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(transaction.occurredAt)}`,
        type: transaction.type,
        amountInCents: transaction.amountInCents.toString(),
      })),
    };
  }
}

import { describe, expect, it } from "vitest";
import type { Transaction } from "@/modules/transactions/domain/transaction";
import type { TransactionRepository } from "@/modules/transactions/repositories/transaction-repository";
import { CreateCardExpenseService } from "./create-card-expense-service";

class InMemoryTransactionRepository implements TransactionRepository {
  saved: Transaction[] = [];
  async findById() { return null; }
  async listByPeriod() { return []; }
  async listRecent() { return []; }
  async listLatestCreated() { return []; }
  async findByInstallmentGroup() { return []; }
  async save(transaction: Transaction) { this.saved.push(transaction); }
  async saveMany(transactions: Transaction[]) { this.saved.push(...transactions); }
  async softDelete() {}
  async softDeleteMany() {}
  async replaceMany() {}
}

describe("CreateCardExpenseService", () => {
  it("gera parcelas mensais preservando o valor total em centavos", async () => {
    const repository = new InMemoryTransactionRepository();
    await new CreateCardExpenseService(repository).execute("user-123", {
      description: "Tênis",
      totalAmountInCents: 10000,
      firstDueDate: "2026-08-31",
      categoryId: "shopping",
      creditCardName: "Sicredi",
      installmentCount: 3,
    });

    expect(repository.saved.map((entry) => entry.amountInCents)).toEqual([3334n, 3333n, 3333n]);
    expect(repository.saved.reduce((sum, entry) => sum + entry.amountInCents, 0n)).toBe(10000n);
    expect(repository.saved.map((entry) => entry.occurredAt.toISOString().slice(0, 10))).toEqual([
      "2026-08-31",
      "2026-09-30",
      "2026-10-31",
    ]);
    expect(new Set(repository.saved.map((entry) => entry.installmentGroupId)).size).toBe(1);
  });
});

import { describe, expect, it } from "vitest";
import type { Transaction } from "@/modules/transactions/domain/transaction";
import type { TransactionRepository } from "@/modules/transactions/repositories/transaction-repository";
import { CreateIncomesService } from "./create-incomes-service";

class InMemoryTransactionRepository implements TransactionRepository {
  saved: Transaction[] = [];

  async findById() { return null; }
  async listByPeriod() { return []; }
  async listRecent() { return []; }
  async save(transaction: Transaction) { this.saved.push(transaction); }
  async saveMany(transactions: Transaction[]) { this.saved.push(...transactions); }
}

describe("CreateIncomesService", () => {
  it("cria várias entradas vinculadas ao usuário autenticado", async () => {
    const repository = new InMemoryTransactionRepository();
    const service = new CreateIncomesService(repository);

    await service.execute("user-123", [
      { description: "Salário", amountInCents: 850000, occurredAt: "2026-08-04", categoryId: "salary" },
      { description: "Freelance", amountInCents: 120000, occurredAt: "2026-08-03", categoryId: "freelance" },
    ]);

    expect(repository.saved).toHaveLength(2);
    expect(repository.saved.every((entry) => entry.userId === "user-123" && entry.type === "INCOME")).toBe(true);
    expect(repository.saved[0]?.amountInCents).toBe(850000n);
  });
});

import { describe, expect, it } from "vitest";
import type { Transaction } from "@/modules/transactions/domain/transaction";
import type { TransactionRepository } from "@/modules/transactions/repositories/transaction-repository";
import { DeleteIncomeService } from "./delete-income-service";
import { UpdateIncomeService } from "./update-income-service";

class InMemoryTransactionRepository implements TransactionRepository {
  deletedId: string | null = null;
  transaction: Transaction = {
    id: "0b8808c9-ec04-4f50-997d-c32cf62ece81",
    userId: "user-123",
    accountId: null,
    categoryId: "salary",
    type: "INCOME",
    amountInCents: 590n,
    originalAmountInCents: null,
    description: "Salário GFT",
    creditCardName: null,
    installmentGroupId: null,
    installmentNumber: null,
    installmentCount: null,
    occurredAt: new Date("2026-08-04T12:00:00.000Z"),
    createdAt: new Date("2026-08-04T12:00:00.000Z"),
    updatedAt: new Date("2026-08-04T12:00:00.000Z"),
  };

  async findById(id: string, userId: string) {
    return id === this.transaction.id && userId === this.transaction.userId ? this.transaction : null;
  }
  async listByPeriod() { return []; }
  async listRecent() { return []; }
  async listLatestCreated() { return []; }
  async save(transaction: Transaction) { this.transaction = transaction; }
  async saveMany() {}
  async softDelete(id: string) { this.deletedId = id; }
}

describe("serviços de manutenção de entradas", () => {
  it("edita somente a entrada pertencente ao usuário", async () => {
    const repository = new InMemoryTransactionRepository();
    await new UpdateIncomeService(repository).execute(repository.transaction.id, "user-123", {
      description: "Salário corrigido",
      amountInCents: 590000,
      occurredAt: "2026-08-05",
      categoryId: "salary",
    });

    expect(repository.transaction.description).toBe("Salário corrigido");
    expect(repository.transaction.amountInCents).toBe(590000n);
  });

  it("solicita exclusão lógica da entrada", async () => {
    const repository = new InMemoryTransactionRepository();
    await new DeleteIncomeService(repository).execute(repository.transaction.id, "user-123");

    expect(repository.deletedId).toBe(repository.transaction.id);
  });
});

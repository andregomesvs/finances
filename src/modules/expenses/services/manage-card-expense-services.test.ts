import { describe, expect, it } from "vitest";
import type { Transaction } from "../../transactions/domain/transaction";
import type { TransactionRepository } from "../../transactions/repositories/transaction-repository";
import { DeleteCardExpenseService, UpdateCardExpenseService } from "./manage-card-expense-services";

class CardExpenseRepositorySpy implements TransactionRepository {
  replacements: Transaction[] = [];
  deletedIds: string[] = [];

  constructor(private readonly existing: Transaction[]) {}

  async findById() { return null; }
  async listByPeriod() { return []; }
  async listRecent() { return []; }
  async listLatestCreated() { return []; }
  async findByInstallmentGroup() { return this.existing; }
  async save() {}
  async saveMany() {}
  async softDelete() {}
  async softDeleteMany(ids: string[]) { this.deletedIds = ids; }
  async replaceMany(ids: string[], replacements: Transaction[]) {
    this.deletedIds = ids;
    this.replacements = replacements;
  }
}

function installment(id: string, number: number): Transaction {
  return {
    id,
    userId: "user-123",
    accountId: null,
    categoryId: "shopping",
    type: "EXPENSE",
    amountInCents: 5000n,
    originalAmountInCents: 10000n,
    description: "Compra antiga",
    creditCardName: "Cartão",
    installmentGroupId: "group-123",
    installmentNumber: number,
    installmentCount: 2,
    occurredAt: new Date(`2026-0${7 + number}-10T12:00:00.000Z`),
    createdAt: new Date("2026-07-01T12:00:00.000Z"),
    updatedAt: new Date("2026-07-01T12:00:00.000Z"),
  };
}

describe("CRUD de compras no cartão", () => {
  it("substitui todas as parcelas quando a compra é editada", async () => {
    const repository = new CardExpenseRepositorySpy([installment("p1", 1), installment("p2", 2)]);

    await new UpdateCardExpenseService(repository).execute("group-123", "user-123", {
      description: "Compra corrigida",
      totalAmountInCents: 9000,
      firstDueDate: "2026-09-10",
      categoryId: "shopping",
      creditCardName: "Cartão",
      installmentCount: 3,
    });

    expect(repository.deletedIds).toEqual(["p1", "p2"]);
    expect(repository.replacements).toHaveLength(3);
    expect(repository.replacements.every((item) => item.installmentGroupId === "group-123")).toBe(true);
    expect(repository.replacements.reduce((sum, item) => sum + item.amountInCents, 0n)).toBe(9000n);
  });

  it("exclui logicamente todas as parcelas da compra", async () => {
    const repository = new CardExpenseRepositorySpy([installment("p1", 1), installment("p2", 2)]);

    await new DeleteCardExpenseService(repository).execute("group-123", "user-123");

    expect(repository.deletedIds).toEqual(["p1", "p2"]);
  });
});

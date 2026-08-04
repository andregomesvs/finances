import { describe, expect, it } from "vitest";
import type { Investment } from "../domain/investment";
import type { InvestmentRepository } from "../repositories/investment-repository";
import { CreateInvestmentService, DeleteInvestmentService, InvestmentNotFoundError, UpdateInvestmentService } from "./investment-services";

class InMemoryInvestmentRepository implements InvestmentRepository {
  records = new Map<string, Investment>();
  deletedIds: string[] = [];

  async list(userId: string) { return [...this.records.values()].filter((item) => item.userId === userId); }
  async findById(id: string, userId: string) {
    const investment = this.records.get(id);
    return investment?.userId === userId ? investment : null;
  }
  async save(investment: Investment) { this.records.set(investment.id, investment); }
  async softDelete(id: string) { this.deletedIds.push(id); }
}

const cdbInput = {
  name: "CDB 120% CDI",
  categoryId: "cdb" as const,
  institution: "Banco Exemplo",
  investedAmountInCents: 100_000,
  currentAmountInCents: 103_500,
  currency: "BRL" as const,
  appliedAt: "2026-01-10",
  maturityDate: "2027-01-10",
  liquidity: "No vencimento",
  riskLevel: "LOW" as const,
  taxation: "Tabela regressiva de IR",
  annualReturnPct: 12,
  ticker: null,
  quantity: null,
  averagePriceInCents: null,
  yieldType: "% do CDI",
  yieldRatePct: 120,
  country: "Brasil",
  sector: "Financeiro",
  notes: null,
};

describe("CRUD de investimentos", () => {
  it("classifica e salva um investimento confirmado", async () => {
    const repository = new InMemoryInvestmentRepository();
    const created = await new CreateInvestmentService(repository).execute("user-123", cdbInput);

    expect(created.assetClass).toBe("fixed_income");
    expect(created.investedAmountInCents).toBe(100_000n);
    expect(created.source).toBe("MANUAL");
    expect(created.confirmed).toBe(true);
    expect(repository.records.get(created.id)).toEqual(created);
  });

  it("impede edição de um registro que não pertence ao usuário", async () => {
    const repository = new InMemoryInvestmentRepository();
    const created = await new CreateInvestmentService(repository).execute("owner", cdbInput);

    await expect(new UpdateInvestmentService(repository).execute(created.id, "other-user", cdbInput)).rejects.toBeInstanceOf(InvestmentNotFoundError);
  });

  it("faz exclusão lógica do investimento", async () => {
    const repository = new InMemoryInvestmentRepository();
    const created = await new CreateInvestmentService(repository).execute("user-123", cdbInput);

    await new DeleteInvestmentService(repository).execute(created.id, "user-123");

    expect(repository.deletedIds).toEqual([created.id]);
  });
});

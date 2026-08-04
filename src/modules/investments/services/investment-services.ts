import { getInvestmentCategory } from "../domain/investment-category";
import type { Investment } from "../domain/investment";
import type { InvestmentRepository } from "../repositories/investment-repository";
import type { InvestmentInput } from "../schemas/investment-schema";
import type { ImportedInvestmentInput } from "../schemas/investment-import-schema";

export class InvestmentNotFoundError extends Error {
  constructor() { super("Investimento não encontrado."); }
}

export interface InvestmentListItem extends Omit<Investment, "userId" | "investedAmountInCents" | "currentAmountInCents" | "averagePriceInCents" | "createdAt" | "updatedAt"> {
  category: string;
  investedAmountInCents: string | null;
  currentAmountInCents: string;
  averagePriceInCents: string | null;
  totalReturnPct: number | null;
}

function toListItem(investment: Investment): InvestmentListItem {
  const invested = investment.investedAmountInCents === null ? null : Number(investment.investedAmountInCents);
  return {
    id: investment.id,
    name: investment.name,
    categoryId: investment.categoryId,
    assetClass: investment.assetClass,
    category: getInvestmentCategory(investment.categoryId).label,
    institution: investment.institution,
    investedAmountInCents: investment.investedAmountInCents?.toString() ?? null,
    currentAmountInCents: investment.currentAmountInCents.toString(),
    currency: investment.currency,
    appliedAt: investment.appliedAt,
    maturityDate: investment.maturityDate,
    liquidity: investment.liquidity,
    riskLevel: investment.riskLevel,
    taxation: investment.taxation,
    annualReturnPct: investment.annualReturnPct,
    ticker: investment.ticker,
    quantity: investment.quantity,
    averagePriceInCents: investment.averagePriceInCents?.toString() ?? null,
    yieldType: investment.yieldType,
    yieldRatePct: investment.yieldRatePct,
    country: investment.country,
    sector: investment.sector,
    notes: investment.notes,
    source: investment.source,
    confirmed: investment.confirmed,
    totalReturnPct: invested !== null && invested > 0 ? ((Number(investment.currentAmountInCents) - invested) / invested) * 100 : null,
  };
}

export class ListInvestmentsService {
  constructor(private readonly investments: InvestmentRepository) {}
  async execute(userId: string) { return (await this.investments.list(userId)).map(toListItem); }
}

function buildInvestment(userId: string, input: InvestmentInput, existing?: Investment, source: Investment["source"] = "MANUAL"): Investment {
  const now = new Date();
  return {
    id: existing?.id ?? crypto.randomUUID(),
    userId,
    ...input,
    assetClass: getInvestmentCategory(input.categoryId).assetClass,
    investedAmountInCents: BigInt(input.investedAmountInCents),
    currentAmountInCents: BigInt(input.currentAmountInCents),
    averagePriceInCents: input.averagePriceInCents === null ? null : BigInt(input.averagePriceInCents),
    source: existing?.source ?? source,
    confirmed: true,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export class CreateInvestmentService {
  constructor(private readonly investments: InvestmentRepository) {}
  async execute(userId: string, input: InvestmentInput) {
    const investment = buildInvestment(userId, input);
    await this.investments.save(investment);
    return investment;
  }
}

export class CreateImportedInvestmentsService {
  constructor(private readonly investments: InvestmentRepository) {}
  async execute(userId: string, inputs: ImportedInvestmentInput[]) {
    const now = new Date();
    const investments: Investment[] = inputs.map((input) => ({
      ...input,
      id: crypto.randomUUID(),
      userId,
      assetClass: getInvestmentCategory(input.categoryId).assetClass,
      investedAmountInCents: input.investedAmountInCents === null ? null : BigInt(input.investedAmountInCents),
      currentAmountInCents: BigInt(input.currentAmountInCents ?? 0),
      averagePriceInCents: input.averagePriceInCents === null ? null : BigInt(input.averagePriceInCents),
      source: "AI_IMPORT",
      confirmed: true,
      createdAt: now,
      updatedAt: now,
    }));
    await this.investments.saveMany(investments);
    return investments;
  }
}

export class UpdateInvestmentService {
  constructor(private readonly investments: InvestmentRepository) {}
  async execute(id: string, userId: string, input: InvestmentInput) {
    const existing = await this.investments.findById(id, userId);
    if (!existing) throw new InvestmentNotFoundError();
    const investment = buildInvestment(userId, input, existing);
    await this.investments.save(investment);
    return investment;
  }
}

export class DeleteInvestmentService {
  constructor(private readonly investments: InvestmentRepository) {}
  async execute(id: string, userId: string) {
    if (!(await this.investments.findById(id, userId))) throw new InvestmentNotFoundError();
    await this.investments.softDelete(id, userId, new Date());
  }
}

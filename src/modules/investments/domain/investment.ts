import type { InvestmentAssetClass, InvestmentCategory } from "./investment-category";

export type InvestmentCurrency = "BRL" | "USD" | "EUR";
export type InvestmentRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface Investment {
  id: string;
  userId: string;
  name: string;
  categoryId: InvestmentCategory;
  assetClass: InvestmentAssetClass;
  institution: string;
  investedAmountInCents: bigint | null;
  currentAmountInCents: bigint;
  currency: InvestmentCurrency;
  appliedAt: string | null;
  maturityDate: string | null;
  liquidity: string;
  riskLevel: InvestmentRiskLevel;
  taxation: string;
  annualReturnPct: number | null;
  ticker: string | null;
  quantity: string | null;
  averagePriceInCents: bigint | null;
  yieldType: string | null;
  yieldRatePct: number | null;
  country: string | null;
  sector: string | null;
  notes: string | null;
  source: "MANUAL" | "AI_IMPORT";
  confirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

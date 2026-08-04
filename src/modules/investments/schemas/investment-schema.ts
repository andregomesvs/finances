import { z } from "zod";
import { investmentCategories } from "../domain/investment-category";

const categoryValues = investmentCategories.map((item) => item.value) as [
  (typeof investmentCategories)[number]["value"],
  ...(typeof investmentCategories)[number]["value"][],
];
const nullableText = (maximum: number) => z.union([z.string().trim().min(1).max(maximum), z.null()]);
const nullableDate = z.union([z.iso.date(), z.null()]);

export const investmentInputSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do investimento").max(120),
  categoryId: z.enum(categoryValues),
  institution: z.string().trim().min(2, "Informe a instituição financeira").max(120),
  investedAmountInCents: z.number().int().nonnegative().max(999_999_999_99),
  currentAmountInCents: z.number().int().nonnegative().max(999_999_999_99),
  currency: z.enum(["BRL", "USD", "EUR"]),
  appliedAt: nullableDate,
  maturityDate: nullableDate,
  liquidity: z.string().trim().min(2, "Informe a liquidez").max(100),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  taxation: z.string().trim().min(2, "Informe a tributação").max(160),
  annualReturnPct: z.union([z.number().min(-100).max(10_000), z.null()]),
  ticker: nullableText(24),
  quantity: z.union([z.string().regex(/^\d+(?:[.,]\d{1,12})?$/, "Informe uma quantidade válida"), z.null()]),
  averagePriceInCents: z.union([z.number().int().nonnegative().max(999_999_999_99), z.null()]),
  yieldType: nullableText(60),
  yieldRatePct: z.union([z.number().min(-100).max(10_000), z.null()]),
  country: nullableText(80),
  sector: nullableText(100),
  notes: nullableText(1_000),
}).refine((input) => !input.maturityDate || !input.appliedAt || input.maturityDate >= input.appliedAt, {
  message: "O vencimento deve ser posterior à aplicação",
  path: ["maturityDate"],
});

export type InvestmentInput = z.infer<typeof investmentInputSchema>;

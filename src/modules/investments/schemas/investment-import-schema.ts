import { z } from "zod";
import { investmentCategories } from "../domain/investment-category";

const categoryValues = investmentCategories.map((item) => item.value) as [
  (typeof investmentCategories)[number]["value"],
  ...(typeof investmentCategories)[number]["value"][],
];
const nullableString = z.union([z.string(), z.null()]);
const nullableNumber = z.union([z.number(), z.null()]);

export const extractedInvestmentSchema = z.object({
  name: z.string().min(1),
  categoryId: z.enum(categoryValues),
  institution: z.string().min(1),
  investedAmountInCents: z.union([z.number().int().nonnegative(), z.null()]),
  currentAmountInCents: z.union([z.number().int().nonnegative(), z.null()]),
  currency: z.enum(["BRL", "USD", "EUR"]),
  appliedAt: nullableString,
  maturityDate: nullableString,
  liquidity: z.string().min(1),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  taxation: z.string().min(1),
  annualReturnPct: nullableNumber,
  ticker: nullableString,
  quantity: nullableString,
  averagePriceInCents: z.union([z.number().int().nonnegative(), z.null()]),
  yieldType: nullableString,
  yieldRatePct: nullableNumber,
  country: nullableString,
  sector: nullableString,
  notes: nullableString,
  confidence: z.number().min(0).max(1),
  uncertainties: z.array(z.string()).max(10),
});

export const investmentDocumentExtractionSchema = z.object({
  documentSummary: z.string().min(1),
  detectedInstitution: nullableString,
  reportDate: nullableString,
  investments: z.array(extractedInvestmentSchema).max(100),
  warnings: z.array(z.string()).max(20),
});

export const importedInvestmentInputSchema = extractedInvestmentSchema.omit({ confidence: true, uncertainties: true });

export type ExtractedInvestment = z.infer<typeof extractedInvestmentSchema>;
export type ImportedInvestmentInput = z.infer<typeof importedInvestmentInputSchema>;
export type InvestmentDocumentExtraction = z.infer<typeof investmentDocumentExtractionSchema>;

import { describe, expect, it } from "vitest";
import { investmentDocumentExtractionSchema } from "./investment-import-schema";

describe("investmentDocumentExtractionSchema", () => {
  it("aceita uma posição extraída sem inventar valor aplicado", () => {
    const result = investmentDocumentExtractionSchema.parse({
      documentSummary: "Relatório consolidado",
      detectedInstitution: "Corretora Exemplo",
      reportDate: null,
      warnings: ["Valor aplicado não aparece no documento"],
      investments: [{
        name: "Fundo de investimento",
        categoryId: "investment_fund",
        institution: "Corretora Exemplo",
        investedAmountInCents: null,
        currentAmountInCents: 1313950,
        currency: "BRL",
        appliedAt: null,
        maturityDate: null,
        liquidity: "Não informada",
        riskLevel: "MEDIUM",
        taxation: "Não informada",
        annualReturnPct: 9.99,
        ticker: null,
        quantity: null,
        averagePriceInCents: null,
        yieldType: null,
        yieldRatePct: null,
        country: "Brasil",
        sector: null,
        notes: null,
        confidence: 0.82,
        uncertainties: ["Custo de aquisição ausente"],
      }],
    });

    expect(result.investments[0]?.investedAmountInCents).toBeNull();
    expect(result.investments[0]?.currentAmountInCents).toBe(1313950);
  });
});

export const investmentCategories = [
  { value: "treasury", label: "Tesouro Direto", assetClass: "fixed_income" },
  { value: "cdb", label: "CDB", assetClass: "fixed_income" },
  { value: "lci", label: "LCI", assetClass: "fixed_income" },
  { value: "lca", label: "LCA", assetClass: "fixed_income" },
  { value: "cra", label: "CRA", assetClass: "fixed_income" },
  { value: "cri", label: "CRI", assetClass: "fixed_income" },
  { value: "debenture", label: "Debêntures", assetClass: "fixed_income" },
  { value: "fii", label: "Fundos Imobiliários (FIIs)", assetClass: "variable_income" },
  { value: "br_stock", label: "Ações Brasileiras", assetClass: "variable_income" },
  { value: "international_stock", label: "Ações Internacionais", assetClass: "variable_income" },
  { value: "etf", label: "ETFs", assetClass: "variable_income" },
  { value: "bdr", label: "BDRs", assetClass: "variable_income" },
  { value: "investment_fund", label: "Fundos de Investimento", assetClass: "fund" },
  { value: "private_pension", label: "Previdência Privada", assetClass: "pension" },
  { value: "crypto", label: "Criptomoedas", assetClass: "crypto" },
  { value: "fixed_income", label: "Renda Fixa", assetClass: "fixed_income" },
  { value: "variable_income", label: "Renda Variável", assetClass: "variable_income" },
  { value: "cash", label: "Caixa", assetClass: "cash" },
  { value: "checking_account", label: "Conta Corrente", assetClass: "cash" },
  { value: "emergency_reserve", label: "Reserva de Emergência", assetClass: "cash" },
  { value: "other", label: "Outros", assetClass: "other" },
] as const;

export type InvestmentCategory = (typeof investmentCategories)[number]["value"];
export type InvestmentAssetClass = (typeof investmentCategories)[number]["assetClass"];

export function getInvestmentCategory(category: InvestmentCategory) {
  return investmentCategories.find((item) => item.value === category)!;
}

export const marketInvestmentCategories: InvestmentCategory[] = [
  "fii", "br_stock", "international_stock", "etf", "bdr", "crypto", "variable_income",
];

export const yieldInvestmentCategories: InvestmentCategory[] = [
  "treasury", "cdb", "lci", "lca", "cra", "cri", "debenture", "fixed_income",
];

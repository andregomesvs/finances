export const incomeCategories = [
  { value: "salary", label: "Salário" },
  { value: "freelance", label: "Freelance" },
  { value: "business", label: "Pró-labore" },
  { value: "benefits", label: "Benefícios" },
  { value: "investments", label: "Rendimentos" },
  { value: "sales", label: "Vendas" },
  { value: "other", label: "Outros" },
] as const;

export type IncomeCategory = (typeof incomeCategories)[number]["value"];

export function getIncomeCategoryLabel(value: string | null): string {
  return incomeCategories.find((category) => category.value === value)?.label ?? "Outros";
}

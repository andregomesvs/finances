export const expenseCategories = [
  { value: "housing", label: "Moradia" },
  { value: "food", label: "Alimentação" },
  { value: "transport", label: "Transporte" },
  { value: "health", label: "Saúde" },
  { value: "subscriptions", label: "Assinaturas" },
  { value: "shopping", label: "Compras" },
  { value: "leisure", label: "Lazer" },
  { value: "education", label: "Educação" },
  { value: "taxes", label: "Impostos" },
  { value: "other", label: "Outros" },
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number]["value"];

export function getExpenseCategoryLabel(value: string | null): string {
  return expenseCategories.find((category) => category.value === value)?.label ?? "Outros";
}

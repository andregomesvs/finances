import { z } from "zod";
import { expenseCategories } from "../domain/expense-category";

const categoryValues = expenseCategories.map((category) => category.value) as [
  (typeof expenseCategories)[number]["value"],
  ...(typeof expenseCategories)[number]["value"][],
];

export const cardExpenseInputSchema = z.object({
  description: z.string().trim().min(2, "Informe uma descrição").max(120),
  totalAmountInCents: z.number().int().positive("O valor deve ser maior que zero").max(999_999_999_99),
  firstDueDate: z.iso.date("Informe uma data válida"),
  categoryId: z.enum(categoryValues),
  creditCardName: z.string().trim().min(2, "Informe o cartão").max(60),
  installmentCount: z.number().int().min(1).max(36),
});

export type CardExpenseInput = z.infer<typeof cardExpenseInputSchema>;

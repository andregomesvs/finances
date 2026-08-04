import { z } from "zod";
import { incomeCategories } from "../domain/income-category";

const categoryValues = incomeCategories.map((category) => category.value) as [
  (typeof incomeCategories)[number]["value"],
  ...(typeof incomeCategories)[number]["value"][],
];

export const incomeInputSchema = z.object({
  description: z.string().trim().min(2, "Informe uma descrição").max(120),
  amountInCents: z.number().int().positive("O valor deve ser maior que zero").max(999_999_999_99),
  occurredAt: z.iso.date("Informe uma data válida"),
  categoryId: z.enum(categoryValues),
});

export const createIncomesSchema = z.object({
  entries: z.array(incomeInputSchema).min(1).max(20, "Cadastre no máximo 20 entradas por vez"),
});

export type IncomeInput = z.infer<typeof incomeInputSchema>;

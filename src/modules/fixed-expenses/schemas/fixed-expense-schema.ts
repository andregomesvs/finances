import { z } from "zod";
import { expenseCategories } from "@/modules/expenses/domain/expense-category";

const categoryValues = expenseCategories.map((category) => category.value) as [
  (typeof expenseCategories)[number]["value"],
  ...(typeof expenseCategories)[number]["value"][],
];
const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Informe um mês válido");

export const fixedExpenseInputSchema = z.object({
  description: z.string().trim().min(2, "Informe uma descrição").max(120),
  categoryId: z.enum(categoryValues),
  amountInCents: z.number().int().positive("O valor deve ser maior que zero").max(999_999_999_99),
  dueDay: z.number().int().min(1).max(31),
  startMonth: monthSchema,
  endMonth: z.union([monthSchema, z.null()]),
}).refine((input) => !input.endMonth || input.endMonth >= input.startMonth, {
  message: "O término deve ser igual ou posterior ao início",
  path: ["endMonth"],
});

export type FixedExpenseInput = z.infer<typeof fixedExpenseInputSchema>;

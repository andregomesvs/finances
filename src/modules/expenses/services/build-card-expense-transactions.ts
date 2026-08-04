import type { Transaction } from "@/modules/transactions/domain/transaction";
import { addMonthsToIsoDate } from "../../../utils/installment-date";
import type { CardExpenseInput } from "../schemas/card-expense-schema";

export function buildCardExpenseTransactions(userId: string, input: CardExpenseInput, groupId = crypto.randomUUID(), createdAt = new Date()): Transaction[] {
  const baseAmount = Math.floor(input.totalAmountInCents / input.installmentCount);
  const remainder = input.totalAmountInCents % input.installmentCount;
  return Array.from({ length: input.installmentCount }, (_, index) => {
    const dueDate = addMonthsToIsoDate(input.firstDueDate, index);
    return { id: crypto.randomUUID(), userId, accountId: null, categoryId: input.categoryId, type: "EXPENSE", amountInCents: BigInt(baseAmount + (index < remainder ? 1 : 0)), originalAmountInCents: BigInt(input.totalAmountInCents), description: input.description, creditCardName: input.creditCardName, installmentGroupId: groupId, installmentNumber: index + 1, installmentCount: input.installmentCount, occurredAt: new Date(`${dueDate}T12:00:00.000Z`), createdAt, updatedAt: new Date() };
  });
}

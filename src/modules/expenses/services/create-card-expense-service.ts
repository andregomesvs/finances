import type { Transaction } from "@/modules/transactions/domain/transaction";
import type { TransactionRepository } from "@/modules/transactions/repositories/transaction-repository";
import { addMonthsToIsoDate } from "../../../utils/installment-date";
import type { CardExpenseInput } from "../schemas/card-expense-schema";

export class CreateCardExpenseService {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(userId: string, input: CardExpenseInput): Promise<Transaction[]> {
    const now = new Date();
    const groupId = crypto.randomUUID();
    const baseAmount = Math.floor(input.totalAmountInCents / input.installmentCount);
    const remainder = input.totalAmountInCents % input.installmentCount;
    const installments = Array.from({ length: input.installmentCount }, (_, index) => {
      const dueDate = addMonthsToIsoDate(input.firstDueDate, index);
      return {
        id: crypto.randomUUID(),
        userId,
        accountId: null,
        categoryId: input.categoryId,
        type: "EXPENSE",
        amountInCents: BigInt(baseAmount + (index < remainder ? 1 : 0)),
        originalAmountInCents: BigInt(input.totalAmountInCents),
        description: input.description,
        creditCardName: input.creditCardName,
        installmentGroupId: groupId,
        installmentNumber: index + 1,
        installmentCount: input.installmentCount,
        occurredAt: new Date(`${dueDate}T12:00:00.000Z`),
        createdAt: now,
        updatedAt: now,
      } satisfies Transaction;
    });

    await this.transactions.saveMany(installments);
    return installments;
  }
}

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

export interface Transaction {
  id: string;
  userId: string;
  accountId: string | null;
  categoryId: string | null;
  type: TransactionType;
  amountInCents: bigint;
  originalAmountInCents: bigint | null;
  description: string;
  creditCardName: string | null;
  installmentGroupId: string | null;
  installmentNumber: number | null;
  installmentCount: number | null;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

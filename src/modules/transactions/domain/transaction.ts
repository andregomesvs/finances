export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string | null;
  type: TransactionType;
  amountInCents: bigint;
  description: string;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

export interface Transaction {
  id: string;
  userId: string;
  accountId: string | null;
  categoryId: string | null;
  type: TransactionType;
  amountInCents: bigint;
  description: string;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

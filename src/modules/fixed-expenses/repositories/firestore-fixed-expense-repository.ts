import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { getFirestoreDatabase } from "@/infrastructure/firebase/firestore";
import type { ExpenseCategory } from "@/modules/expenses/domain/expense-category";
import type { FixedExpense } from "../domain/fixed-expense";
import type { FixedExpenseRepository } from "./fixed-expense-repository";

interface FixedExpenseDocument {
  description: string;
  categoryId: ExpenseCategory;
  amountInCents: string;
  dueDay: number;
  startMonth: string;
  endMonth: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

export class FirestoreFixedExpenseRepository implements FixedExpenseRepository {
  private collection(userId: string) {
    return getFirestoreDatabase().collection("users").doc(userId).collection("fixedExpenses");
  }

  async list(userId: string): Promise<FixedExpense[]> {
    const snapshot = await this.collection(userId).get();
    return snapshot.docs
      .map((document) => ({ id: document.id, data: document.data() as FixedExpenseDocument }))
      .filter((document) => !document.data.deletedAt)
      .map((document) => this.toDomain(document.id, userId, document.data))
      .sort((left, right) => left.dueDay - right.dueDay || left.description.localeCompare(right.description));
  }

  async findById(id: string, userId: string): Promise<FixedExpense | null> {
    const snapshot = await this.collection(userId).doc(id).get();
    if (!snapshot.exists) return null;
    const data = snapshot.data() as FixedExpenseDocument;
    return data.deletedAt ? null : this.toDomain(snapshot.id, userId, data);
  }

  async save(expense: FixedExpense): Promise<void> {
    await this.collection(expense.userId).doc(expense.id).set({
      description: expense.description,
      categoryId: expense.categoryId,
      amountInCents: expense.amountInCents.toString(),
      dueDay: expense.dueDay,
      startMonth: expense.startMonth,
      endMonth: expense.endMonth,
      createdAt: Timestamp.fromDate(expense.createdAt),
      updatedAt: Timestamp.fromDate(expense.updatedAt),
      deletedAt: null,
    } satisfies FixedExpenseDocument);
  }

  async softDelete(id: string, userId: string, deletedAt: Date): Promise<void> {
    await this.collection(userId).doc(id).update({ deletedAt: Timestamp.fromDate(deletedAt), updatedAt: Timestamp.fromDate(deletedAt) });
  }

  private toDomain(id: string, userId: string, document: FixedExpenseDocument): FixedExpense {
    return { id, userId, description: document.description, categoryId: document.categoryId, amountInCents: BigInt(document.amountInCents), dueDay: document.dueDay, startMonth: document.startMonth, endMonth: document.endMonth, createdAt: document.createdAt.toDate(), updatedAt: document.updatedAt.toDate() };
  }
}

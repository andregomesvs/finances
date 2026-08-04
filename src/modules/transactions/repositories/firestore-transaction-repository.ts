import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import type { Transaction } from "../domain/transaction";
import type { TransactionRepository } from "./transaction-repository";
import { getFirestoreDatabase } from "@/infrastructure/firebase/firestore";

interface TransactionDocument {
  accountId: string | null;
  categoryId: string | null;
  type: Transaction["type"];
  amountInCents: string;
  originalAmountInCents?: string | null;
  description: string;
  creditCardName?: string | null;
  installmentGroupId?: string | null;
  installmentNumber?: number | null;
  installmentCount?: number | null;
  occurredAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

export class FirestoreTransactionRepository implements TransactionRepository {
  private collection(userId: string) {
    return getFirestoreDatabase().collection("users").doc(userId).collection("transactions");
  }

  async findById(id: string, userId: string): Promise<Transaction | null> {
    const snapshot = await this.collection(userId).doc(id).get();

    if (!snapshot.exists) return null;

    const document = snapshot.data() as TransactionDocument;
    if (document.deletedAt) return null;

    return this.toDomain(snapshot.id, userId, document);
  }

  async listByPeriod(userId: string, from: Date, to: Date): Promise<Transaction[]> {
    const snapshot = await this.collection(userId)
      .where("occurredAt", ">=", Timestamp.fromDate(from))
      .where("occurredAt", "<=", Timestamp.fromDate(to))
      .orderBy("occurredAt", "desc")
      .get();

    return snapshot.docs
      .map((document) => ({ id: document.id, data: document.data() as TransactionDocument }))
      .filter((document) => !document.data.deletedAt)
      .map((document) => this.toDomain(document.id, userId, document.data));
  }

  async listRecent(userId: string, limit: number): Promise<Transaction[]> {
    const safeLimit = Math.min(Math.max(limit * 3, limit), 100);
    const snapshot = await this.collection(userId)
      .orderBy("occurredAt", "desc")
      .limit(safeLimit)
      .get();

    return snapshot.docs
      .map((document) => ({ id: document.id, data: document.data() as TransactionDocument }))
      .filter((document) => !document.data.deletedAt)
      .slice(0, limit)
      .map((document) => this.toDomain(document.id, userId, document.data));
  }

  async listLatestCreated(userId: string, limit: number): Promise<Transaction[]> {
    const snapshot = await this.collection(userId)
      .orderBy("createdAt", "desc")
      .limit(Math.min(Math.max(limit, 1), 100))
      .get();

    return snapshot.docs
      .map((document) => ({ id: document.id, data: document.data() as TransactionDocument }))
      .filter((document) => !document.data.deletedAt)
      .map((document) => this.toDomain(document.id, userId, document.data));
  }

  async findByInstallmentGroup(userId: string, groupId: string): Promise<Transaction[]> {
    const snapshot = await this.collection(userId).where("installmentGroupId", "==", groupId).get();
    return snapshot.docs.map((document) => ({ id: document.id, data: document.data() as TransactionDocument })).filter((document) => !document.data.deletedAt).map((document) => this.toDomain(document.id, userId, document.data));
  }

  async save(transaction: Transaction): Promise<void> {
    await this.saveMany([transaction]);
  }

  async saveMany(transactions: Transaction[]): Promise<void> {
    if (transactions.length === 0) return;

    const batch = getFirestoreDatabase().batch();

    for (const transaction of transactions) {
      batch.set(this.collection(transaction.userId).doc(transaction.id), this.toDocument(transaction));
    }

    await batch.commit();
  }

  async softDelete(id: string, userId: string, deletedAt: Date): Promise<void> {
    await this.collection(userId).doc(id).update({
      deletedAt: Timestamp.fromDate(deletedAt),
      updatedAt: Timestamp.fromDate(deletedAt),
    });
  }

  async softDeleteMany(ids: string[], userId: string, deletedAt: Date): Promise<void> {
    if (ids.length === 0) return;
    const batch = getFirestoreDatabase().batch();
    for (const id of ids) batch.update(this.collection(userId).doc(id), { deletedAt: Timestamp.fromDate(deletedAt), updatedAt: Timestamp.fromDate(deletedAt) });
    await batch.commit();
  }

  async replaceMany(idsToDelete: string[], replacements: Transaction[], deletedAt: Date): Promise<void> {
    const batch = getFirestoreDatabase().batch();
    const userId = replacements[0]?.userId;
    if (!userId) return;
    for (const id of idsToDelete) batch.update(this.collection(userId).doc(id), { deletedAt: Timestamp.fromDate(deletedAt), updatedAt: Timestamp.fromDate(deletedAt) });
    for (const transaction of replacements) {
      batch.set(this.collection(userId).doc(transaction.id), this.toDocument(transaction));
    }
    await batch.commit();
  }

  private toDomain(id: string, userId: string, document: TransactionDocument): Transaction {
    return {
      id,
      userId,
      accountId: document.accountId,
      categoryId: document.categoryId,
      type: document.type,
      amountInCents: BigInt(document.amountInCents),
      originalAmountInCents: document.originalAmountInCents ? BigInt(document.originalAmountInCents) : null,
      description: document.description,
      creditCardName: document.creditCardName ?? null,
      installmentGroupId: document.installmentGroupId ?? null,
      installmentNumber: document.installmentNumber ?? null,
      installmentCount: document.installmentCount ?? null,
      occurredAt: document.occurredAt.toDate(),
      createdAt: document.createdAt.toDate(),
      updatedAt: document.updatedAt.toDate(),
    };
  }

  private toDocument(transaction: Transaction): TransactionDocument {
    return { accountId: transaction.accountId, categoryId: transaction.categoryId, type: transaction.type, amountInCents: transaction.amountInCents.toString(), originalAmountInCents: transaction.originalAmountInCents?.toString() ?? null, description: transaction.description, creditCardName: transaction.creditCardName, installmentGroupId: transaction.installmentGroupId, installmentNumber: transaction.installmentNumber, installmentCount: transaction.installmentCount, occurredAt: Timestamp.fromDate(transaction.occurredAt), createdAt: Timestamp.fromDate(transaction.createdAt), updatedAt: Timestamp.fromDate(transaction.updatedAt), deletedAt: null };
  }
}

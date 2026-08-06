import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { getFirestoreDatabase } from "@/infrastructure/firebase/firestore";
import type { PluggyConnection } from "../domain/pluggy-connection";
import type { PluggyConnectionRepository } from "./pluggy-connection-repository";

interface PluggyConnectionDocument {
  connectorId: number;
  institutionName: string;
  institutionImageUrl: string | null;
  status: string;
  executionStatus: string;
  lastUpdatedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class FirestorePluggyConnectionRepository implements PluggyConnectionRepository {
  private collection(userId: string) {
    return getFirestoreDatabase().collection("users").doc(userId).collection("pluggyItems");
  }

  async list(userId: string): Promise<PluggyConnection[]> {
    const snapshot = await this.collection(userId).get();
    return snapshot.docs
      .map((document) => this.toDomain(document.id, userId, document.data() as PluggyConnectionDocument))
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());
  }

  async findByItemId(itemId: string, userId: string): Promise<PluggyConnection | null> {
    const snapshot = await this.collection(userId).doc(itemId).get();
    if (!snapshot.exists) return null;
    return this.toDomain(snapshot.id, userId, snapshot.data() as PluggyConnectionDocument);
  }

  async save(connection: PluggyConnection): Promise<void> {
    const reference = this.collection(connection.userId).doc(connection.itemId);
    const existing = await reference.get();
    const createdAt = existing.exists
      ? (existing.data() as PluggyConnectionDocument).createdAt
      : Timestamp.fromDate(connection.createdAt);

    await reference.set({
      connectorId: connection.connectorId,
      institutionName: connection.institutionName,
      institutionImageUrl: connection.institutionImageUrl,
      status: connection.status,
      executionStatus: connection.executionStatus,
      lastUpdatedAt: connection.lastUpdatedAt ? Timestamp.fromDate(connection.lastUpdatedAt) : null,
      createdAt,
      updatedAt: Timestamp.fromDate(connection.updatedAt),
    } satisfies PluggyConnectionDocument);
  }

  private toDomain(itemId: string, userId: string, document: PluggyConnectionDocument): PluggyConnection {
    return {
      ...document,
      itemId,
      userId,
      lastUpdatedAt: document.lastUpdatedAt?.toDate() ?? null,
      createdAt: document.createdAt.toDate(),
      updatedAt: document.updatedAt.toDate(),
    };
  }
}

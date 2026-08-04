import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { getFirestoreDatabase } from "@/infrastructure/firebase/firestore";
import type { Investment, InvestmentCurrency, InvestmentRiskLevel } from "../domain/investment";
import type { InvestmentAssetClass, InvestmentCategory } from "../domain/investment-category";
import type { InvestmentRepository } from "./investment-repository";

interface InvestmentDocument {
  name: string;
  categoryId: InvestmentCategory;
  assetClass: InvestmentAssetClass;
  institution: string;
  investedAmountInCents: string | null;
  currentAmountInCents: string;
  currency: InvestmentCurrency;
  appliedAt: string | null;
  maturityDate: string | null;
  liquidity: string;
  riskLevel: InvestmentRiskLevel;
  taxation: string;
  annualReturnPct: number | null;
  ticker: string | null;
  quantity: string | null;
  averagePriceInCents: string | null;
  yieldType: string | null;
  yieldRatePct: number | null;
  country: string | null;
  sector: string | null;
  notes: string | null;
  source: "MANUAL" | "AI_IMPORT";
  confirmed: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

export class FirestoreInvestmentRepository implements InvestmentRepository {
  private collection(userId: string) {
    return getFirestoreDatabase().collection("users").doc(userId).collection("investments");
  }

  async list(userId: string): Promise<Investment[]> {
    const snapshot = await this.collection(userId).get();
    return snapshot.docs
      .map((document) => ({ id: document.id, data: document.data() as InvestmentDocument }))
      .filter(({ data }) => !data.deletedAt)
      .map(({ id, data }) => this.toDomain(id, userId, data))
      .sort((left, right) => Number(right.currentAmountInCents - left.currentAmountInCents));
  }

  async findById(id: string, userId: string): Promise<Investment | null> {
    const snapshot = await this.collection(userId).doc(id).get();
    if (!snapshot.exists) return null;
    const data = snapshot.data() as InvestmentDocument;
    return data.deletedAt ? null : this.toDomain(snapshot.id, userId, data);
  }

  async save(investment: Investment): Promise<void> {
    await this.collection(investment.userId).doc(investment.id).set(this.toDocument(investment));
  }

  async saveMany(investments: Investment[]): Promise<void> {
    if (investments.length === 0) return;
    const batch = getFirestoreDatabase().batch();
    for (const investment of investments) {
      batch.set(this.collection(investment.userId).doc(investment.id), this.toDocument(investment));
    }
    await batch.commit();
  }

  async softDelete(id: string, userId: string, deletedAt: Date): Promise<void> {
    await this.collection(userId).doc(id).update({ deletedAt: Timestamp.fromDate(deletedAt), updatedAt: Timestamp.fromDate(deletedAt) });
  }

  private toDocument(investment: Investment): InvestmentDocument {
    return {
      name: investment.name,
      categoryId: investment.categoryId,
      assetClass: investment.assetClass,
      institution: investment.institution,
      investedAmountInCents: investment.investedAmountInCents?.toString() ?? null,
      currentAmountInCents: investment.currentAmountInCents.toString(),
      currency: investment.currency,
      appliedAt: investment.appliedAt,
      maturityDate: investment.maturityDate,
      liquidity: investment.liquidity,
      riskLevel: investment.riskLevel,
      taxation: investment.taxation,
      annualReturnPct: investment.annualReturnPct,
      ticker: investment.ticker,
      quantity: investment.quantity,
      averagePriceInCents: investment.averagePriceInCents?.toString() ?? null,
      yieldType: investment.yieldType,
      yieldRatePct: investment.yieldRatePct,
      country: investment.country,
      sector: investment.sector,
      notes: investment.notes,
      source: investment.source,
      confirmed: investment.confirmed,
      createdAt: Timestamp.fromDate(investment.createdAt),
      updatedAt: Timestamp.fromDate(investment.updatedAt),
      deletedAt: null,
    };
  }

  private toDomain(id: string, userId: string, document: InvestmentDocument): Investment {
    return {
      ...document,
      id,
      userId,
      investedAmountInCents: document.investedAmountInCents === null ? null : BigInt(document.investedAmountInCents),
      currentAmountInCents: BigInt(document.currentAmountInCents),
      averagePriceInCents: document.averagePriceInCents ? BigInt(document.averagePriceInCents) : null,
      createdAt: document.createdAt.toDate(),
      updatedAt: document.updatedAt.toDate(),
    };
  }
}

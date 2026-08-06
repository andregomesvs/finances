import "server-only";

import type { Account, Item } from "pluggy-sdk";
import { getPluggyClient } from "@/infrastructure/pluggy/client";
import type { PluggyConnection } from "../domain/pluggy-connection";
import type { PluggyConnectionRepository } from "../repositories/pluggy-connection-repository";

export class PluggyOwnershipError extends Error {}
export class PluggyConnectionNotFoundError extends Error {}

function toConnection(item: Item, userId: string): PluggyConnection {
  return {
    itemId: item.id,
    userId,
    connectorId: item.connector.id,
    institutionName: item.connector.name,
    institutionImageUrl: item.connector.imageUrl ?? null,
    status: item.status,
    executionStatus: item.executionStatus,
    lastUpdatedAt: item.lastUpdatedAt ?? null,
    createdAt: item.createdAt,
    updatedAt: new Date(),
  };
}

export class CreatePluggyConnectTokenService {
  constructor(private readonly repository: PluggyConnectionRepository) {}

  async execute(userId: string, itemId?: string): Promise<string> {
    if (itemId && !(await this.repository.findByItemId(itemId, userId))) {
      throw new PluggyConnectionNotFoundError("Conexão não encontrada.");
    }

    const result = await getPluggyClient().createConnectToken(itemId, {
      clientUserId: userId,
      avoidDuplicates: true,
    });
    return result.accessToken;
  }
}

export class SavePluggyConnectionService {
  constructor(private readonly repository: PluggyConnectionRepository) {}

  async execute(userId: string, itemId: string): Promise<PluggyConnection> {
    const item = await getPluggyClient().fetchItem(itemId);
    if (item.clientUserId !== userId) {
      throw new PluggyOwnershipError("Esta conexão não pertence ao usuário autenticado.");
    }

    const connection = toConnection(item, userId);
    await this.repository.save(connection);
    return connection;
  }
}

export interface ConnectedAccount {
  id: string;
  itemId: string;
  institutionName: string;
  institutionImageUrl: string | null;
  name: string;
  number: string;
  type: Account["type"];
  subtype: Account["subtype"];
  balance: number;
  currencyCode: string;
  availableCreditLimit: number | null;
}

export interface OpenFinanceOverview {
  connections: PluggyConnection[];
  accounts: ConnectedAccount[];
  transactions: ConnectedTransaction[];
  warnings: string[];
}

export interface ConnectedTransaction {
  id: string;
  accountId: string;
  accountName: string;
  institutionName: string;
  description: string;
  category: string | null;
  type: "DEBIT" | "CREDIT";
  amount: number;
  currencyCode: string;
  date: Date;
  status: string;
}

export class GetOpenFinanceOverviewService {
  constructor(private readonly repository: PluggyConnectionRepository) {}

  async execute(userId: string): Promise<OpenFinanceOverview> {
    const connections = await this.repository.list(userId);
    const results = await Promise.allSettled(connections.map(async (connection) => {
      const item = await getPluggyClient().fetchItem(connection.itemId);
      if (item.clientUserId !== userId) throw new PluggyOwnershipError();
      await this.repository.save(toConnection(item, userId));
      const response = await getPluggyClient().fetchAccounts(connection.itemId);
      const accounts = response.results.map((account): ConnectedAccount => ({
        id: account.id,
        itemId: account.itemId,
        institutionName: item.connector.name,
        institutionImageUrl: item.connector.imageUrl ?? null,
        name: account.name,
        number: account.number,
        type: account.type,
        subtype: account.subtype,
        balance: account.balance,
        currencyCode: account.currencyCode,
        availableCreditLimit: account.creditData?.availableCreditLimit ?? null,
      }));
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 30);
      const transactionResults = await Promise.allSettled(response.results.map(async (account) => {
        const page = await getPluggyClient().fetchTransactionsCursor(account.id, {
          dateFrom: dateFrom.toISOString().slice(0, 10),
        });
        return page.results.map((transaction): ConnectedTransaction => ({
          id: transaction.id,
          accountId: account.id,
          accountName: account.name,
          institutionName: item.connector.name,
          description: transaction.description,
          category: transaction.category,
          type: transaction.type,
          amount: transaction.amount,
          currencyCode: transaction.currencyCode,
          date: transaction.date,
          status: transaction.status ?? "POSTED",
        }));
      }));
      const transactions = transactionResults.flatMap((result) => result.status === "fulfilled" ? result.value : []);
      return { accounts, transactions };
    }));

    const accounts = results.flatMap((result) => result.status === "fulfilled" ? result.value.accounts : []);
    const transactions = results
      .flatMap((result) => result.status === "fulfilled" ? result.value.transactions : [])
      .sort((left, right) => right.date.getTime() - left.date.getTime())
      .slice(0, 20);
    const warnings = results.flatMap((result, index) => result.status === "rejected"
      ? [`Não foi possível atualizar ${connections[index].institutionName}.`]
      : []);

    return { connections, accounts, transactions, warnings };
  }
}

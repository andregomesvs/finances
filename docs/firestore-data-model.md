# Modelo de dados Firestore

```text
users/{userId}
  accounts/{accountId}
  categories/{categoryId}
  transactions/{transactionId}
  budgets/{budgetId}
  goals/{goalId}
  assets/{assetId}
    quotes/{quoteId}
  investmentTransactions/{operationId}
  summaries/{period}
  auditLogs/{auditId}
```

## Convenções

- Documentos financeiros carregam `createdAt`, `updatedAt` e `deletedAt`.
- Valores monetários usam centavos serializados como string.
- Quantidades de ativos usam string decimal.
- `summaries/{period}` armazena agregados mensais para dashboards eficientes.
- Toda consulta recebe o `userId` do contexto autenticado; IDs enviados pelo cliente nunca definem o proprietário.
- Operações que alteram saldo e lançamento serão executadas em transações ou batches do Firestore.
- Entradas são documentos `transactions` com `type: "INCOME"`; enquanto a página de contas não estiver disponível, `accountId` permanece `null`.
- Compras no cartão geram um documento `transactions` por parcela com `type: "EXPENSE"`, agrupados por `installmentGroupId`; o valor original permanece em `originalAmountInCents`.

"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Item } from "pluggy-js";
import { ArrowDownLeft, ArrowUpRight, Building2, CreditCard, Landmark, LoaderCircle, Plus, RefreshCw, WalletCards } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { OpenFinanceOverview } from "../services/pluggy-services";

const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((module) => module.PluggyConnect),
  { ssr: false },
);

function formatMoney(value: number, currencyCode: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currencyCode }).format(value);
}

function accountTypeLabel(type: "BANK" | "CREDIT") {
  return type === "CREDIT" ? "Cartão de crédito" : "Conta bancária";
}

export function AccountsPage({ initialOverview }: { initialOverview: OpenFinanceOverview }) {
  const router = useRouter();
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [loadingItemId, setLoadingItemId] = useState<string | null | "new">(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const bankBalance = useMemo(() => initialOverview.accounts
    .filter((account) => account.type === "BANK" && account.currencyCode === "BRL")
    .reduce((total, account) => total + account.balance, 0), [initialOverview.accounts]);
  const creditBalance = useMemo(() => initialOverview.accounts
    .filter((account) => account.type === "CREDIT" && account.currencyCode === "BRL")
    .reduce((total, account) => total + account.balance, 0), [initialOverview.accounts]);

  async function openConnect(itemId?: string) {
    setError(null);
    setSuccess(null);
    setLoadingItemId(itemId ?? "new");
    try {
      const response = await fetch("/api/pluggy/connect-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemId ? { itemId } : {}),
      });
      const payload = await response.json() as { accessToken?: string; message?: string };
      if (!response.ok || !payload.accessToken) throw new Error(payload.message ?? "Não foi possível abrir a Pluggy.");
      setUpdatingItemId(itemId ?? null);
      setConnectToken(payload.accessToken);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível abrir a Pluggy.");
    } finally {
      setLoadingItemId(null);
    }
  }

  async function saveItem({ item }: { item: Item }) {
    setError(null);
    try {
      const response = await fetch("/api/pluggy/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Não foi possível salvar a conexão.");
      setConnectToken(null);
      setUpdatingItemId(null);
      setSuccess("Instituição conectada e dados atualizados com sucesso.");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível salvar a conexão.");
    }
  }

  return (
    <>
      <div className="topbar page-topbar">
        <div><span className="eyebrow">Open Finance</span><h1>Contas conectadas</h1><p className="page-description">Saldos trazidos diretamente das suas instituições financeiras.</p></div>
        <div className="topbar-actions">
          <ThemeToggle />
          <button className="primary-button" type="button" onClick={() => openConnect()} disabled={loadingItemId !== null}>
            {loadingItemId === "new" ? <LoaderCircle className="spin" size={17} /> : <Plus size={17} />}<span>Conectar instituição</span>
          </button>
        </div>
      </div>

      {success && <div className="feedback success">{success}</div>}
      {error && <div className="feedback error">{error}</div>}
      {initialOverview.warnings.map((warning) => <div className="feedback error" key={warning}>{warning}</div>)}

      <section className="summary-grid" aria-label="Resumo das contas">
        <article className="summary-card"><span>Saldo bancário em BRL</span><strong>{formatMoney(bankBalance, "BRL")}</strong><small>Contas correntes e poupanças</small><span className="metric-icon"><Landmark size={17} /></span></article>
        <article className="summary-card"><span>Faturas em BRL</span><strong>{formatMoney(creditBalance, "BRL")}</strong><small>Saldo informado pelos cartões</small><span className="metric-icon expense-icon"><CreditCard size={17} /></span></article>
        <article className="summary-card"><span>Instituições</span><strong>{initialOverview.connections.length}</strong><small>{initialOverview.accounts.length} contas sincronizadas</small><span className="metric-icon"><Building2 size={17} /></span></article>
      </section>

      <section className="accounts-layout">
        <article className="card section-card">
          <div className="section-head"><div><h2>Suas contas</h2><p>Dados atualizados pela Pluggy.</p></div></div>
          {initialOverview.accounts.length === 0 ? (
            <div className="investment-empty"><WalletCards size={28} /><h3>Nenhuma conta conectada</h3><p>Conecte uma instituição para reunir saldos bancários e cartões em um só lugar.</p><button className="primary-button" type="button" onClick={() => openConnect()}><Plus size={17} /> Conectar agora</button></div>
          ) : (
            <div className="connected-account-list">
              {initialOverview.accounts.map((account) => (
                <div className="connected-account" key={account.id}>
                  <span className="institution-logo">{account.institutionImageUrl ? <span className="institution-logo-image" style={{ backgroundImage: `url(${account.institutionImageUrl})` }} /> : <Building2 size={19} />}</span>
                  <span className="connected-account-copy"><strong>{account.name}</strong><small>{account.institutionName} · {accountTypeLabel(account.type)} · {account.number}</small></span>
                  <span className="connected-account-balance"><strong>{formatMoney(account.balance, account.currencyCode)}</strong>{account.availableCreditLimit !== null && <small>Limite disponível: {formatMoney(account.availableCreditLimit, account.currencyCode)}</small>}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <aside className="card section-card">
          <div className="section-head"><div><h2>Instituições</h2><p>Gerencie o consentimento e atualize acessos.</p></div></div>
          <div className="connection-list">
            {initialOverview.connections.map((connection) => (
              <div className="connection-row" key={connection.itemId}>
                <span className="institution-logo">{connection.institutionImageUrl ? <span className="institution-logo-image" style={{ backgroundImage: `url(${connection.institutionImageUrl})` }} /> : <Building2 size={19} />}</span>
                <span><strong>{connection.institutionName}</strong><small>{connection.status === "UPDATED" ? "Sincronizada" : "Requer atualização"}</small></span>
                <button className="icon-button subtle" type="button" aria-label={`Atualizar ${connection.institutionName}`} onClick={() => openConnect(connection.itemId)} disabled={loadingItemId !== null}>
                  {loadingItemId === connection.itemId ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />}
                </button>
              </div>
            ))}
            {initialOverview.connections.length === 0 && <p className="connection-helper">As instituições conectadas aparecerão aqui.</p>}
          </div>
        </aside>
      </section>

      <section className="card section-card recent-transactions-card">
        <div className="section-head"><div><h2>Transações recentes</h2><p>Últimos 30 dias das contas conectadas.</p></div></div>
        {initialOverview.transactions.length === 0 ? (
          <div className="empty-list"><span className="empty-icon"><WalletCards size={19} /></span><div><strong>Nenhuma transação encontrada</strong><p>As movimentações aparecerão após a primeira sincronização da instituição.</p></div></div>
        ) : (
          <div className="open-finance-transactions">
            {initialOverview.transactions.map((transaction) => {
              const isIncome = transaction.type === "CREDIT";
              const signedAmount = isIncome ? Math.abs(transaction.amount) : -Math.abs(transaction.amount);
              return (
                <div className="transaction" key={transaction.id}>
                  <span className={`transaction-icon${isIncome ? "" : " expense-icon"}`}>{isIncome ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</span>
                  <span><strong>{transaction.description}</strong><span>{transaction.institutionName} · {transaction.accountName} · {new Intl.DateTimeFormat("pt-BR").format(transaction.date)}</span></span>
                  <span className={`transaction-value ${isIncome ? "positive" : "negative"}`}>{formatMoney(signedAmount, transaction.currencyCode)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          updateItem={updatingItemId ?? undefined}
          includeSandbox
          language="pt"
          countries={["BR"]}
          onSuccess={saveItem}
          onError={({ message }) => setError(message || "A conexão não foi concluída.")}
          onClose={() => { setConnectToken(null); setUpdatingItemId(null); }}
        />
      )}
    </>
  );
}

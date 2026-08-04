"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CreditCard, LoaderCircle, Plus, ReceiptText, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { expenseCategories } from "../domain/expense-category";
import type { CardExpenseListItem } from "../services/list-card-expenses-service";
import { parseCurrencyToCents } from "@/utils/currency-input";
import { addMonthsToIsoDate } from "@/utils/installment-date";
import { formatCurrency } from "@/utils/money";

interface ExpenseDraft {
  description: string;
  totalAmount: string;
  firstDueDate: string;
  categoryId: (typeof expenseCategories)[number]["value"];
  creditCardName: string;
  installmentCount: string;
}

function todayAsInputValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function newDraft(): ExpenseDraft {
  return { description: "", totalAmount: "", firstDueDate: todayAsInputValue(), categoryId: "shopping", creditCardName: "", installmentCount: "1" };
}

function centsToCurrency(cents: number | string) {
  return formatCurrency(Number(cents) / 100);
}

export function ExpensesPage({ initialExpenses, startWithForm }: { initialExpenses: CardExpenseListItem[]; startWithForm: boolean }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(startWithForm || initialExpenses.length === 0);
  const [draft, setDraft] = useState<ExpenseDraft>(newDraft());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const threeMonthsEnd = new Date(now.getFullYear(), now.getMonth() + 4, 1);
  const currentBill = initialExpenses.filter((expense) => {
    const dueDate = new Date(expense.dueDate);
    return dueDate >= monthStart && dueDate < nextMonthStart;
  });
  const nextThreeMonths = initialExpenses.filter((expense) => {
    const dueDate = new Date(expense.dueDate);
    return dueDate >= nextMonthStart && dueDate < threeMonthsEnd;
  });
  const futureExpenses = initialExpenses.filter((expense) => new Date(expense.dueDate) >= monthStart);
  const knownCards = [...new Set(initialExpenses.map((expense) => expense.creditCardName))].sort();
  const totalAmountInCents = parseCurrencyToCents(draft.totalAmount);
  const installmentCount = Math.min(36, Math.max(1, Number(draft.installmentCount) || 1));
  const baseInstallment = totalAmountInCents ? Math.floor(totalAmountInCents / installmentCount) : 0;
  const remainder = totalAmountInCents ? totalAmountInCents % installmentCount : 0;
  const lastDueDate = addMonthsToIsoDate(draft.firstDueDate, installmentCount - 1);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!draft.description.trim() || !draft.creditCardName.trim() || totalAmountInCents === null) {
      setError("Informe descrição, cartão e valor total válido.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: draft.description.trim(),
          totalAmountInCents,
          firstDueDate: draft.firstDueDate,
          categoryId: draft.categoryId,
          creditCardName: draft.creditCardName.trim(),
          installmentCount,
        }),
      });
      const payload = await response.json() as { message?: string; count?: number };
      if (!response.ok) throw new Error(payload.message ?? "Não foi possível salvar a compra.");

      const count = payload.count ?? installmentCount;
      setSuccess(count === 1 ? "Saída salva com sucesso." : `Compra salva e ${count} parcelas foram geradas.`);
      setDraft(newDraft());
      setShowForm(false);
      router.replace("/saidas");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível salvar a compra.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <header className="topbar page-topbar">
        <div><p className="eyebrow">Cartões e parcelas</p><h1>Saídas</h1><p className="page-description">Registre compras e acompanhe as parcelas futuras.</p></div>
        <div className="actions"><ThemeToggle /><button className="primary-button" type="button" onClick={() => { setShowForm(true); setSuccess(null); }}><Plus size={17} /><span>Nova saída</span></button></div>
      </header>

      {success && <div className="feedback success" role="status">{success}</div>}

      <section className="summary-grid" aria-label="Resumo das saídas">
        <article className="card metric"><div className="metric-head"><span>Fatura do mês</span><span className="metric-icon expense-icon"><CreditCard size={17} /></span></div><strong className="metric-value">{centsToCurrency(currentBill.reduce((sum, item) => sum + Number(item.amountInCents), 0))}</strong><p className="metric-note">{currentBill.length} {currentBill.length === 1 ? "parcela no mês" : "parcelas no mês"}</p></article>
        <article className="card metric"><div className="metric-head"><span>Próximos 3 meses</span><span className="metric-icon"><CalendarDays size={17} /></span></div><strong className="metric-value">{centsToCurrency(nextThreeMonths.reduce((sum, item) => sum + Number(item.amountInCents), 0))}</strong><p className="metric-note">Compromissos já programados</p></article>
        <article className="card metric"><div className="metric-head"><span>Parcelas futuras</span></div><strong className="metric-value">{centsToCurrency(futureExpenses.reduce((sum, item) => sum + Number(item.amountInCents), 0))}</strong><p className="metric-note">{futureExpenses.length} lançamentos pendentes</p></article>
      </section>

      {showForm && (
        <section className="card entry-form-card" aria-labelledby="expense-form-title">
          <header className="section-head form-head"><div><h2 id="expense-form-title">Cadastrar compra no cartão</h2><p>O valor total será distribuído automaticamente entre as faturas.</p></div><button className="icon-button subtle" type="button" onClick={() => setShowForm(false)} aria-label="Fechar formulário"><X size={17} /></button></header>
          <form onSubmit={handleSubmit} noValidate>
            <div className="expense-form-grid">
              <label className="field field-description"><span>Descrição</span><input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Ex.: Tênis" maxLength={120} required /></label>
              <label className="field"><span>Categoria</span><select value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value as ExpenseDraft["categoryId"] })}>{expenseCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label>
              <label className="field"><span>Cartão</span><input list="known-cards" value={draft.creditCardName} onChange={(event) => setDraft({ ...draft, creditCardName: event.target.value })} placeholder="Ex.: Sicredi" maxLength={60} required /><datalist id="known-cards">{knownCards.map((card) => <option key={card} value={card} />)}</datalist></label>
              <label className="field"><span>Valor total da compra</span><input value={draft.totalAmount} onChange={(event) => setDraft({ ...draft, totalAmount: event.target.value })} placeholder="0,00" inputMode="decimal" required /></label>
              <label className="field"><span>Quantidade de parcelas</span><input type="number" min="1" max="36" value={draft.installmentCount} onChange={(event) => setDraft({ ...draft, installmentCount: event.target.value })} required /></label>
              <label className="field"><span>Primeiro vencimento</span><input type="date" value={draft.firstDueDate} onChange={(event) => setDraft({ ...draft, firstDueDate: event.target.value })} required /></label>
            </div>
            {totalAmountInCents !== null && (
              <div className="installment-preview" role="status"><span className="preview-icon"><ReceiptText size={18} /></span><div><strong>{installmentCount === 1 ? "Compra à vista" : `${installmentCount} parcelas de aproximadamente ${centsToCurrency(baseInstallment)}`}</strong><p>{remainder > 0 && installmentCount > 1 ? `As primeiras ${remainder} parcelas recebem R$ 0,01 adicional. ` : ""}Último vencimento em {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${lastDueDate}T12:00:00.000Z`))}.</p></div></div>
            )}
            {error && <p className="login-error form-error" role="alert">{error}</p>}
            <div className="form-actions expense-actions"><span className="form-helper">Você poderá acompanhar cada parcela separadamente.</span><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? <LoaderCircle className="spin" size={17} /> : <CreditCard size={17} />}<span>{isSaving ? "Salvando…" : "Salvar compra"}</span></button></div>
          </form>
        </section>
      )}

      <section className="card section-card entries-card">
        <header className="section-head"><div><h2>Parcelas do cartão</h2><p>Agenda de vencimentos gerada pelas suas compras</p></div></header>
        {initialExpenses.length > 0 ? (
          <div className="entries-table-wrap"><table className="entries-table expenses-table"><thead><tr><th>Descrição</th><th>Cartão</th><th>Categoria</th><th>Parcela</th><th>Vencimento</th><th className="align-right">Valor</th></tr></thead><tbody>{initialExpenses.map((expense) => { const dueDate = new Date(expense.dueDate); const isFuture = dueDate >= nextMonthStart; return <tr key={expense.id}><td><strong>{expense.description}</strong></td><td>{expense.creditCardName}</td><td><span className="category-chip expense-chip">{expense.category}</span></td><td><span className="installment-chip">{expense.installmentNumber}/{expense.installmentCount}</span></td><td>{new Intl.DateTimeFormat("pt-BR").format(dueDate)}{isFuture && <small className="future-label">Futura</small>}</td><td className="align-right negative"><strong>− {centsToCurrency(expense.amountInCents)}</strong></td></tr>; })}</tbody></table></div>
        ) : (
          <div className="empty-list entries-empty"><span className="empty-icon"><CreditCard size={21} /></span><div><strong>Nenhuma saída cadastrada</strong><p>Use “Nova saída” para registrar sua primeira compra no cartão.</p></div></div>
        )}
      </section>
    </>
  );
}

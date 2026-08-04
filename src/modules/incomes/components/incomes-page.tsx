"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { incomeCategories } from "../domain/income-category";
import type { IncomeListItem } from "../services/list-incomes-service";
import { parseCurrencyToCents } from "@/utils/currency-input";
import { formatCurrency } from "@/utils/money";

interface IncomeRow {
  localId: string;
  description: string;
  amount: string;
  occurredAt: string;
  categoryId: (typeof incomeCategories)[number]["value"];
}

function todayAsInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function newRow(): IncomeRow {
  return {
    localId: crypto.randomUUID(),
    description: "",
    amount: "",
    occurredAt: todayAsInputValue(),
    categoryId: "salary",
  };
}

function centsToCurrency(cents: string) {
  return formatCurrency(Number(cents) / 100);
}

export function IncomesPage({ initialEntries, startWithForm }: { initialEntries: IncomeListItem[]; startWithForm: boolean }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(startWithForm || initialEntries.length === 0);
  const [rows, setRows] = useState<IncomeRow[]>([newRow()]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const entriesThisMonth = initialEntries.filter((entry) => {
    const date = new Date(entry.occurredAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const totalThisMonth = entriesThisMonth.reduce((total, entry) => total + Number(entry.amountInCents), 0);
  const averageThisMonth = entriesThisMonth.length > 0 ? totalThisMonth / entriesThisMonth.length : 0;

  function updateRow(localId: string, field: keyof Omit<IncomeRow, "localId">, value: string) {
    setRows((current) => current.map((row) => row.localId === localId ? { ...row, [field]: value } : row));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    let entries: Array<{
      description: string;
      amountInCents: number;
      occurredAt: string;
      categoryId: IncomeRow["categoryId"];
    }>;
    try {
      entries = rows.map((row, index) => {
        const amountInCents = parseCurrencyToCents(row.amount);
        if (!row.description.trim()) throw new Error(`Informe a descrição da entrada ${index + 1}.`);
        if (amountInCents === null) throw new Error(`Informe um valor válido na entrada ${index + 1}.`);
        return {
          description: row.description.trim(),
          amountInCents,
          occurredAt: row.occurredAt,
          categoryId: row.categoryId,
        };
      });
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : "Revise os valores informados.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/incomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      const payload = await response.json() as { message?: string; count?: number };

      if (!response.ok) throw new Error(payload.message ?? "Não foi possível salvar.");

      const count = payload.count ?? entries.length;
      setSuccess(count === 1 ? "Entrada salva com sucesso." : `${count} entradas salvas com sucesso.`);
      setRows([newRow()]);
      setShowForm(false);
      router.replace("/entradas");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível salvar as entradas.");
    } finally {
      setIsSaving(false);
    }
  }

  function openForm() {
    setError(null);
    setSuccess(null);
    setShowForm(true);
  }

  return (
    <>
      <header className="topbar page-topbar">
        <div><p className="eyebrow">Fluxo de caixa</p><h1>Entradas</h1><p className="page-description">Cadastre salários e outros valores recebidos.</p></div>
        <div className="actions"><ThemeToggle /><button className="primary-button" type="button" onClick={openForm}><Plus size={17} /><span>Nova entrada</span></button></div>
      </header>

      {success && <div className="feedback success" role="status">{success}</div>}

      <section className="summary-grid" aria-label="Resumo das entradas">
        <article className="card metric"><div className="metric-head"><span>Recebido no mês</span><span className="metric-icon"><ArrowDownToLine size={17} /></span></div><strong className="metric-value">{formatCurrency(totalThisMonth / 100)}</strong><p className="metric-note">{entriesThisMonth.length} {entriesThisMonth.length === 1 ? "entrada cadastrada" : "entradas cadastradas"}</p></article>
        <article className="card metric"><div className="metric-head"><span>Média por entrada</span></div><strong className="metric-value">{formatCurrency(averageThisMonth / 100)}</strong><p className="metric-note">Considerando o mês atual</p></article>
        <article className="card metric"><div className="metric-head"><span>Total histórico</span></div><strong className="metric-value">{formatCurrency(initialEntries.reduce((total, entry) => total + Number(entry.amountInCents), 0) / 100)}</strong><p className="metric-note">{initialEntries.length} lançamentos registrados</p></article>
      </section>

      {showForm && (
        <section className="card entry-form-card" aria-labelledby="entry-form-title">
          <header className="section-head form-head"><div><h2 id="entry-form-title">Cadastrar entradas</h2><p>Você pode salvar até 20 lançamentos de uma vez.</p></div><button className="icon-button subtle" type="button" onClick={() => setShowForm(false)} aria-label="Fechar formulário"><X size={17} /></button></header>
          <form onSubmit={handleSubmit} noValidate>
            <div className="entry-rows">
              {rows.map((row, index) => (
                <fieldset className="entry-row" key={row.localId}>
                  <legend>Entrada {index + 1}</legend>
                  <label className="field field-description"><span>Descrição</span><input value={row.description} onChange={(event) => updateRow(row.localId, "description", event.target.value)} placeholder="Ex.: Salário de agosto" maxLength={120} required /></label>
                  <label className="field"><span>Categoria</span><select value={row.categoryId} onChange={(event) => updateRow(row.localId, "categoryId", event.target.value)}>{incomeCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label>
                  <label className="field"><span>Valor</span><input value={row.amount} onChange={(event) => updateRow(row.localId, "amount", event.target.value)} placeholder="0,00" inputMode="decimal" required /></label>
                  <label className="field"><span>Data do recebimento</span><input type="date" value={row.occurredAt} onChange={(event) => updateRow(row.localId, "occurredAt", event.target.value)} required /></label>
                  {rows.length > 1 && <button className="remove-row" type="button" onClick={() => setRows((current) => current.filter((item) => item.localId !== row.localId))} aria-label={`Remover entrada ${index + 1}`}><Trash2 size={16} /></button>}
                </fieldset>
              ))}
            </div>
            {error && <p className="login-error form-error" role="alert">{error}</p>}
            <div className="form-actions"><button className="secondary-button" type="button" onClick={() => setRows((current) => [...current, newRow()])} disabled={rows.length >= 20}><Plus size={16} />Adicionar outra entrada</button><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? <LoaderCircle className="spin" size={17} /> : <ArrowDownToLine size={17} />}<span>{isSaving ? "Salvando…" : `Salvar ${rows.length === 1 ? "entrada" : `${rows.length} entradas`}`}</span></button></div>
          </form>
        </section>
      )}

      <section className="card section-card entries-card">
        <header className="section-head"><div><h2>Histórico de entradas</h2><p>Valores efetivamente cadastrados por você</p></div></header>
        {initialEntries.length > 0 ? (
          <div className="entries-table-wrap"><table className="entries-table"><thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th className="align-right">Valor</th></tr></thead><tbody>{initialEntries.map((entry) => <tr key={entry.id}><td><strong>{entry.description}</strong></td><td><span className="category-chip">{entry.category}</span></td><td>{new Intl.DateTimeFormat("pt-BR").format(new Date(entry.occurredAt))}</td><td className="align-right positive"><strong>+ {centsToCurrency(entry.amountInCents)}</strong></td></tr>)}</tbody></table></div>
        ) : (
          <div className="empty-list entries-empty"><span className="empty-icon"><ArrowDownToLine size={21} /></span><div><strong>Nenhuma entrada cadastrada</strong><p>Use “Nova entrada” para registrar seu primeiro recebimento.</p></div></div>
        )}
      </section>
    </>
  );
}

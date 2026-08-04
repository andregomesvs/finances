"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CreditCard, LoaderCircle, Pencil, Plus, ReceiptText, Repeat2, Trash2, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { expenseCategories } from "../domain/expense-category";
import type { CardExpenseListItem } from "../services/list-card-expenses-service";
import type { FixedExpenseListItem } from "@/modules/fixed-expenses/services/fixed-expense-services";
import { isFixedExpenseActiveInMonth } from "@/modules/fixed-expenses/services/fixed-expense-services";
import { parseCurrencyToCents } from "@/utils/currency-input";
import { addMonthsToIsoDate } from "@/utils/installment-date";
import { formatCurrency } from "@/utils/money";

type ExpenseCategoryValue = (typeof expenseCategories)[number]["value"];
interface CardDraft { description: string; totalAmount: string; firstDueDate: string; categoryId: ExpenseCategoryValue; creditCardName: string; installmentCount: string; }
interface FixedDraft { description: string; amount: string; categoryId: ExpenseCategoryValue; dueDay: string; startMonth: string; endMonth: string; }
interface DeleteTarget { type: "card" | "fixed"; id: string; label: string; detail: string; }

function dateInput() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; }
function monthInput() { return dateInput().slice(0, 7); }
function newCardDraft(): CardDraft { return { description: "", totalAmount: "", firstDueDate: dateInput(), categoryId: "shopping", creditCardName: "", installmentCount: "1" }; }
function newFixedDraft(): FixedDraft { return { description: "", amount: "", categoryId: "telecom", dueDay: "10", startMonth: monthInput(), endMonth: "" }; }
function centsToCurrency(cents: number | string) { return formatCurrency(Number(cents) / 100); }
function centsToInput(cents: string) { return (Number(cents) / 100).toFixed(2).replace(".", ","); }

export function ExpensesPage({ initialExpenses, initialFixedExpenses, initialForm }: { initialExpenses: CardExpenseListItem[]; initialFixedExpenses: FixedExpenseListItem[]; initialForm?: string; }) {
  const router = useRouter();
  const [formMode, setFormMode] = useState<"card" | "fixed" | null>(initialForm === "fixo" ? "fixed" : initialForm === "cartao" || (initialExpenses.length === 0 && initialFixedExpenses.length === 0) ? "card" : null);
  const [cardDraft, setCardDraft] = useState<CardDraft>(newCardDraft());
  const [fixedDraft, setFixedDraft] = useState<FixedDraft>(newFixedDraft());
  const [editingCardGroup, setEditingCardGroup] = useState<string | null>(null);
  const [editingFixedId, setEditingFixedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const currentBill = initialExpenses.filter((item) => { const date = new Date(item.dueDate); return date >= monthStart && date < nextMonthStart; });
  const activeFixed = initialFixedExpenses.filter((item) => isFixedExpenseActiveInMonth(item, currentMonthKey));
  const cardTotal = currentBill.reduce((sum, item) => sum + Number(item.amountInCents), 0);
  const fixedTotal = activeFixed.reduce((sum, item) => sum + Number(item.amountInCents), 0);
  const knownCards = [...new Set(initialExpenses.map((item) => item.creditCardName))].sort();
  const totalAmountInCents = parseCurrencyToCents(cardDraft.totalAmount);
  const installmentCount = Math.min(36, Math.max(1, Number(cardDraft.installmentCount) || 1));
  const installmentValue = totalAmountInCents ? Math.floor(totalAmountInCents / installmentCount) : 0;

  function closeForm() { setFormMode(null); setEditingCardGroup(null); setEditingFixedId(null); setError(null); }
  function openCardCreate() { setCardDraft(newCardDraft()); setEditingCardGroup(null); setFormMode("card"); setError(null); setSuccess(null); }
  function openFixedCreate() { setFixedDraft(newFixedDraft()); setEditingFixedId(null); setFormMode("fixed"); setError(null); setSuccess(null); }

  function openCardEdit(item: CardExpenseListItem) {
    const group = initialExpenses.filter((candidate) => candidate.installmentGroupId === item.installmentGroupId);
    const first = group.reduce((earliest, candidate) => candidate.installmentNumber < earliest.installmentNumber ? candidate : earliest, group[0]!);
    setCardDraft({ description: item.description, totalAmount: centsToInput(item.originalAmountInCents), firstDueDate: first.dueDate.slice(0, 10), categoryId: item.categoryId, creditCardName: item.creditCardName, installmentCount: String(item.installmentCount) });
    setEditingCardGroup(item.installmentGroupId); setFormMode("card"); setError(null); setSuccess(null); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openFixedEdit(item: FixedExpenseListItem) {
    setFixedDraft({ description: item.description, amount: centsToInput(item.amountInCents), categoryId: item.categoryId, dueDay: String(item.dueDay), startMonth: item.startMonth, endMonth: item.endMonth ?? "" });
    setEditingFixedId(item.id); setFormMode("fixed"); setError(null); setSuccess(null); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveCard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setSuccess(null);
    if (!cardDraft.description.trim() || !cardDraft.creditCardName.trim() || totalAmountInCents === null) { setError("Informe descrição, cartão e valor total válido."); return; }
    setIsBusy(true);
    try {
      const url = editingCardGroup ? `/api/expenses/${editingCardGroup}` : "/api/expenses";
      const response = await fetch(url, { method: editingCardGroup ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description: cardDraft.description.trim(), totalAmountInCents, firstDueDate: cardDraft.firstDueDate, categoryId: cardDraft.categoryId, creditCardName: cardDraft.creditCardName.trim(), installmentCount }) });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Não foi possível salvar a compra.");
      setSuccess(editingCardGroup ? "Compra e parcelas atualizadas com sucesso." : "Compra e parcelas salvas com sucesso."); closeForm(); router.replace("/saidas"); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível salvar a compra."); } finally { setIsBusy(false); }
  }

  async function saveFixed(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setSuccess(null);
    const amountInCents = parseCurrencyToCents(fixedDraft.amount);
    if (!fixedDraft.description.trim() || amountInCents === null) { setError("Informe descrição e valor mensal válido."); return; }
    setIsBusy(true);
    try {
      const url = editingFixedId ? `/api/fixed-expenses/${editingFixedId}` : "/api/fixed-expenses";
      const response = await fetch(url, { method: editingFixedId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description: fixedDraft.description.trim(), amountInCents, categoryId: fixedDraft.categoryId, dueDay: Number(fixedDraft.dueDay), startMonth: fixedDraft.startMonth, endMonth: fixedDraft.endMonth || null }) });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Não foi possível salvar o gasto fixo.");
      setSuccess(editingFixedId ? "Gasto fixo atualizado com sucesso." : "Gasto fixo cadastrado com sucesso."); closeForm(); router.replace("/saidas"); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível salvar o gasto fixo."); } finally { setIsBusy(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return; setIsBusy(true); setError(null);
    try {
      const url = deleteTarget.type === "card" ? `/api/expenses/${deleteTarget.id}` : `/api/fixed-expenses/${deleteTarget.id}`;
      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) { const payload = await response.json() as { message?: string }; throw new Error(payload.message ?? "Não foi possível apagar."); }
      setSuccess(deleteTarget.type === "card" ? "Compra e todas as parcelas foram apagadas." : "Gasto fixo apagado com sucesso."); setDeleteTarget(null); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível apagar."); } finally { setIsBusy(false); }
  }

  return <>
    <header className="topbar page-topbar"><div><p className="eyebrow">Cartões e recorrências</p><h1>Saídas</h1><p className="page-description">Compras parceladas e gastos fixos em um só lugar.</p></div><div className="actions"><ThemeToggle /><button className="secondary-button" onClick={openFixedCreate}><Repeat2 size={16} />Gasto fixo</button><button className="primary-button" onClick={openCardCreate}><Plus size={17} /><span>Compra no cartão</span></button></div></header>
    {success && <div className="feedback success" role="status">{success}</div>}
    <section className="summary-grid"><article className="card metric"><div className="metric-head"><span>Saídas no mês</span><span className="metric-icon expense-icon"><ReceiptText size={17} /></span></div><strong className="metric-value">{centsToCurrency(cardTotal + fixedTotal)}</strong><p className="metric-note">Cartão + gastos fixos</p></article><article className="card metric"><div className="metric-head"><span>Cartões no mês</span><span className="metric-icon expense-icon"><CreditCard size={17} /></span></div><strong className="metric-value">{centsToCurrency(cardTotal)}</strong><p className="metric-note">{currentBill.length} parcelas</p></article><article className="card metric"><div className="metric-head"><span>Gastos fixos no mês</span><span className="metric-icon"><Repeat2 size={17} /></span></div><strong className="metric-value">{centsToCurrency(fixedTotal)}</strong><p className="metric-note">{activeFixed.length} compromissos ativos</p></article></section>

    {formMode === "card" && <section className="card entry-form-card"><header className="section-head form-head"><div><h2>{editingCardGroup ? "Editar compra" : "Cadastrar compra no cartão"}</h2><p>Ao editar, todas as parcelas da compra serão recalculadas.</p></div><button className="icon-button subtle" onClick={closeForm} aria-label="Fechar"><X size={17} /></button></header><form onSubmit={saveCard}><div className="expense-form-grid"><label className="field field-description"><span>Descrição</span><input value={cardDraft.description} onChange={(e) => setCardDraft({ ...cardDraft, description: e.target.value })} required /></label><label className="field"><span>Categoria</span><select value={cardDraft.categoryId} onChange={(e) => setCardDraft({ ...cardDraft, categoryId: e.target.value as ExpenseCategoryValue })}>{expenseCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label><label className="field"><span>Cartão</span><input list="known-cards" value={cardDraft.creditCardName} onChange={(e) => setCardDraft({ ...cardDraft, creditCardName: e.target.value })} required /><datalist id="known-cards">{knownCards.map((card) => <option key={card} value={card} />)}</datalist></label><label className="field"><span>Valor total</span><input value={cardDraft.totalAmount} onChange={(e) => setCardDraft({ ...cardDraft, totalAmount: e.target.value })} inputMode="decimal" required /></label><label className="field"><span>Parcelas</span><input type="number" min="1" max="36" value={cardDraft.installmentCount} onChange={(e) => setCardDraft({ ...cardDraft, installmentCount: e.target.value })} /></label><label className="field"><span>Primeiro vencimento</span><input type="date" value={cardDraft.firstDueDate} onChange={(e) => setCardDraft({ ...cardDraft, firstDueDate: e.target.value })} /></label></div>{totalAmountInCents && <div className="installment-preview"><span className="preview-icon"><CalendarDays size={18} /></span><div><strong>{installmentCount}x de aproximadamente {centsToCurrency(installmentValue)}</strong><p>Último vencimento: {addMonthsToIsoDate(cardDraft.firstDueDate, installmentCount - 1)}</p></div></div>}{error && <p className="login-error form-error">{error}</p>}<div className="form-actions"><button type="button" className="secondary-button" onClick={closeForm}>Cancelar</button><button className="primary-button" disabled={isBusy}>{isBusy && <LoaderCircle className="spin" size={17} />}{editingCardGroup ? "Salvar alterações" : "Salvar compra"}</button></div></form></section>}

    {formMode === "fixed" && <section className="card entry-form-card"><header className="section-head form-head"><div><h2>{editingFixedId ? "Editar gasto fixo" : "Cadastrar gasto fixo"}</h2><p>Use término opcional para financiamento, seguro parcelado ou contratos.</p></div><button className="icon-button subtle" onClick={closeForm} aria-label="Fechar"><X size={17} /></button></header><form onSubmit={saveFixed}><div className="expense-form-grid"><label className="field field-description"><span>Descrição</span><input value={fixedDraft.description} onChange={(e) => setFixedDraft({ ...fixedDraft, description: e.target.value })} placeholder="Ex.: Parcela do carro" required /></label><label className="field"><span>Categoria</span><select value={fixedDraft.categoryId} onChange={(e) => setFixedDraft({ ...fixedDraft, categoryId: e.target.value as ExpenseCategoryValue })}>{expenseCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label><label className="field"><span>Valor mensal</span><input value={fixedDraft.amount} onChange={(e) => setFixedDraft({ ...fixedDraft, amount: e.target.value })} inputMode="decimal" required /></label><label className="field"><span>Dia do vencimento</span><input type="number" min="1" max="31" value={fixedDraft.dueDay} onChange={(e) => setFixedDraft({ ...fixedDraft, dueDay: e.target.value })} /></label><label className="field"><span>Início</span><input type="month" value={fixedDraft.startMonth} onChange={(e) => setFixedDraft({ ...fixedDraft, startMonth: e.target.value })} /></label><label className="field"><span>Término opcional</span><input type="month" value={fixedDraft.endMonth} onChange={(e) => setFixedDraft({ ...fixedDraft, endMonth: e.target.value })} /></label></div>{error && <p className="login-error form-error">{error}</p>}<div className="form-actions"><button type="button" className="secondary-button" onClick={closeForm}>Cancelar</button><button className="primary-button" disabled={isBusy}>{isBusy && <LoaderCircle className="spin" size={17} />}{editingFixedId ? "Salvar alterações" : "Salvar gasto fixo"}</button></div></form></section>}

    <section className="card section-card entries-card"><header className="section-head"><div><h2>Gastos fixos</h2><p>Contas mensais somadas automaticamente às saídas</p></div><button className="text-button" onClick={openFixedCreate}>Adicionar</button></header>{initialFixedExpenses.length ? <div className="entries-table-wrap"><table className="entries-table"><thead><tr><th>Descrição</th><th>Categoria</th><th>Vencimento</th><th>Período</th><th className="align-right">Valor mensal</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{initialFixedExpenses.map((item) => <tr key={item.id}><td><strong>{item.description}</strong></td><td><span className="category-chip expense-chip">{item.category}</span></td><td>Dia {item.dueDay}</td><td>{item.startMonth} → {item.endMonth ?? "contínuo"}</td><td className="align-right negative"><strong>− {centsToCurrency(item.amountInCents)}</strong></td><td className="row-actions"><button onClick={() => openFixedEdit(item)} aria-label={`Editar ${item.description}`}><Pencil size={15} /></button><button className="danger" onClick={() => setDeleteTarget({ type: "fixed", id: item.id, label: item.description, detail: "O gasto deixará de compor todos os meses." })} aria-label={`Apagar ${item.description}`}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div> : <div className="empty-list entries-empty"><span className="empty-icon"><Repeat2 size={21} /></span><div><strong>Nenhum gasto fixo</strong><p>Cadastre telefonia, seguro, parcela do carro e outras contas mensais.</p></div></div>}</section>

    <section className="card section-card entries-card"><header className="section-head"><div><h2>Parcelas do cartão</h2><p>Editar ou apagar atua sobre a compra completa</p></div><button className="text-button" onClick={openCardCreate}>Adicionar</button></header>{initialExpenses.length ? <div className="entries-table-wrap"><table className="entries-table expenses-table"><thead><tr><th>Descrição</th><th>Cartão</th><th>Categoria</th><th>Parcela</th><th>Vencimento</th><th className="align-right">Valor</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{initialExpenses.map((item) => <tr key={item.id}><td><strong>{item.description}</strong></td><td>{item.creditCardName}</td><td><span className="category-chip expense-chip">{item.category}</span></td><td><span className="installment-chip">{item.installmentNumber}/{item.installmentCount}</span></td><td>{new Intl.DateTimeFormat("pt-BR").format(new Date(item.dueDate))}</td><td className="align-right negative"><strong>− {centsToCurrency(item.amountInCents)}</strong></td><td className="row-actions"><button onClick={() => openCardEdit(item)} aria-label={`Editar compra ${item.description}`}><Pencil size={15} /></button><button className="danger" onClick={() => setDeleteTarget({ type: "card", id: item.installmentGroupId, label: item.description, detail: `Todas as ${item.installmentCount} parcelas serão removidas.` })} aria-label={`Apagar compra ${item.description}`}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div> : <div className="empty-list entries-empty"><span className="empty-icon"><CreditCard size={21} /></span><div><strong>Nenhuma compra cadastrada</strong><p>Cadastre uma compra à vista ou parcelada.</p></div></div>}</section>

    {deleteTarget && <div className="dialog-backdrop"><section className="dialog-card confirmation-card" role="alertdialog" aria-modal="true"><span className="dialog-danger-icon"><Trash2 size={20} /></span><h2>Apagar {deleteTarget.type === "card" ? "compra" : "gasto fixo"}?</h2><p><strong>{deleteTarget.label}</strong>. {deleteTarget.detail}</p>{error && <p className="login-error form-error">{error}</p>}<div className="dialog-actions"><button className="secondary-button" onClick={() => setDeleteTarget(null)} disabled={isBusy}>Cancelar</button><button className="danger-button" onClick={confirmDelete} disabled={isBusy}>{isBusy && <LoaderCircle className="spin" size={17} />}Apagar</button></div></section></div>}
  </>;
}

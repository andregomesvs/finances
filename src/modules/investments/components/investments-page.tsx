"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, LoaderCircle, Pencil, Plus, Trash2, TrendingUp, Upload, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { parseCurrencyToCents } from "@/utils/currency-input";
import { investmentCategories, marketInvestmentCategories, yieldInvestmentCategories, type InvestmentCategory } from "../domain/investment-category";
import type { InvestmentCurrency, InvestmentRiskLevel } from "../domain/investment";
import type { InvestmentListItem } from "../services/investment-services";

interface InvestmentDraft {
  name: string;
  categoryId: InvestmentCategory;
  institution: string;
  investedAmount: string;
  currentAmount: string;
  currency: InvestmentCurrency;
  appliedAt: string;
  maturityDate: string;
  liquidity: string;
  riskLevel: InvestmentRiskLevel;
  taxation: string;
  annualReturnPct: string;
  ticker: string;
  quantity: string;
  averagePrice: string;
  yieldType: string;
  yieldRatePct: string;
  country: string;
  sector: string;
  notes: string;
}

function emptyDraft(): InvestmentDraft {
  return {
    name: "",
    categoryId: "cdb",
    institution: "",
    investedAmount: "",
    currentAmount: "",
    currency: "BRL",
    appliedAt: "",
    maturityDate: "",
    liquidity: "Liquidez diária",
    riskLevel: "LOW",
    taxation: "Tabela regressiva de IR",
    annualReturnPct: "",
    ticker: "",
    quantity: "",
    averagePrice: "",
    yieldType: "% do CDI",
    yieldRatePct: "",
    country: "Brasil",
    sector: "",
    notes: "",
  };
}

function moneyFromCents(cents: string | null, currency: InvestmentCurrency) {
  const value = Number(cents ?? 0) / 100;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
}

function centsToInput(cents: string | null) {
  return cents === null ? "" : (Number(cents) / 100).toFixed(2).replace(".", ",");
}

function riskLabel(risk: InvestmentRiskLevel) {
  return { LOW: "Baixo", MEDIUM: "Médio", HIGH: "Alto" }[risk];
}

function draftFromInvestment(investment: InvestmentListItem): InvestmentDraft {
  return {
    name: investment.name,
    categoryId: investment.categoryId,
    institution: investment.institution,
    investedAmount: centsToInput(investment.investedAmountInCents),
    currentAmount: centsToInput(investment.currentAmountInCents),
    currency: investment.currency,
    appliedAt: investment.appliedAt ?? "",
    maturityDate: investment.maturityDate ?? "",
    liquidity: investment.liquidity,
    riskLevel: investment.riskLevel,
    taxation: investment.taxation,
    annualReturnPct: investment.annualReturnPct?.toString().replace(".", ",") ?? "",
    ticker: investment.ticker ?? "",
    quantity: investment.quantity ?? "",
    averagePrice: centsToInput(investment.averagePriceInCents),
    yieldType: investment.yieldType ?? "",
    yieldRatePct: investment.yieldRatePct?.toString().replace(".", ",") ?? "",
    country: investment.country ?? "",
    sector: investment.sector ?? "",
    notes: investment.notes ?? "",
  };
}

export function InvestmentsPage({ initialInvestments, startWithForm }: { initialInvestments: InvestmentListItem[]; startWithForm: boolean }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(startWithForm || initialInvestments.length === 0);
  const [editing, setEditing] = useState<InvestmentListItem | null>(null);
  const [deleting, setDeleting] = useState<InvestmentListItem | null>(null);
  const [draft, setDraft] = useState<InvestmentDraft>(emptyDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!deleting) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && !isDeleting && setDeleting(null);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [deleting, isDeleting]);

  const brlInvestments = useMemo(() => initialInvestments.filter((item) => item.currency === "BRL"), [initialInvestments]);
  const totalInvested = brlInvestments.reduce((sum, item) => sum + Number(item.investedAmountInCents), 0);
  const totalCurrent = brlInvestments.reduce((sum, item) => sum + Number(item.currentAmountInCents), 0);
  const totalResult = totalCurrent - totalInvested;
  const foreignCount = initialInvestments.length - brlInvestments.length;
  const showMarketFields = marketInvestmentCategories.includes(draft.categoryId);
  const showYieldFields = yieldInvestmentCategories.includes(draft.categoryId);

  function update<K extends keyof InvestmentDraft>(field: K, value: InvestmentDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function openNew() {
    setEditing(null);
    setDraft(emptyDraft());
    setError(null);
    setSuccess(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEdit(investment: InvestmentListItem) {
    setEditing(investment);
    setDraft(draftFromInvestment(investment));
    setError(null);
    setSuccess(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setDraft(emptyDraft());
    setError(null);
    router.replace("/investimentos");
  }

  async function saveInvestment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const investedAmountInCents = parseCurrencyToCents(draft.investedAmount);
    const currentAmountInCents = parseCurrencyToCents(draft.currentAmount);
    const averagePriceInCents = draft.averagePrice ? parseCurrencyToCents(draft.averagePrice) : null;
    if (!draft.name.trim() || !draft.institution.trim() || !investedAmountInCents || !currentAmountInCents) {
      setError("Informe nome, instituição, valor aplicado e valor atual.");
      return;
    }

    const optionalNumber = (value: string) => value.trim() ? Number(value.replace(",", ".")) : null;
    const payload = {
      name: draft.name.trim(),
      categoryId: draft.categoryId,
      institution: draft.institution.trim(),
      investedAmountInCents,
      currentAmountInCents,
      currency: draft.currency,
      appliedAt: draft.appliedAt || null,
      maturityDate: draft.maturityDate || null,
      liquidity: draft.liquidity.trim(),
      riskLevel: draft.riskLevel,
      taxation: draft.taxation.trim(),
      annualReturnPct: optionalNumber(draft.annualReturnPct),
      ticker: draft.ticker.trim().toUpperCase() || null,
      quantity: draft.quantity.trim().replace(",", ".") || null,
      averagePriceInCents,
      yieldType: draft.yieldType.trim() || null,
      yieldRatePct: optionalNumber(draft.yieldRatePct),
      country: draft.country.trim() || null,
      sector: draft.sector.trim() || null,
      notes: draft.notes.trim() || null,
    };

    setIsSaving(true);
    try {
      const response = await fetch(editing ? `/api/investments/${encodeURIComponent(editing.id)}` : "/api/investments", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responsePayload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(responsePayload.message ?? "Não foi possível salvar o investimento.");
      setSuccess(editing ? "Investimento atualizado com sucesso." : "Investimento cadastrado com sucesso.");
      setShowForm(false);
      setEditing(null);
      setDraft(emptyDraft());
      router.replace("/investimentos");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível salvar o investimento.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteInvestment() {
    if (!deleting) return;
    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/investments/${encodeURIComponent(deleting.id)}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json() as { message?: string };
        throw new Error(payload.message ?? "Não foi possível apagar o investimento.");
      }
      setDeleting(null);
      setSuccess("Investimento apagado com sucesso.");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível apagar o investimento.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="topbar page-topbar">
        <div><span className="eyebrow">Patrimônio</span><h1>Investimentos</h1><p>Organize sua carteira e acompanhe cada posição.</p></div>
        <div className="topbar-actions">
          <ThemeToggle />
          <button className="secondary-button" type="button" disabled title="Disponível na próxima etapa"><Upload size={17} /> Importar documento</button>
          <button className="primary-button" type="button" onClick={openNew}><Plus size={17} /> Novo investimento</button>
        </div>
      </div>

      {success && <div className="feedback success">{success}</div>}
      {error && <div className="feedback error">{error}</div>}

      {showForm && (
        <form className="entry-form-card investment-form" onSubmit={saveInvestment}>
          <div className="section-head">
            <div><span className="eyebrow">Cadastro manual</span><h2>{editing ? "Editar investimento" : "Novo investimento"}</h2><p>Os campos se adaptam à categoria selecionada.</p></div>
            <button className="icon-button subtle" type="button" onClick={closeForm} aria-label="Fechar formulário"><X size={17} /></button>
          </div>
          <div className="investment-form-grid">
            <label className="field field-wide"><span>Nome do investimento</span><input value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="Ex.: CDB Banco XP 120% CDI" required /></label>
            <label className="field"><span>Categoria</span><select value={draft.categoryId} onChange={(event) => update("categoryId", event.target.value as InvestmentCategory)}>{investmentCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="field"><span>Instituição financeira</span><input value={draft.institution} onChange={(event) => update("institution", event.target.value)} placeholder="Banco ou corretora" required /></label>
            <label className="field"><span>Valor aplicado</span><input inputMode="decimal" value={draft.investedAmount} onChange={(event) => update("investedAmount", event.target.value)} placeholder="0,00" required /></label>
            <label className="field"><span>Valor atual</span><input inputMode="decimal" value={draft.currentAmount} onChange={(event) => update("currentAmount", event.target.value)} placeholder="0,00" required /></label>
            <label className="field"><span>Moeda</span><select value={draft.currency} onChange={(event) => update("currency", event.target.value as InvestmentCurrency)}><option value="BRL">Real (BRL)</option><option value="USD">Dólar (USD)</option><option value="EUR">Euro (EUR)</option></select></label>

            {showMarketFields && <>
              <label className="field"><span>Ticker / código</span><input value={draft.ticker} onChange={(event) => update("ticker", event.target.value)} placeholder="Ex.: PETR4" /></label>
              <label className="field"><span>Quantidade</span><input inputMode="decimal" value={draft.quantity} onChange={(event) => update("quantity", event.target.value)} placeholder="0" /></label>
              <label className="field"><span>Preço médio</span><input inputMode="decimal" value={draft.averagePrice} onChange={(event) => update("averagePrice", event.target.value)} placeholder="0,00" /></label>
            </>}

            {showYieldFields && <>
              <label className="field"><span>Tipo de rentabilidade</span><select value={draft.yieldType} onChange={(event) => update("yieldType", event.target.value)}><option>% do CDI</option><option>Prefixado</option><option>IPCA +</option><option>Selic +</option><option>Outro</option></select></label>
              <label className="field"><span>Taxa contratada (%)</span><input inputMode="decimal" value={draft.yieldRatePct} onChange={(event) => update("yieldRatePct", event.target.value)} placeholder="Ex.: 110" /></label>
            </>}

            <label className="field"><span>Data da aplicação</span><input type="date" value={draft.appliedAt} onChange={(event) => update("appliedAt", event.target.value)} /></label>
            <label className="field"><span>Vencimento</span><input type="date" value={draft.maturityDate} onChange={(event) => update("maturityDate", event.target.value)} /></label>
            <label className="field"><span>Liquidez</span><input value={draft.liquidity} onChange={(event) => update("liquidity", event.target.value)} placeholder="Ex.: D+1 ou no vencimento" required /></label>
            <label className="field"><span>Nível de risco</span><select value={draft.riskLevel} onChange={(event) => update("riskLevel", event.target.value as InvestmentRiskLevel)}><option value="LOW">Baixo</option><option value="MEDIUM">Médio</option><option value="HIGH">Alto</option></select></label>
            <label className="field"><span>Tributação</span><input value={draft.taxation} onChange={(event) => update("taxation", event.target.value)} placeholder="Ex.: Isento ou tabela regressiva" required /></label>
            <label className="field"><span>Rentabilidade anual (%)</span><input inputMode="decimal" value={draft.annualReturnPct} onChange={(event) => update("annualReturnPct", event.target.value)} placeholder="Opcional" /></label>
            <label className="field"><span>País</span><input value={draft.country} onChange={(event) => update("country", event.target.value)} placeholder="Ex.: Brasil" /></label>
            <label className="field"><span>Setor</span><input value={draft.sector} onChange={(event) => update("sector", event.target.value)} placeholder="Ex.: Financeiro" /></label>
            <label className="field field-full"><span>Observações</span><textarea value={draft.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Informações adicionais sobre o investimento" rows={3} /></label>
          </div>
          <div className="form-actions"><button className="secondary-button" type="button" onClick={closeForm}>Cancelar</button><button className="primary-button" disabled={isSaving}>{isSaving ? <LoaderCircle className="spin" size={17} /> : null}{editing ? "Salvar alterações" : "Cadastrar investimento"}</button></div>
        </form>
      )}

      <section className="summary-grid investment-summary" aria-label="Resumo do patrimônio">
        <article className="summary-card"><div className="metric-icon positive"><TrendingUp size={18} /></div><span>Patrimônio em BRL</span><strong>{moneyFromCents(String(totalCurrent), "BRL")}</strong><small>{initialInvestments.length} {initialInvestments.length === 1 ? "posição cadastrada" : "posições cadastradas"}</small></article>
        <article className="summary-card"><span>Valor aplicado em BRL</span><strong>{moneyFromCents(String(totalInvested), "BRL")}</strong><small>{foreignCount ? `${foreignCount} posição(ões) em moeda estrangeira não convertida(s)` : "Somente posições confirmadas"}</small></article>
        <article className="summary-card"><span>Resultado em BRL</span><strong className={totalResult >= 0 ? "positive-text" : "negative-text"}>{totalResult >= 0 ? "+ " : "− "}{moneyFromCents(String(Math.abs(totalResult)), "BRL")}</strong><small>{totalInvested > 0 ? `${((totalResult / totalInvested) * 100).toFixed(2).replace(".", ",")}% sobre o valor aplicado` : "Cadastre valores para calcular"}</small></article>
      </section>

      <section className="section-card investment-list-card">
        <div className="section-head"><div><h2>Sua carteira</h2><p>Posições confirmadas e salvas no Firestore.</p></div></div>
        {initialInvestments.length === 0 ? (
          <div className="investment-empty"><BrainCircuit size={34} /><h3>Sua carteira começa aqui</h3><p>Cadastre o primeiro investimento manualmente. Na próxima etapa, o Gemini fará esse preenchimento a partir dos seus documentos.</p><button className="primary-button" type="button" onClick={openNew}><Plus size={17} /> Cadastrar investimento</button></div>
        ) : (
          <div className="entries-table-wrap"><table className="entries-table investment-table"><thead><tr><th>Investimento</th><th>Instituição</th><th>Risco</th><th>Aplicado</th><th>Valor atual</th><th>Resultado</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{initialInvestments.map((investment) => <tr key={investment.id}><td><strong>{investment.ticker || investment.name}</strong><span>{investment.category}</span></td><td>{investment.institution}</td><td><span className={`risk-badge ${investment.riskLevel.toLowerCase()}`}>{riskLabel(investment.riskLevel)}</span></td><td>{moneyFromCents(investment.investedAmountInCents, investment.currency)}</td><td><strong>{moneyFromCents(investment.currentAmountInCents, investment.currency)}</strong></td><td><span className={(investment.totalReturnPct ?? 0) >= 0 ? "positive-text" : "negative-text"}>{investment.totalReturnPct === null ? "—" : `${investment.totalReturnPct >= 0 ? "+" : ""}${investment.totalReturnPct.toFixed(2).replace(".", ",")}%`}</span></td><td><div className="row-actions"><button className="icon-button subtle" type="button" onClick={() => openEdit(investment)} aria-label={`Editar ${investment.name}`}><Pencil size={15} /></button><button className="icon-button subtle danger" type="button" onClick={() => setDeleting(investment)} aria-label={`Apagar ${investment.name}`}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>
        )}
      </section>

      {deleting && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !isDeleting && setDeleting(null)}><div className="dialog-card" role="alertdialog" aria-modal="true" aria-labelledby="delete-investment-title"><div className="dialog-danger-icon"><Trash2 size={22} /></div><div className="dialog-copy"><h2 id="delete-investment-title">Apagar investimento?</h2><p><strong>{deleting.name}</strong> será removido da carteira. O registro continuará preservado para auditoria.</p></div><div className="dialog-actions"><button className="secondary-button" type="button" disabled={isDeleting} onClick={() => setDeleting(null)}>Cancelar</button><button className="danger-button" type="button" disabled={isDeleting} onClick={deleteInvestment}>{isDeleting ? <LoaderCircle className="spin" size={17} /> : <Trash2 size={17} />} Apagar</button></div></div></div>}
    </>
  );
}

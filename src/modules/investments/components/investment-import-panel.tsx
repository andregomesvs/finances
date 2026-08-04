"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Check, FileText, LoaderCircle, Upload, X } from "lucide-react";
import { parseCurrencyToCents } from "@/utils/currency-input";
import { investmentCategories, type InvestmentCategory } from "../domain/investment-category";
import type { ExtractedInvestment, InvestmentDocumentExtraction } from "../schemas/investment-import-schema";

interface AnalysisResult extends InvestmentDocumentExtraction {
  fileName: string;
  fileSize: number;
}

interface ReviewInvestment extends ExtractedInvestment {
  localId: string;
  selected: boolean;
  investedAmount: string;
  currentAmount: string;
  averagePrice: string;
}

function centsToInput(value: number | null) {
  return value === null ? "" : (value / 100).toFixed(2).replace(".", ",");
}

function formatFileSize(bytes: number) {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function InvestmentImportPanel({ onImported }: { onImported: (count: number) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [rows, setRows] = useState<ReviewInvestment[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyzeFile(file: File) {
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Selecione um documento PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("O PDF deve ter até 10 MB.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("document", file);
      const response = await fetch("/api/investments/import/analyze", { method: "POST", body });
      const payload = await response.json() as AnalysisResult & { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Não foi possível analisar o PDF.");
      if (payload.investments.length === 0) throw new Error("Nenhum investimento foi identificado no documento.");

      setAnalysis(payload);
      setRows(payload.investments.map((investment) => ({
        ...investment,
        localId: crypto.randomUUID(),
        selected: investment.currentAmountInCents !== null,
        investedAmount: centsToInput(investment.investedAmountInCents),
        currentAmount: centsToInput(investment.currentAmountInCents),
        averagePrice: centsToInput(investment.averagePriceInCents),
      })));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível analisar o PDF.");
    } finally {
      setIsAnalyzing(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function updateRow(localId: string, changes: Partial<ReviewInvestment>) {
    setRows((current) => current.map((row) => row.localId === localId ? { ...row, ...changes } : row));
  }

  function closeReview() {
    if (isSaving) return;
    setAnalysis(null);
    setRows([]);
    setError(null);
  }

  async function confirmImport() {
    const selected = rows.filter((row) => row.selected);
    if (selected.length === 0) {
      setError("Selecione pelo menos um investimento.");
      return;
    }

    try {
      const investments = selected.map((row) => {
        const currentAmountInCents = parseCurrencyToCents(row.currentAmount);
        const investedAmountInCents = row.investedAmount.trim() ? parseCurrencyToCents(row.investedAmount) : null;
        const averagePriceInCents = row.averagePrice.trim() ? parseCurrencyToCents(row.averagePrice) : null;
        if (!row.name.trim() || !row.institution.trim() || currentAmountInCents === null) throw new Error(`Revise nome, instituição e valor atual de “${row.name || "investimento"}”.`);
        if (row.investedAmount.trim() && investedAmountInCents === null) throw new Error(`Revise o valor aplicado de “${row.name}”.`);
        return {
          name: row.name.trim(),
          categoryId: row.categoryId,
          institution: row.institution.trim(),
          investedAmountInCents,
          currentAmountInCents,
          currency: row.currency,
          appliedAt: row.appliedAt,
          maturityDate: row.maturityDate,
          liquidity: row.liquidity || "Não informada",
          riskLevel: row.riskLevel,
          taxation: row.taxation || "Não informada",
          annualReturnPct: row.annualReturnPct,
          ticker: row.ticker?.trim().toUpperCase() || null,
          quantity: row.quantity?.trim().replace(",", ".") || null,
          averagePriceInCents,
          yieldType: row.yieldType,
          yieldRatePct: row.yieldRatePct,
          country: row.country,
          sector: row.sector,
          notes: row.notes,
        };
      });

      setIsSaving(true);
      setError(null);
      const response = await fetch("/api/investments/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investments }),
      });
      const payload = await response.json() as { count?: number; message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Não foi possível confirmar a importação.");
      setAnalysis(null);
      setRows([]);
      setError(null);
      onImported(payload.count ?? investments.length);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Não foi possível confirmar a importação.");
    } finally {
      setIsSaving(false);
    }
  }

  const selectedCount = rows.filter((row) => row.selected).length;

  return (
    <>
      <input ref={fileInput} className="sr-only" type="file" accept="application/pdf,.pdf" onChange={(event) => event.target.files?.[0] && analyzeFile(event.target.files[0])} />
      <button className="secondary-button" type="button" disabled={isAnalyzing} onClick={() => fileInput.current?.click()}>
        {isAnalyzing ? <LoaderCircle className="spin" size={17} /> : <Upload size={17} />}
        {isAnalyzing ? "Analisando PDF..." : "Importar documento"}
      </button>

      {isAnalyzing && <div className="import-progress" role="status"><div><LoaderCircle className="spin" size={28} /><strong>O Gemini está lendo seu documento</strong><p>Identificando produtos, valores, categorias e possíveis inconsistências. Isso pode levar até um minuto.</p></div></div>}

      {analysis && <div className="dialog-backdrop import-backdrop"><section className="import-review" role="dialog" aria-modal="true" aria-labelledby="import-title">
        <header className="import-review-header">
          <div className="import-file-icon"><FileText size={22} /></div>
          <div><span className="eyebrow">Conferência antes de salvar</span><h2 id="import-title">{analysis.fileName}</h2><p>{formatFileSize(analysis.fileSize)} · {analysis.investments.length} posições identificadas</p></div>
          <button className="icon-button subtle" type="button" onClick={closeReview} aria-label="Fechar conferência"><X size={17} /></button>
        </header>

        <div className="import-summary"><BrainSummary summary={analysis.documentSummary} /></div>
        {analysis.warnings.length > 0 && <div className="import-warnings"><AlertTriangle size={18} /><div><strong>Pontos para revisar</strong>{analysis.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div></div>}
        {error && <div className="feedback error import-error">{error}</div>}

        <div className="import-toolbar"><span>{selectedCount} de {rows.length} selecionados</span><button className="text-button" type="button" onClick={() => setRows((current) => current.map((row) => ({ ...row, selected: true })))}>Selecionar todos</button></div>
        <div className="import-positions">{rows.map((row) => {
          const needsReview = row.confidence < 0.8 || row.uncertainties.length > 0 || !row.currentAmount;
          return <article className={`import-position${row.selected ? " selected" : ""}`} key={row.localId}>
            <div className="import-position-head">
              <label className="import-checkbox"><input type="checkbox" checked={row.selected} onChange={(event) => updateRow(row.localId, { selected: event.target.checked })} /><span><Check size={13} /></span></label>
              <div><strong>{row.ticker || row.name}</strong><small>{investmentCategories.find((item) => item.value === row.categoryId)?.label}</small></div>
              <span className={`confidence-badge${needsReview ? " review" : ""}`}>{needsReview ? "Revisar" : `${Math.round(row.confidence * 100)}% confiança`}</span>
            </div>
            <div className="import-position-grid">
              <label className="field field-wide"><span>Nome</span><input value={row.name} onChange={(event) => updateRow(row.localId, { name: event.target.value })} /></label>
              <label className="field"><span>Categoria</span><select value={row.categoryId} onChange={(event) => updateRow(row.localId, { categoryId: event.target.value as InvestmentCategory })}>{investmentCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label>
              <label className="field"><span>Instituição</span><input value={row.institution} onChange={(event) => updateRow(row.localId, { institution: event.target.value })} /></label>
              <label className="field"><span>Valor atual</span><input inputMode="decimal" value={row.currentAmount} onChange={(event) => updateRow(row.localId, { currentAmount: event.target.value })} placeholder="Obrigatório" /></label>
              <label className="field"><span>Valor aplicado</span><input inputMode="decimal" value={row.investedAmount} onChange={(event) => updateRow(row.localId, { investedAmount: event.target.value })} placeholder="Não consta no PDF" /></label>
              <label className="field"><span>Ticker</span><input value={row.ticker ?? ""} onChange={(event) => updateRow(row.localId, { ticker: event.target.value || null })} placeholder="Opcional" /></label>
              <label className="field"><span>Quantidade</span><input inputMode="decimal" value={row.quantity ?? ""} onChange={(event) => updateRow(row.localId, { quantity: event.target.value || null })} placeholder="Opcional" /></label>
            </div>
            {row.uncertainties.length > 0 && <ul className="uncertainty-list">{row.uncertainties.map((item) => <li key={item}>{item}</li>)}</ul>}
          </article>;
        })}</div>

        <footer className="import-review-footer"><p>O PDF não é armazenado. Somente os investimentos selecionados serão salvos no Firestore.</p><div><button className="secondary-button" type="button" disabled={isSaving} onClick={closeReview}>Cancelar</button><button className="primary-button" type="button" disabled={isSaving || selectedCount === 0} onClick={confirmImport}>{isSaving ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />} Confirmar e salvar {selectedCount}</button></div></footer>
      </section></div>}

      {!analysis && error && <div className="import-floating-error" role="alert">{error}<button type="button" onClick={() => setError(null)} aria-label="Fechar erro"><X size={14} /></button></div>}
    </>
  );
}

function BrainSummary({ summary }: { summary: string }) {
  return <><strong>Resumo da leitura</strong><p>{summary}</p></>;
}

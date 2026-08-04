import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CircleDollarSign,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { NewTransactionMenu } from "@/components/new-transaction-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AuthenticatedUser } from "@/modules/auth/domain/authenticated-user";
import type { DashboardOverview } from "../services/get-dashboard-overview";
import { formatCurrency } from "@/utils/money";

function getFirstName(user: AuthenticatedUser) {
  return user.name?.trim().split(/\s+/)[0] || "André";
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function centsToCurrency(cents: string) {
  return formatCurrency(Number(cents) / 100);
}

export function Dashboard({ user, overview }: { user: AuthenticatedUser; overview: DashboardOverview }) {
  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const chartMaximum = Math.max(
    0,
    ...overview.months.flatMap((month) => [Number(month.incomeInCents), Number(month.expenseInCents)]),
  );
  const hasMonthlyData = chartMaximum > 0;

  return (
    <AuthenticatedShell user={user} activePath="/">
      <header className="topbar">
        <div><p className="eyebrow date-label">{today}</p><h1>{getGreeting()}, {getFirstName(user)}.</h1></div>
        <div className="actions">
          <ThemeToggle />
          <button className="icon-button" type="button" aria-label="Notificações"><Bell size={17} aria-hidden="true" /></button>
          <NewTransactionMenu />
        </div>
      </header>

      <section className="summary-grid" aria-label="Resumo financeiro">
        <article className="card metric">
          <div className="metric-head"><span>Patrimônio líquido</span><span className="metric-icon"><CircleDollarSign size={17} /></span></div>
          <strong className="metric-value">{formatCurrency(0)}</strong>
          <p className="metric-note">Cadastre suas contas para calcular</p>
        </article>
        <article className="card metric">
          <div className="metric-head"><span>Entradas no mês</span><span className="metric-icon"><ArrowUpRight size={17} /></span></div>
          <strong className="metric-value">{centsToCurrency(overview.incomeThisMonthInCents)}</strong>
          <p className="metric-note">Valores cadastrados por você</p>
        </article>
        <article className="card metric">
          <div className="metric-head"><span>Saídas no mês</span><span className="metric-icon"><ArrowDownRight size={17} /></span></div>
          <strong className="metric-value">{centsToCurrency(overview.expenseThisMonthInCents)}</strong>
          <p className="metric-note">Nenhuma saída cadastrada</p>
        </article>
      </section>

      <section className="content-grid">
        <article className="card section-card">
          <header className="section-head"><div><h2>Fluxo mensal</h2><p>Entradas e saídas dos últimos 6 meses</p></div></header>
          {hasMonthlyData ? (
            <>
              <div className="chart" role="img" aria-label="Gráfico de entradas e saídas mensais">
                {overview.months.map((month) => {
                  const incomeHeight = Number(month.incomeInCents) > 0 ? Math.max(7, Number(month.incomeInCents) / chartMaximum * 100) : 0;
                  const expenseHeight = Number(month.expenseInCents) > 0 ? Math.max(7, Number(month.expenseInCents) / chartMaximum * 100) : 0;
                  return <div className="bar-group" key={month.label}><i className="bar" style={{ height: `${incomeHeight}%` }} /><i className="bar expense" style={{ height: `${expenseHeight}%` }} /><span className="bar-label">{month.label}</span></div>;
                })}
              </div>
              <div className="chart-legend"><span><i className="legend-dot" />Entradas</span><span><i className="legend-dot soft" />Saídas</span></div>
            </>
          ) : (
            <div className="empty-chart" role="status">
              <span className="empty-icon"><BarChart3 size={22} aria-hidden="true" /></span>
              <strong>Seu histórico aparecerá aqui</strong>
              <p>O gráfico será criado automaticamente após os primeiros lançamentos.</p>
            </div>
          )}
        </article>

        <article className="card section-card">
          <header className="section-head"><div><h2>Carteira</h2><p>Distribuição por classe</p></div></header>
          <div className="empty-chart compact" role="status">
            <span className="empty-icon"><TrendingUp size={22} aria-hidden="true" /></span>
            <strong>Nenhum investimento</strong>
            <p>Cadastre sua carteira para acompanhar a distribuição.</p>
          </div>
        </article>
      </section>

      <section className="bottom-grid">
        <article className="card section-card">
          <header className="section-head"><div><h2>Movimentações recentes</h2><p>Últimos lançamentos registrados</p></div></header>
          {overview.recent.length > 0 ? (
            <div className="transaction-list">
              {overview.recent.map((transaction) => {
                const positive = transaction.type === "INCOME";
                const Icon = positive ? BriefcaseBusiness : ShoppingBag;
                return <div className="transaction" key={transaction.id}><span className="transaction-icon"><Icon size={17} /></span><div><strong>{transaction.description}</strong><span>{transaction.meta}</span></div><strong className={`transaction-value${positive ? " positive" : ""}`}>{positive ? "+ " : "− "}{centsToCurrency(transaction.amountInCents)}</strong></div>;
              })}
            </div>
          ) : (
            <div className="empty-list" role="status">
              <span className="empty-icon"><ReceiptText size={21} aria-hidden="true" /></span>
              <div><strong>Nenhuma movimentação ainda</strong><p>Somente os lançamentos cadastrados por você serão exibidos.</p></div>
            </div>
          )}
        </article>
        <article className="card section-card">
          <header className="section-head"><div><h2>Orçamento do mês</h2><p>Uso do limite planejado</p></div><span className="metric-icon"><BarChart3 size={17} /></span></header>
          <div className="budget-value"><strong>0%</strong><span>Nenhum orçamento definido</span></div>
          <div className="budget-track"><i style={{ width: 0 }} /></div>
          <p className="budget-note">Defina um orçamento mensal para acompanhar seus limites com clareza.</p>
        </article>
      </section>
    </AuthenticatedShell>
  );
}

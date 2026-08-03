import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  CircleDollarSign,
  Goal,
  Home,
  Landmark,
  Plus,
  ReceiptText,
  Settings,
  ShoppingBag,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatCurrency } from "@/utils/money";

const months = [
  { label: "Mar", income: 61, expense: 42 },
  { label: "Abr", income: 72, expense: 48 },
  { label: "Mai", income: 68, expense: 54 },
  { label: "Jun", income: 79, expense: 46 },
  { label: "Jul", income: 74, expense: 58 },
  { label: "Ago", income: 84, expense: 49 },
];

const transactions = [
  { name: "Supermercado Vila", meta: "Alimentação · Hoje", value: -286.4, icon: ShoppingBag },
  { name: "Salário", meta: "Receita · 01 ago", value: 8500, icon: BriefcaseBusiness },
  { name: "Tesouro Selic 2029", meta: "Investimento · 31 jul", value: -1000, icon: Landmark },
];

const nav = [
  { label: "Visão geral", icon: Home, active: true },
  { label: "Transações", icon: ReceiptText },
  { label: "Contas", icon: WalletCards },
  { label: "Planejamento", icon: Goal },
  { label: "Investimentos", icon: TrendingUp },
  { label: "Configurações", icon: Settings },
];

export function Dashboard() {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegação principal">
        <div className="brand"><span className="brand-mark">A</span><span>Áurea</span></div>
        <nav className="nav-group">
          {nav.map(({ label, icon: Icon, active }) => (
            <a key={label} className={`nav-item${active ? " active" : ""}`} href="#" aria-current={active ? "page" : undefined}>
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="profile"><span className="avatar">AS</span><span className="profile-copy"><strong>André Silva</strong><span>Conta pessoal</span></span></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><p className="eyebrow">Domingo, 3 de agosto</p><h1>Boa tarde, André.</h1></div>
          <div className="actions">
            <ThemeToggle />
            <button className="icon-button" type="button" aria-label="Notificações"><Bell size={17} aria-hidden="true" /></button>
            <button className="primary-button" type="button"><Plus size={17} aria-hidden="true" /><span>Nova transação</span></button>
          </div>
        </header>

        <section className="summary-grid" aria-label="Resumo financeiro">
          <article className="card metric">
            <div className="metric-head"><span>Patrimônio líquido</span><span className="metric-icon"><CircleDollarSign size={17} /></span></div>
            <strong className="metric-value">{formatCurrency(128430.72)}</strong>
            <p className="metric-note"><span className="positive">↑ 2,8%</span> nos últimos 30 dias</p>
          </article>
          <article className="card metric">
            <div className="metric-head"><span>Entradas em agosto</span><span className="metric-icon"><ArrowUpRight size={17} /></span></div>
            <strong className="metric-value">{formatCurrency(10250)}</strong>
            <p className="metric-note">R$ 1.750 além do salário</p>
          </article>
          <article className="card metric">
            <div className="metric-head"><span>Saídas em agosto</span><span className="metric-icon"><ArrowDownRight size={17} /></span></div>
            <strong className="metric-value">{formatCurrency(4782.34)}</strong>
            <p className="metric-note"><span className="positive">R$ 717,66 abaixo</span> do planejado</p>
          </article>
        </section>

        <section className="content-grid">
          <article className="card section-card">
            <header className="section-head"><div><h2>Fluxo mensal</h2><p>Entradas e saídas dos últimos 6 meses</p></div><button className="text-button" type="button">Ver relatório</button></header>
            <div className="chart" role="img" aria-label="Gráfico de entradas e saídas mensais">
              {months.map((month) => <div className="bar-group" key={month.label}><i className="bar" style={{ height: `${month.income}%` }} /><i className="bar expense" style={{ height: `${month.expense}%` }} /><span className="bar-label">{month.label}</span></div>)}
            </div>
            <div className="chart-legend"><span><i className="legend-dot" />Entradas</span><span><i className="legend-dot soft" />Saídas</span></div>
          </article>

          <article className="card section-card">
            <header className="section-head"><div><h2>Carteira</h2><p>Distribuição por classe</p></div><button className="text-button" type="button">Detalhes</button></header>
            <div className="allocation"><div className="donut" role="img" aria-label="R$ 93,7 mil investidos, distribuídos por classe" /></div>
            <div className="allocation-list">
              {[["Renda fixa", 42], ["Ações", 26], ["FIIs", 18], ["Outros", 14]].map(([label, value]) => <div className="allocation-row" key={String(label)}><strong>{label}</strong><span>{value}%</span><div className="progress"><i style={{ width: `${value}%` }} /></div></div>)}
            </div>
          </article>
        </section>

        <section className="bottom-grid">
          <article className="card section-card">
            <header className="section-head"><div><h2>Movimentações recentes</h2><p>Últimos lançamentos registrados</p></div><button className="text-button" type="button">Ver todas <ChevronRight size={12} /></button></header>
            <div className="transaction-list">
              {transactions.map(({ name, meta, value, icon: Icon }) => <div className="transaction" key={name}><span className="transaction-icon"><Icon size={17} /></span><div><strong>{name}</strong><span>{meta}</span></div><strong className={`transaction-value ${value > 0 ? "positive" : ""}`}>{value > 0 ? "+ " : "− "}{formatCurrency(Math.abs(value))}</strong></div>)}
            </div>
          </article>
          <article className="card section-card">
            <header className="section-head"><div><h2>Orçamento do mês</h2><p>Uso do limite planejado</p></div><span className="metric-icon"><BarChart3 size={17} /></span></header>
            <div className="budget-value"><strong>68%</strong><span>R$ 4.782 de R$ 7.000</span></div>
            <div className="budget-track"><i /></div>
            <p className="budget-note">Você pode gastar <strong>{formatCurrency(2217.66)}</strong> até o fim de agosto sem ultrapassar o orçamento.</p>
          </article>
        </section>
      </main>

      <nav className="mobile-nav" aria-label="Navegação móvel">
        {nav.slice(0, 5).map(({ label, icon: Icon, active }) => <a key={label} className={active ? "active" : ""} href="#" aria-label={label}><Icon size={20} /></a>)}
      </nav>
    </div>
  );
}

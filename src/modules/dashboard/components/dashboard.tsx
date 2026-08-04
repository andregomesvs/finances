import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CircleDollarSign,
  Goal,
  Home,
  Plus,
  ReceiptText,
  Settings,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AuthenticatedUser } from "@/modules/auth/domain/authenticated-user";
import { LogoutButton } from "@/modules/auth/components/logout-button";
import { formatCurrency } from "@/utils/money";

const nav = [
  { label: "Visão geral", icon: Home, active: true },
  { label: "Transações", icon: ReceiptText },
  { label: "Contas", icon: WalletCards },
  { label: "Planejamento", icon: Goal },
  { label: "Investimentos", icon: TrendingUp },
  { label: "Configurações", icon: Settings },
];

function getFirstName(user: AuthenticatedUser) {
  return user.name?.trim().split(/\s+/)[0] || "André";
}

function getInitials(user: AuthenticatedUser) {
  const source = user.name?.trim() || user.email;
  return source.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function Dashboard({ user }: { user: AuthenticatedUser }) {
  const today = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

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
          <div className="profile">
            <span className="avatar">{getInitials(user)}</span>
            <span className="profile-copy"><strong>{user.name ?? user.email}</strong><span>Conta pessoal</span></span>
            <LogoutButton />
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><p className="eyebrow date-label">{today}</p><h1>{getGreeting()}, {getFirstName(user)}.</h1></div>
          <div className="actions">
            <ThemeToggle />
            <button className="icon-button" type="button" aria-label="Notificações"><Bell size={17} aria-hidden="true" /></button>
            <button className="primary-button" type="button" disabled title="Disponível na próxima etapa"><Plus size={17} aria-hidden="true" /><span>Nova transação</span></button>
          </div>
        </header>

        <section className="summary-grid" aria-label="Resumo financeiro">
          <article className="card metric">
            <div className="metric-head"><span>Patrimônio líquido</span><span className="metric-icon"><CircleDollarSign size={17} /></span></div>
            <strong className="metric-value">{formatCurrency(0)}</strong>
            <p className="metric-note">Cadastre suas contas para começar</p>
          </article>
          <article className="card metric">
            <div className="metric-head"><span>Entradas no mês</span><span className="metric-icon"><ArrowUpRight size={17} /></span></div>
            <strong className="metric-value">{formatCurrency(0)}</strong>
            <p className="metric-note">Nenhuma entrada cadastrada</p>
          </article>
          <article className="card metric">
            <div className="metric-head"><span>Saídas no mês</span><span className="metric-icon"><ArrowDownRight size={17} /></span></div>
            <strong className="metric-value">{formatCurrency(0)}</strong>
            <p className="metric-note">Nenhuma saída cadastrada</p>
          </article>
        </section>

        <section className="content-grid">
          <article className="card section-card">
            <header className="section-head"><div><h2>Fluxo mensal</h2><p>Entradas e saídas dos últimos 6 meses</p></div></header>
            <div className="empty-chart" role="status">
              <span className="empty-icon"><BarChart3 size={22} aria-hidden="true" /></span>
              <strong>Seu histórico aparecerá aqui</strong>
              <p>O gráfico será criado automaticamente após os primeiros lançamentos.</p>
            </div>
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
            <div className="empty-list" role="status">
              <span className="empty-icon"><ReceiptText size={21} aria-hidden="true" /></span>
              <div><strong>Nenhuma movimentação ainda</strong><p>Somente os lançamentos cadastrados por você serão exibidos.</p></div>
            </div>
          </article>
          <article className="card section-card">
            <header className="section-head"><div><h2>Orçamento do mês</h2><p>Uso do limite planejado</p></div><span className="metric-icon"><BarChart3 size={17} /></span></header>
            <div className="budget-value"><strong>0%</strong><span>Nenhum orçamento definido</span></div>
            <div className="budget-track"><i style={{ width: 0 }} /></div>
            <p className="budget-note">Defina um orçamento mensal para acompanhar seus limites com clareza.</p>
          </article>
        </section>
      </main>

      <nav className="mobile-nav" aria-label="Navegação móvel">
        {nav.slice(0, 5).map(({ label, icon: Icon, active }) => <a key={label} className={active ? "active" : ""} href="#" aria-label={label}><Icon size={20} /></a>)}
      </nav>
    </div>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  CreditCard,
  Goal,
  Home,
  ReceiptText,
  Settings,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import type { AuthenticatedUser } from "@/modules/auth/domain/authenticated-user";
import { LogoutButton } from "@/modules/auth/components/logout-button";

const navigation = [
  { label: "Visão geral", icon: Home, href: "/" },
  { label: "Entradas", icon: ArrowDownToLine, href: "/entradas" },
  { label: "Saídas", icon: CreditCard, href: "/saidas" },
  { label: "Transações", icon: ReceiptText },
  { label: "Contas", icon: WalletCards },
  { label: "Planejamento", icon: Goal },
  { label: "Investimentos", icon: TrendingUp, href: "/investimentos" },
  { label: "Configurações", icon: Settings },
];

function getInitials(user: AuthenticatedUser) {
  const source = user.name?.trim() || user.email;
  return source.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function AuthenticatedShell({
  user,
  activePath,
  children,
}: {
  user: AuthenticatedUser;
  activePath: string;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegação principal">
        <Link className="brand" href="/"><span className="brand-mark">A</span><span>Áurea</span></Link>
        <nav className="nav-group">
          {navigation.map(({ label, icon: Icon, href }) => {
            const active = href === activePath;
            return href ? (
              <Link key={label} className={`nav-item${active ? " active" : ""}`} href={href} aria-current={active ? "page" : undefined}>
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span>
              </Link>
            ) : (
              <span key={label} className="nav-item disabled" aria-disabled="true" title="Disponível nas próximas etapas">
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span>
              </span>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="profile">
            <span className="avatar">{getInitials(user)}</span>
            <span className="profile-copy"><strong>{user.name ?? user.email}</strong><span>Conta pessoal</span></span>
            <LogoutButton />
          </div>
        </div>
      </aside>

      <main className="main">{children}</main>

      <nav className="mobile-nav" aria-label="Navegação móvel">
        {navigation.filter((item) => item.href).map(({ label, icon: Icon, href }) => (
          <Link key={label} className={href === activePath ? "active" : ""} href={href!} aria-label={label}><Icon size={20} /></Link>
        ))}
      </nav>
    </div>
  );
}

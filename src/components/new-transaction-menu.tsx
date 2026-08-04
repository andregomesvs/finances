"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, ChevronDown, Repeat2, Plus } from "lucide-react";

export function NewTransactionMenu() {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="transaction-menu" ref={container}>
      <button className="primary-button" type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-haspopup="menu">
        <Plus size={17} aria-hidden="true" /><span>Nova transação</span><ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className="transaction-menu-popover" role="menu">
          <Link href="/entradas?nova=1" role="menuitem" onClick={() => setOpen(false)}><span className="menu-icon income"><ArrowDownToLine size={17} /></span><span><strong>Nova entrada</strong><small>Salário e outros recebimentos</small></span></Link>
          <Link href="/saidas?nova=cartao" role="menuitem" onClick={() => setOpen(false)}><span className="menu-icon expense"><ArrowUpFromLine size={17} /></span><span><strong>Saída no cartão</strong><small>Compra à vista ou parcelada</small></span></Link>
          <Link href="/saidas?nova=fixo" role="menuitem" onClick={() => setOpen(false)}><span className="menu-icon fixed"><Repeat2 size={17} /></span><span><strong>Gasto fixo</strong><small>Conta ou compromisso mensal</small></span></Link>
        </div>
      )}
    </div>
  );
}

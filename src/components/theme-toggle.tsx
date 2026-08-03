"use client";

import { SunMoon } from "lucide-react";
import { useEffect } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  useEffect(() => {
    const saved = window.localStorage.getItem("aurea-theme") as Theme | null;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = saved ?? preferred;
    document.documentElement.dataset.theme = initial;
  }, []);

  function toggleTheme() {
    const current = document.documentElement.dataset.theme as Theme | undefined;
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("aurea-theme", next);
  }

  return (
    <button
      className="icon-button"
      type="button"
      onClick={toggleTheme}
      aria-label="Alternar tema claro ou escuro"
    >
      <SunMoon size={17} aria-hidden="true" />
    </button>
  );
}

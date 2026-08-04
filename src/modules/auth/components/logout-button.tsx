"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { firebaseClientAuth } from "@/infrastructure/firebase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      await firebaseClientAuth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button className="logout-button" type="button" onClick={handleLogout} disabled={isLoading} aria-label="Sair do sistema">
      <LogOut size={15} aria-hidden="true" />
    </button>
  );
}

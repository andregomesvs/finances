"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { LoaderCircle } from "lucide-react";
import { firebaseClientAuth } from "@/infrastructure/firebase/client";

function getLoginError(error: unknown): string {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/popup-closed-by-user") return "Login cancelado antes da conclusão.";
    if (error.code === "auth/popup-blocked") return "O navegador bloqueou a janela do Google. Libere popups e tente novamente.";
    if (error.code === "auth/unauthorized-domain") return "Este domínio ainda não está autorizado no Firebase Authentication.";
    if (error.code === "auth/network-request-failed") return "Não foi possível conectar ao Google. Verifique sua internet e tente novamente.";
  }

  if (error instanceof Error && error.message) return error.message;
  return "Não foi possível entrar com o Google. Verifique a conta e tente novamente.";
}

export function GoogleLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setIsLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(firebaseClientAuth, provider);
      const idToken = await result.user.getIdToken();
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const payload = await response.json() as { message?: string };
        await firebaseClientAuth.signOut();
        throw new Error(payload.message ?? "Não foi possível entrar.");
      }

      router.replace("/");
      router.refresh();
    } catch (caughtError) {
      setError(getLoginError(caughtError));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login-actions">
      <button className="google-button" type="button" onClick={handleLogin} disabled={isLoading}>
        {isLoading ? <LoaderCircle className="spin" size={19} aria-hidden="true" /> : <span className="google-mark" aria-hidden="true">G</span>}
        <span>{isLoading ? "Entrando…" : "Continuar com Google"}</span>
      </button>
      {error && <p className="login-error" role="alert">{error}</p>}
    </div>
  );
}

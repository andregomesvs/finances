"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { LoaderCircle } from "lucide-react";
import { firebaseClientAuth } from "@/infrastructure/firebase/client";

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
      const message = caughtError instanceof Error && caughtError.message.includes("não possui acesso")
        ? caughtError.message
        : "Não foi possível entrar com o Google. Verifique a conta e tente novamente.";
      setError(message);
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

import { redirect } from "next/navigation";
import { GoogleLogin } from "@/modules/auth/components/google-login";
import { getCurrentUser } from "@/modules/auth/services/current-user";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand"><span className="brand-mark">A</span><span>Áurea</span></div>
        <div className="login-copy">
          <p className="eyebrow">Seu espaço financeiro privado</p>
          <h1 id="login-title">Bem-vindo de volta.</h1>
          <p>Acesse para acompanhar somente os dados que você cadastrar.</p>
        </div>
        <GoogleLogin />
        <p className="login-security">Acesso protegido e restrito à sua conta Google autorizada.</p>
      </section>
    </main>
  );
}

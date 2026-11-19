import Link from "next/link";
import { LoginForm } from "@/app/admin/login/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="admin-login-shell">
      <Link className="admin-back-link" href="/">
        Volver al catálogo
      </Link>
      <section className="admin-login-panel">
        <p className="catalog-header__eyebrow">Autoservicio San Cayetano</p>
        <h1>Acceso administrativo</h1>
        <p className="admin-login-copy">Ingresá con la cuenta autorizada para administrar el catálogo.</p>
        <LoginForm />
      </section>
    </main>
  );
}
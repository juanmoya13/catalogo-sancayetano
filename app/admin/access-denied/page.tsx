import { logoutAction } from "@/app/admin/actions";

export default function AdminAccessDeniedPage() {
  return (
    <main className="admin-login-shell">
      <section className="admin-login-panel" role="alert">
        <p className="catalog-header__eyebrow">Autoservicio San Cayetano</p>
        <h1>Acceso denegado</h1>
        <p className="admin-login-copy">La cuenta autenticada no está habilitada para administrar el catálogo.</p>
        <form action={logoutAction}>
          <button className="catalog-button" type="submit">
            Cerrar sesión
          </button>
        </form>
      </section>
    </main>
  );
}
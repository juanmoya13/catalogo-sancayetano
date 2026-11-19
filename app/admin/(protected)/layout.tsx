import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth/permissions";

export const instant = false;

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link className="admin-brand" href="/admin">
          Autoservicio San Cayetano
        </Link>
        <form action={logoutAction}>
          <button className="admin-logout" type="submit">
            Cerrar sesión
          </button>
        </form>
      </header>
      <div className="admin-workspace">
        <nav className="admin-navigation" aria-label="Administración">
          <span className="admin-navigation__current" aria-current="page">
            Inicio
          </span>
          <span aria-disabled="true">Categorías</span>
          <span aria-disabled="true">Productos</span>
        </nav>
        {children}
      </div>
    </div>
  );
}
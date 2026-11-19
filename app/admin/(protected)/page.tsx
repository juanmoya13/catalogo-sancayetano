import Link from "next/link";

export default function AdminHomePage() {
  return (
    <main className="admin-content">
      <p className="catalog-header__eyebrow">Panel de administración</p>
      <h1>Administración del catálogo</h1>
      <p className="admin-login-copy">
        Administrá productos, precios, disponibilidad y categorías del catálogo.
      </p>
      <Link className="catalog-button" href="/admin/productos">
        Administrar productos
      </Link>
      <br />
      <br />
      <Link className="catalog-button" href="/admin/categorias">
        Administrar categorías
      </Link>
      <br />
      <br />
      <Link className="catalog-button" href="/">
        Ver catálogo público
      </Link>
    </main>
  );
}
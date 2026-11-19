import Link from "next/link";

export default function AdminHomePage() {
  return (
    <main className="admin-content">
      <p className="catalog-header__eyebrow">Panel de administración</p>
      <h1>Administración del catálogo</h1>
      <p className="admin-login-copy">
        El acceso está protegido. Las herramientas de categorías y productos se incorporarán en sus próximas etapas.
      </p>
      <Link className="catalog-button" href="/">
        Ver catálogo público
      </Link>
    </main>
  );
}
import Link from "next/link";
import ProductManager from "@/features/products/components/ProductManager";
import { getAdminProducts } from "@/features/products/admin-queries";

export default async function ProductsPage() {
  const products = await getAdminProducts();

  return (
    <main className="admin-content admin-content--wide">
      <div className="product-page-heading">
        <div>
          <p className="catalog-header__eyebrow">Administración del catálogo</p>
          <h1>Productos</h1>
          <p className="admin-login-copy">Mantené precios, categorías y disponibilidad del catálogo.</p>
        </div>
        <Link className="catalog-button" href="/admin/productos/nuevo">Nuevo producto</Link>
      </div>
      <ProductManager products={products} />
    </main>
  );
}
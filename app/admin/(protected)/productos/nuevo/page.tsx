import Link from "next/link";
import ProductForm from "@/features/products/components/ProductForm";
import { getAdminCategories } from "@/features/categories/queries";

export default async function NewProductPage() {
  const categories = await getAdminCategories();

  return (
    <main className="admin-content admin-content--wide">
      <Link className="admin-back-link" href="/admin/productos">← Volver a productos</Link>
      <p className="catalog-header__eyebrow product-form-eyebrow">Administración del catálogo</p>
      <h1>Nuevo producto</h1>
      <p className="admin-login-copy">Completá los datos que se mostrarán en el catálogo.</p>
      <ProductForm categories={categories} />
    </main>
  );
}
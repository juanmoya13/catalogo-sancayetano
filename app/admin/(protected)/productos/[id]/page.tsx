import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminCategories } from "@/features/categories/queries";
import ProductForm from "@/features/products/components/ProductForm";
import { getAdminProduct } from "@/features/products/admin-queries";
import { productIdSchema } from "@/features/products/schemas";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!productIdSchema.safeParse(id).success) notFound();

  const [product, categories] = await Promise.all([
    getAdminProduct(id),
    getAdminCategories(),
  ]);
  if (!product) notFound();

  return (
    <main className="admin-content admin-content--wide">
      <Link className="admin-back-link" href="/admin/productos">← Volver a productos</Link>
      <p className="catalog-header__eyebrow product-form-eyebrow">Administración del catálogo</p>
      <h1>Editar producto</h1>
      <p className="admin-login-copy">Actualizá el precio, la categoría, la modalidad de venta o la disponibilidad.</p>
      <ProductForm categories={categories} product={product} />
    </main>
  );
}
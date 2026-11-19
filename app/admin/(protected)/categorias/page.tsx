import CategoryManager from "@/features/categories/components/CategoryManager";
import { getAdminCategories } from "@/features/categories/queries";

export default async function CategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <main className="admin-content admin-content--wide">
      <p className="catalog-header__eyebrow">Administración del catálogo</p>
      <h1>Categorías</h1>
      <p className="admin-login-copy">
        Organizá el catálogo en categorías principales y subcategorías de un solo nivel.
      </p>
      <CategoryManager categories={categories} />
    </main>
  );
}
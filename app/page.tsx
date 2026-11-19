import { ProductCatalog } from "@/features/products/components/ProductCatalog";
import { getPublicCategories } from "@/features/categories/queries";
import {
  getPublicProductPage,
  isPublicCategoryId,
} from "@/features/products/queries";
import { MAX_PUBLIC_SEARCH_LENGTH } from "@/features/products/constants";

type HomeProps = {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    page?: string | string[];
  }>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const search = firstValue(params.q)?.trim().slice(0, MAX_PUBLIC_SEARCH_LENGTH) ?? "";
  const rawCategoryId = firstValue(params.category);
  const categoryId = rawCategoryId && isPublicCategoryId(rawCategoryId)
    ? rawCategoryId
    : "";
  const parsedPage = Number(firstValue(params.page));
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const [catalog, categories] = await Promise.all([
    getPublicProductPage(page, undefined, { search, categoryId: categoryId || undefined }),
    getPublicCategories(),
  ]);

  return (
    <main className="catalog-shell">
      <header className="catalog-header">
        <p className="catalog-header__eyebrow">Autoservicio San Cayetano</p>
        <h1>Catálogo</h1>
      </header>

      <ProductCatalog
        categories={categories}
        initialCategoryId={categoryId}
        initialPage={catalog.page}
        initialProducts={catalog.products}
        initialSearch={search}
        initialTotal={catalog.total}
        initialTotalPages={catalog.totalPages}
      />
    </main>
  );
}

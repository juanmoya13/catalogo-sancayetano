import Link from "next/link";
import { InfiniteProductCatalog } from "@/features/products/components/InfiniteProductCatalog";
import { getPublicProductPage } from "@/features/products/queries";

export default async function Home() {
  const catalog = await getPublicProductPage(1);

  return (
    <main className="catalog-shell">
      <header className="catalog-header">
        <p className="catalog-header__eyebrow">Autoservicio San Cayetano</p>
        <h1>Catálogo</h1>
      </header>

      {catalog.products.length === 0 ? (
        <section className="catalog-state">
          <h2>Sin productos disponibles</h2>
          <p>Por el momento no hay productos activos publicados.</p>
          <Link className="catalog-button" href="/">
            Volver al inicio
          </Link>
        </section>
      ) : (
        <InfiniteProductCatalog
          initialProducts={catalog.products}
          initialHasMore={catalog.page < catalog.totalPages}
          initialPage={catalog.page}
          total={catalog.total}
        />
      )}
    </main>
  );
}

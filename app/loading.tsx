export default function CatalogLoading() {
  return (
    <main className="catalog-shell" aria-busy="true">
      <header className="catalog-header">
        <p className="catalog-header__eyebrow">Autoservicio San Cayetano</p>
        <h1>Catálogo</h1>
      </header>
      <section className="catalog-loading-grid" aria-label="Cargando productos">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="product-card product-card--skeleton" key={index} />
        ))}
      </section>
      <p className="catalog-loading-label">Cargando productos…</p>
    </main>
  );
}

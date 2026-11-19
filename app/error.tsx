"use client";

export default function CatalogError({ reset }: { reset: () => void }) {
  return (
    <main className="catalog-shell">
      <div className="catalog-header">
        <p className="catalog-header__eyebrow">Autoservicio San Cayetano</p>
        <h1>Catálogo</h1>
      </div>
      <section className="catalog-state" role="alert">
        <p>No pudimos cargar el catálogo.</p>
        <button className="catalog-button" type="button" onClick={reset}>
          Reintentar
        </button>
      </section>
    </main>
  );
}

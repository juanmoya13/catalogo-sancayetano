"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicProduct, PublicProductBatch } from "../types";
import { ProductCard } from "./ProductCard";

export function InfiniteProductCatalog({
  initialProducts,
  initialHasMore,
  initialPage,
  total,
}: {
  initialProducts: PublicProduct[];
  initialHasMore: boolean;
  initialPage: number;
  total: number;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setIsLoading(true);
    setError(false);

    try {
      const response = await fetch(`/api/products?page=${page + 1}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("No se pudo cargar más productos.");

      const batch = (await response.json()) as PublicProductBatch;

      setProducts((current) => {
        const knownIds = new Set(current.map((product) => product.id));
        const newProducts = batch.products.filter(
          (product) => !knownIds.has(product.id),
        );
        return [...current, ...newProducts];
      });
      setPage(batch.page);
      setHasMore(batch.hasMore);
    } catch {
      setError(true);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [hasMore, page]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <>
      <p className="catalog-summary">
        {total} {total === 1 ? "producto disponible" : "productos disponibles"}
      </p>

      <section className="product-grid" aria-label="Productos disponibles">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>

      {hasMore ? (
        <div className="catalog-infinite-status" ref={sentinelRef}>
          {error ? (
            <>
              <p role="alert">No pudimos cargar más productos.</p>
              <button
                className="catalog-button"
                type="button"
                onClick={() => void loadMore()}
              >
                Reintentar
              </button>
            </>
          ) : (
            <p aria-live="polite">
              {isLoading ? "Cargando más productos…" : "Desplazate para ver más productos"}
            </p>
          )}
        </div>
      ) : (
        <p className="catalog-infinite-status catalog-infinite-status--complete">
          Ya viste todos los productos disponibles.
        </p>
      )}
    </>
  );
}

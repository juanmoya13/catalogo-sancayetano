"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicCategory } from "@/features/categories/types";
import { MAX_PUBLIC_SEARCH_LENGTH } from "../constants";
import type { PublicProductPage } from "../types";
import { Pagination } from "./Pagination";
import { ProductCard } from "./ProductCard";

type HistoryMode = "replace" | "push" | "none";
type CatalogResponse = PublicProductPage & { error?: string };

function buildCatalogUrl(page: number, search: string, categoryId: string) {
  const params = new URLSearchParams();
  const normalizedSearch = search.trim();

  if (normalizedSearch) params.set("q", normalizedSearch);
  if (categoryId) params.set("category", categoryId);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function readPage(value: string | null) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function ProductCatalog({
  categories,
  initialCategoryId,
  initialPage,
  initialProducts,
  initialSearch,
  initialTotal,
  initialTotalPages,
}: {
  categories: PublicCategory[];
  initialCategoryId: string;
  initialPage: number;
  initialProducts: PublicProductPage["products"];
  initialSearch: string;
  initialTotal: number;
  initialTotalPages: number;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [search, setSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const requestId = useRef(0);
  const requestController = useRef<AbortController | null>(null);
  const filterKey = useRef(`${initialSearch}\u0000${initialCategoryId}`);
  const loadPageRef = useRef<(
    page: number,
    search: string,
    categoryId: string,
    historyMode: HistoryMode,
  ) => Promise<void>>(async () => {});

  async function loadPage(
    targetPage: number,
    targetSearch: string,
    targetCategoryId: string,
    historyMode: HistoryMode,
  ) {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    const currentRequestId = ++requestId.current;
    setIsLoading(true);
    setHasError(false);

    const params = new URLSearchParams({ page: String(targetPage) });
    if (targetSearch.trim()) params.set("q", targetSearch.trim());
    if (targetCategoryId) params.set("category", targetCategoryId);

    try {
      const response = await fetch(`/api/products?${params}`, {
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) throw new Error("No se pudo consultar el catálogo.");

      const result = (await response.json()) as CatalogResponse;
      if (currentRequestId !== requestId.current) return;

      setProducts(result.products);
      setPage(result.page);
      setTotal(result.total);
      setTotalPages(result.totalPages);

      if (historyMode !== "none") {
        const url = buildCatalogUrl(result.page, targetSearch, targetCategoryId);
        window.history[historyMode === "push" ? "pushState" : "replaceState"](
          window.history.state,
          "",
          url,
        );
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (currentRequestId === requestId.current) {
        setHasError(true);
        setProducts([]);
      }
    } finally {
      if (currentRequestId === requestId.current) setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPageRef.current = loadPage;
  });

  useEffect(() => {
    const nextFilterKey = `${search.trim()}\u0000${categoryId}`;
    if (nextFilterKey === filterKey.current) return;

    filterKey.current = nextFilterKey;
    const timeout = window.setTimeout(() => {
      void loadPageRef.current(1, search, categoryId, "replace");
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search, categoryId]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const nextSearch = (params.get("q") ?? "").slice(0, MAX_PUBLIC_SEARCH_LENGTH);
      const nextCategoryId = params.get("category") ?? "";
      const nextPage = readPage(params.get("page"));

      filterKey.current = `${nextSearch.trim()}\u0000${nextCategoryId}`;
      setSearch(nextSearch);
      setCategoryId(nextCategoryId);
      void loadPageRef.current(nextPage, nextSearch, nextCategoryId, "none");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function clearFilters() {
    setSearch("");
    setCategoryId("");
  }

  function retry() {
    void loadPage(page, search, categoryId, "none");
  }

  const hasFilters = Boolean(search.trim() || categoryId);

  return (
    <>
      <section className="catalog-filters" aria-label="Buscar productos">
        <label className="catalog-filters__search" htmlFor="catalog-search">
          <span>Buscar por nombre</span>
          <input
            autoComplete="off"
            id="catalog-search"
            maxLength={MAX_PUBLIC_SEARCH_LENGTH}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Ej.: arroz, leche, tomate"
            type="search"
            value={search}
          />
        </label>

        <label className="catalog-filters__category" htmlFor="catalog-category">
          <span>Categoría</span>
          <select
            id="catalog-category"
            onChange={(event) => setCategoryId(event.currentTarget.value)}
            value={categoryId}
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <optgroup key={category.id} label={category.name}>
                <option value={category.id}>
                  {category.children.length > 0
                    ? `${category.name} (incluye subcategorías)`
                    : category.name}
                </option>
                {category.children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        {hasFilters ? (
          <button className="catalog-filter-clear" onClick={clearFilters} type="button">
            Limpiar filtros
          </button>
        ) : null}
      </section>

      <div className="catalog-results" aria-busy={isLoading}>
        <p className="catalog-summary" aria-live="polite">
          {isLoading
            ? "Actualizando resultados…"
            : `${total} ${total === 1 ? "producto encontrado" : "productos encontrados"}`}
        </p>

        {hasError ? (
          <section className="catalog-state" role="alert">
            <h2>No pudimos cargar los productos</h2>
            <p>Revisá tu conexión e intentá nuevamente.</p>
            <button className="catalog-button" onClick={retry} type="button">
              Reintentar
            </button>
          </section>
        ) : isLoading && products.length === 0 ? (
          <p className="catalog-filter-status" role="status">Buscando productos…</p>
        ) : products.length === 0 ? (
          <section className="catalog-state">
            <h2>{hasFilters ? "No encontramos productos" : "Sin productos disponibles"}</h2>
            <p>
              {hasFilters
                ? "Probá con otro nombre o categoría."
                : "Por el momento no hay productos activos publicados."}
            </p>
            {hasFilters ? (
              <button className="catalog-button" onClick={clearFilters} type="button">
                Limpiar búsqueda y filtros
              </button>
            ) : null}
          </section>
        ) : (
          <>
            <section className="product-grid" aria-label="Productos disponibles">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </section>
            <Pagination
              isLoading={isLoading}
              onPageChange={(nextPage) =>
                void loadPage(nextPage, search, categoryId, "push")
              }
              page={page}
              totalPages={totalPages}
            />
          </>
        )}
      </div>
    </>
  );
}
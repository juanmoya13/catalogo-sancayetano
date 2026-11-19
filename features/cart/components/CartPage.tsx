"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateCartTotal,
  calculateLineSubtotal,
  currencyFormatter,
  isQuantityValid,
} from "../domain";
import { useCart } from "../context";
import type { CartProduct } from "../types";

export function CartPage() {
  const { cart, isHydrated, setQuantity, removeItem, clearCart } = useCart();
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [hasPriceChanges, setHasPriceChanges] = useState(false);
  const previousPrices = useRef<Map<string, number>>(new Map());

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!isHydrated) return;

    if (cart.items.length === 0) {
      setProducts([]);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setHasError(false);

    fetch("/api/cart/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: cart.items.map((item) => item.productId) }),
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudieron consultar los productos.");
        return await response.json() as { products: CartProduct[] };
      })
      .then((data) => {
        const availableProducts = data.products.filter(
          (product) => product.availability === "available",
        );
        const prices = new Map(availableProducts.map((product) => [
          product.id,
          Math.round(Number(product.price) * 100),
        ]));

        if (availableProducts.some((product) => {
          const previousPrice = previousPrices.current.get(product.id);
          return previousPrice !== undefined && previousPrice !== prices.get(product.id);
        })) {
          setHasPriceChanges(true);
        }

        previousPrices.current = prices;
        setProducts(data.products);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setHasError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [cart.items, isHydrated, refresh]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const lines = useMemo(() => {
    return cart.items.map((item) => {
      const result = products.find((candidate) => candidate.id === item.productId);
      const product = result?.availability === "available" ? result : undefined;
      return { item, product, subtotal: product ? calculateLineSubtotal(product, item.quantity) : 0 };
    });
  }, [cart.items, products]);

  const total = useMemo(() => calculateCartTotal(lines), [lines]);
  const unavailableCount = lines.filter((line) => !line.product).length;

  if (!isHydrated || isLoading) {
    return <p className="cart-state" role="status">Cargando el carrito…</p>;
  }

  if (cart.items.length === 0) {
    return (
      <section className="cart-empty">
        <h2>Tu carrito está vacío</h2>
        <p>Agregá productos desde el catálogo.</p>
        <Link className="catalog-button" href="/">Volver al catálogo</Link>
      </section>
    );
  }

  if (hasError) {
    return (
      <section className="cart-empty" role="alert">
        <h2>No pudimos verificar el carrito</h2>
        <p>Revisá tu conexión e intentá nuevamente.</p>
        <button className="catalog-button" onClick={() => setRefresh((value) => value + 1)} type="button">
          Reintentar
        </button>
      </section>
    );
  }

  return (
    <>
      {hasPriceChanges && (
        <p className="cart-sync-notice" role="status">
          Se actualizaron uno o más precios con los valores vigentes del catálogo.
        </p>
      )}
      <div className="cart-layout">
        <section className="cart-lines" aria-label="Productos del carrito">
          {unavailableCount > 0 && (
            <p className="cart-sync-warning" role="alert">
              {unavailableCount === 1
                ? "Hay un producto no disponible. Eliminalo del carrito antes de preparar el pedido."
                : `Hay ${unavailableCount} productos no disponibles. Eliminalos del carrito antes de preparar el pedido.`}
            </p>
          )}
          {lines.map(({ item, product, subtotal }) => {
            if (!product) {
              return (
                <article className="cart-line" key={item.productId}>
                  <div>
                    <h2>Producto no disponible</h2>
                    <p>Este producto fue desactivado o ya no existe en el catálogo.</p>
                  </div>
                  <button className="cart-remove" onClick={() => removeItem(item.productId)} type="button">
                    Eliminar
                  </button>
                </article>
              );
            }

            const onQuantityChange = (raw: string) => {
              const quantity = Number(raw);
              if (isQuantityValid(quantity, product.sale_unit)) {
                setQuantity(item.productId, quantity, product.sale_unit);
              }
            };

            return (
              <article className="cart-line" key={item.productId}>
                <div className="cart-line__info">
                  <h2>{product.name}</h2>
                  <p>
                    {currencyFormatter.format(typeof product.price === "number" ? product.price : Number(product.price))}
                    {" "}{product.sale_unit === "kg" ? "por kg" : "por unidad"}
                  </p>
                </div>

                <label className="cart-line__quantity">
                  <span>{product.sale_unit === "kg" ? "Gramos" : "Unidades"}</span>
                  <input
                    inputMode="numeric"
                    min="1"
                    max={product.sale_unit === "unit" ? 999 : 100000}
                    onChange={(event) => onQuantityChange(event.currentTarget.value)}
                    step="1"
                    type="number"
                    value={item.quantity}
                  />
                </label>

                <strong className="cart-line__subtotal">{currencyFormatter.format(subtotal)}</strong>
                <button className="cart-remove" onClick={() => removeItem(item.productId)} type="button">
                  Eliminar
                </button>
              </article>
            );
          })}
        </section>

        <aside className="cart-summary">
          <p>Importes estimativos</p>
          <strong>{currencyFormatter.format(total)}</strong>
          <span>
            El peso finalmente preparado puede diferir y el supermercado deberá confirmar el pedido y el importe por WhatsApp.
          </span>
          <button className="catalog-button" onClick={() => setRefresh((value) => value + 1)} type="button">
            Actualizar precios y disponibilidad
          </button>
          <button className="cart-clear" onClick={clearCart} type="button">Vaciar carrito</button>
        </aside>
      </div>
    </>
  );
}

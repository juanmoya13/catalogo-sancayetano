"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateCartTotal,
  calculateLineSubtotal,
  currencyFormatter,
  isQuantityValid,
} from "../domain";
import type { PreparedOrderLine } from "../checkout";
import { useCart } from "../context";
import type { CartProduct } from "../types";

type PreparedOrder = {
  lines: PreparedOrderLine[];
  total: number;
  message: string;
  whatsappUrl: string;
};

export function CartPage() {
  const { cart, isHydrated, setQuantity, removeItem, clearCart } = useCart();
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [hasPriceChanges, setHasPriceChanges] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [preparedOrder, setPreparedOrder] = useState<PreparedOrder | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [showOrderText, setShowOrderText] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
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

  async function prepareOrder() {
    setIsPreparing(true);
    setPreparedOrder(null);
    setCheckoutMessage("");
    setCopyMessage("");

    try {
      const response = await fetch("/api/checkout/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart.items }),
        cache: "no-store",
      });
      const data = await response.json() as Partial<PreparedOrder> & {
        error?: string;
        unavailableProductIds?: string[];
        products?: Extract<CartProduct, { availability: "available" }>[];
      };

      if (response.status === 409 && data.unavailableProductIds) {
        const unavailableIds = new Set(data.unavailableProductIds);
        setProducts((current) => current.map((product) =>
          unavailableIds.has(product.id)
            ? { id: product.id, availability: "unavailable" }
            : product,
        ));
        setCheckoutMessage(data.error ?? "Quitá los productos no disponibles para continuar.");
        return;
      }

      if (response.status === 422 && data.products) {
        const currentProducts = new Map(data.products.map((product) => [product.id, product]));
        setProducts((current) => current.map((product) => currentProducts.get(product.id) ?? product));
        setCheckoutMessage(data.error ?? "Revisá las cantidades y volvé a preparar el pedido.");
        return;
      }

      if (!response.ok || !data.lines || typeof data.total !== "number" || !data.message || !data.whatsappUrl) {
        throw new Error(data.error ?? "No se pudo preparar el pedido.");
      }

      const currentPrices = new Map(products.flatMap((product) =>
        product.availability === "available"
          ? [[product.id, Math.round(Number(product.price) * 100)] as const]
          : [],
      ));
      if (data.lines.some((line) => currentPrices.get(line.productId) !== Math.round(Number(line.price) * 100))) {
        setHasPriceChanges(true);
      }

      const updatedProducts = new Map(data.lines.map((line) => [line.productId, {
        id: line.productId,
        name: line.name,
        price: line.price,
        sale_unit: line.saleUnit,
        availability: "available" as const,
      }]));
      setProducts((current) => current.map((product) => updatedProducts.get(product.id) ?? product));
      setPreparedOrder(data as PreparedOrder);
      setCheckoutMessage("");
    } catch (error) {
      setCheckoutMessage(error instanceof Error
        ? error.message
        : "No se pudo preparar el pedido. Revisá tu conexión e intentá nuevamente.");
    } finally {
      setIsPreparing(false);
    }
  }

  async function copyOrderMessage() {
    if (!preparedOrder) return;

    try {
      await navigator.clipboard.writeText(preparedOrder.message);
      setCopyMessage("Detalle copiado.");
    } catch {
      setShowOrderText(true);
      setCopyMessage("No se pudo acceder al portapapeles. Seleccioná el detalle y copialo manualmente.");
    }
  }

  function invalidatePreparedOrder() {
    setPreparedOrder(null);
    setCheckoutMessage("");
    setCopyMessage("");
  }

  function refreshCartProducts() {
    invalidatePreparedOrder();
    setRefresh((value) => value + 1);
  }

  function removeCartLine(productId: string) {
    invalidatePreparedOrder();
    removeItem(productId);
  }

  function clearCartAndOrder() {
    invalidatePreparedOrder();
    clearCart();
  }

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
        <button className="catalog-button" onClick={refreshCartProducts} type="button">
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
                  <button className="cart-remove" disabled={isPreparing} onClick={() => removeCartLine(item.productId)} type="button">
                    Eliminar
                  </button>
                </article>
              );
            }

            const onQuantityChange = (raw: string) => {
              const quantity = Number(raw);
              if (isQuantityValid(quantity, product.sale_unit)) {
                invalidatePreparedOrder();
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
                    disabled={isPreparing}
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
                <button className="cart-remove" disabled={isPreparing} onClick={() => removeCartLine(item.productId)} type="button">
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
          {preparedOrder ? (
            <section className="cart-prepared-order" aria-live="polite">
              <p>Pedido preparado con precios vigentes. El total estimado es {currencyFormatter.format(preparedOrder.total)}.</p>
              <a className="catalog-button" href={preparedOrder.whatsappUrl} rel="noreferrer" target="_blank">
                Abrir WhatsApp
              </a>
              <button className="cart-secondary-button" onClick={copyOrderMessage} type="button">
                Copiar detalle
              </button>
              {copyMessage && <p role="status">{copyMessage}</p>}
              {showOrderText && (
                <label className="cart-order-text">
                  <span>Detalle para copiar</span>
                  <textarea readOnly value={preparedOrder.message} />
                </label>
              )}
              <p>WhatsApp no envía ni confirma el pedido automáticamente. Revisá el mensaje y envialo desde la aplicación.</p>
            </section>
          ) : (
            <button
              className="catalog-button"
              disabled={isPreparing || isLoading || hasError || unavailableCount > 0}
              onClick={prepareOrder}
              type="button"
            >
              {isPreparing ? "Preparando…" : "Preparar pedido"}
            </button>
          )}
          {checkoutMessage && <p className="cart-checkout-message" role="alert">{checkoutMessage}</p>}
          <button className="cart-clear" disabled={isPreparing} onClick={clearCartAndOrder} type="button">Vaciar carrito</button>
        </aside>
      </div>
    </>
  );
}

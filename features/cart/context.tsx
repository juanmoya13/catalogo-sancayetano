"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addCartItem,
  calculateCartItemCount,
  createEmptyCart,
  removeCartItem,
  updateCartItemQuantity,
} from "./domain";
import { readCart, writeCart } from "./storage";
import type { Cart, CartProduct, SaleUnit } from "./types";

type CartContextValue = {
  cart: Cart;
  isHydrated: boolean;
  addItem: (productId: string, quantity: number, saleUnit: SaleUnit) => boolean;
  setQuantity: (productId: string, quantity: number, saleUnit: SaleUnit) => boolean;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  lineCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(createEmptyCart);
  const [isHydrated, setIsHydrated] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setCart(readCart());
    setIsHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!isHydrated) return;

    const legacyProductIds = cart.items
      .filter((item) => !item.saleUnit)
      .map((item) => item.productId);
    if (legacyProductIds.length === 0) return;

    const controller = new AbortController();
    fetch("/api/cart/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: legacyProductIds }),
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo migrar la modalidad del carrito.");
        return await response.json() as { products: CartProduct[] };
      })
      .then(({ products }) => {
        const saleUnits = new Map(products.flatMap((product) =>
          product.availability === "available"
            ? [[product.id, product.sale_unit] as const]
            : [],
        ));
        setCart((current) => {
          let changed = false;
          const items = current.items.map((item) => {
            const saleUnit = saleUnits.get(item.productId);
            if (!item.saleUnit && saleUnit) {
              changed = true;
              return { ...item, saleUnit };
            }
            return item;
          });
          return changed ? { ...current, items } : current;
        });
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [cart.items, isHydrated]);

  useEffect(() => {
    if (isHydrated) writeCart(cart);
  }, [cart, isHydrated]);

  const commit = useCallback((nextCart: Cart) => {
    setCart(nextCart);
  }, []);

  const addItem = useCallback((productId: string, quantity: number, saleUnit: SaleUnit) => {
    if (!productId || !Number.isSafeInteger(quantity) || quantity <= 0) return false;
    const max = saleUnit === "unit" ? 999 : 100_000;
    if (quantity > max) return false;

    commit(addCartItem(cart, productId, quantity, saleUnit));
    return true;
  }, [cart, commit]);

  const setQuantity = useCallback((productId: string, quantity: number, saleUnit: SaleUnit) => {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) return false;
    const max = saleUnit === "unit" ? 999 : 100_000;
    if (quantity > max) return false;

    commit(updateCartItemQuantity(cart, productId, quantity, saleUnit));
    return true;
  }, [cart, commit]);

  const removeItem = useCallback((productId: string) => {
    commit(removeCartItem(cart, productId));
  }, [cart, commit]);

  const clearCart = useCallback(() => {
    commit(createEmptyCart());
  }, [commit]);

  const value = useMemo<CartContextValue>(() => ({
    cart,
    isHydrated,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
    lineCount: calculateCartItemCount(cart.items),
  }), [addItem, cart, clearCart, isHydrated, removeItem, setQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider.");
  return context;
}

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
  createEmptyCart,
  removeCartItem,
  updateCartItemQuantity,
} from "./domain";
import { readCart, writeCart } from "./storage";
import type { Cart, SaleUnit } from "./types";

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
    if (isHydrated) writeCart(cart);
  }, [cart, isHydrated]);

  const commit = useCallback((nextCart: Cart) => {
    setCart(nextCart);
  }, []);

  const addItem = useCallback((productId: string, quantity: number, saleUnit: SaleUnit) => {
    if (!productId || !Number.isSafeInteger(quantity) || quantity <= 0) return false;
    const max = saleUnit === "unit" ? 999 : 100_000;
    if (quantity > max) return false;

    commit(addCartItem(cart, productId, quantity));
    return true;
  }, [cart, commit]);

  const setQuantity = useCallback((productId: string, quantity: number, saleUnit: SaleUnit) => {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) return false;
    const max = saleUnit === "unit" ? 999 : 100_000;
    if (quantity > max) return false;

    commit(updateCartItemQuantity(cart, productId, quantity));
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
    lineCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
  }), [addItem, cart, clearCart, isHydrated, removeItem, setQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider.");
  return context;
}

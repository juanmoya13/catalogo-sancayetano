"use client";

import { CART_STORAGE_KEY } from "./constants";
import { createEmptyCart, parseCart } from "./domain";
import type { Cart } from "./types";

export function readCart(): Cart {
  if (typeof window === "undefined") return createEmptyCart();

  try {
    return parseCart(window.localStorage.getItem(CART_STORAGE_KEY));
  } catch {
    return createEmptyCart();
  }
}

export function writeCart(cart: Cart) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // The app remains usable if storage is unavailable or full.
  }
}

import { MAX_UNIT_QUANTITY, MAX_WEIGHT_GRAMS } from "./constants";
import type { AvailableCartProduct, Cart, CartItem, SaleUnit } from "./types";

export function createEmptyCart(): Cart {
  return { version: 1, items: [] };
}

export function normalizeCartItems(items: CartItem[]): CartItem[] {
  const quantities = new Map<string, number>();

  for (const item of items) {
    if (!item || typeof item.productId !== "string") continue;
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) continue;

    const current = quantities.get(item.productId) ?? 0;
    quantities.set(item.productId, current + item.quantity);
  }

  return Array.from(quantities, ([productId, quantity]) => ({
    productId,
    quantity,
  })).filter((item) => Number.isSafeInteger(item.quantity) && item.quantity > 0);
}

export function parseCart(raw: string | null): Cart {
  if (!raw) return createEmptyCart();

  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object") return createEmptyCart();

    const candidate = value as Partial<Cart>;
    if (candidate.version !== 1 || !Array.isArray(candidate.items)) {
      return createEmptyCart();
    }

    const items = candidate.items.filter((item): item is CartItem => {
      if (!item || typeof item !== "object") return false;
      const cartItem = item as Partial<CartItem>;
      return typeof cartItem.productId === "string" &&
        Number.isSafeInteger(cartItem.quantity) &&
        (cartItem.quantity ?? 0) > 0;
    });

    return { version: 1, items: normalizeCartItems(items) };
  } catch {
    return createEmptyCart();
  }
}

export function addCartItem(cart: Cart, productId: string, quantity: number): Cart {
  return {
    version: 1,
    items: normalizeCartItems([
      ...cart.items,
      { productId, quantity },
    ]),
  };
}

export function updateCartItemQuantity(cart: Cart, productId: string, quantity: number): Cart {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) return cart;

  return {
    version: 1,
    items: cart.items.map((item) =>
      item.productId === productId ? { ...item, quantity } : item,
    ),
  };
}

export function removeCartItem(cart: Cart, productId: string): Cart {
  return {
    version: 1,
    items: cart.items.filter((item) => item.productId !== productId),
  };
}

export function isQuantityValid(quantity: number, saleUnit: SaleUnit) {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) return false;
  return saleUnit === "unit"
    ? quantity <= MAX_UNIT_QUANTITY
    : quantity <= MAX_WEIGHT_GRAMS;
}

export function roundMoney(value: number) {
  const cents = Math.round((value + Number.EPSILON) * 100);
  return cents / 100;
}

export function calculateLineSubtotal(product: AvailableCartProduct, quantity: number) {
  const price = typeof product.price === "number"
    ? product.price
    : Number(product.price);

  if (!Number.isFinite(price) || price <= 0) return 0;

  const rawSubtotal = product.sale_unit === "kg"
    ? price * quantity / 1000
    : price * quantity;

  return roundMoney(rawSubtotal);
}

export function calculateCartTotal(lines: Array<{ subtotal: number }>) {
  const cents = lines.reduce((sum, line) => {
    const lineCents = Math.round(line.subtotal * 100);
    return sum + lineCents;
  }, 0);
  return cents / 100;
}

export const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

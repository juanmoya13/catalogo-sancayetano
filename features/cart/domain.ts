import { CART_VERSION, MAX_UNIT_QUANTITY, MAX_WEIGHT_GRAMS } from "./constants";
import type { AvailableCartProduct, Cart, CartItem, SaleUnit } from "./types";

export function createEmptyCart(): Cart {
  return { version: CART_VERSION, items: [] };
}

export function normalizeCartItems(items: CartItem[]): CartItem[] {
  const normalized = new Map<string, CartItem>();

  for (const item of items) {
    if (!item || typeof item.productId !== "string") continue;
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) continue;

    const current = normalized.get(item.productId);
    normalized.set(item.productId, {
      productId: item.productId,
      quantity: (current?.quantity ?? 0) + item.quantity,
      ...(item.saleUnit ? { saleUnit: item.saleUnit } : current?.saleUnit ? { saleUnit: current.saleUnit } : {}),
    });
  }

  return Array.from(normalized.values()).filter(
    (item) => Number.isSafeInteger(item.quantity) && item.quantity > 0,
  );
}

export function parseCart(raw: string | null): Cart {
  if (!raw) return createEmptyCart();

  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object") return createEmptyCart();

    const candidate = value as { version?: unknown; items?: unknown };
    if ((candidate.version !== 1 && candidate.version !== CART_VERSION) || !Array.isArray(candidate.items)) {
      return createEmptyCart();
    }

    const items = candidate.items.filter((item): item is CartItem => {
      if (!item || typeof item !== "object") return false;
      const cartItem = item as Partial<CartItem>;
      return typeof cartItem.productId === "string" &&
        Number.isSafeInteger(cartItem.quantity) &&
        (cartItem.quantity ?? 0) > 0 &&
        (cartItem.saleUnit === undefined || cartItem.saleUnit === "unit" || cartItem.saleUnit === "kg");
    });

    return { version: CART_VERSION, items: normalizeCartItems(items) };
  } catch {
    return createEmptyCart();
  }
}

export function addCartItem(cart: Cart, productId: string, quantity: number, saleUnit: SaleUnit): Cart {
  return {
    version: CART_VERSION,
    items: normalizeCartItems([
      ...cart.items,
      { productId, quantity, saleUnit },
    ]),
  };
}

export function updateCartItemQuantity(cart: Cart, productId: string, quantity: number, saleUnit: SaleUnit): Cart {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) return cart;

  return {
    version: CART_VERSION,
    items: cart.items.map((item) =>
      item.productId === productId ? { ...item, quantity, saleUnit } : item,
    ),
  };
}

export function removeCartItem(cart: Cart, productId: string): Cart {
  return {
    version: CART_VERSION,
    items: cart.items.filter((item) => item.productId !== productId),
  };
}

export function isQuantityValid(quantity: number, saleUnit: SaleUnit) {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) return false;
  return saleUnit === "unit"
    ? quantity <= MAX_UNIT_QUANTITY
    : quantity <= MAX_WEIGHT_GRAMS;
}

export function calculateCartItemCount(items: CartItem[]) {
  return items.reduce((count, item) => count + (item.saleUnit === "unit" ? item.quantity : 1), 0);
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

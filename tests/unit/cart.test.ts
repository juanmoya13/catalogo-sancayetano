import { describe, expect, it } from "vitest";
import {
  addCartItem,
  calculateCartItemCount,
  calculateCartTotal,
  calculateLineSubtotal,
  isQuantityValid,
  parseCart,
  roundMoney,
} from "../../features/cart/domain";
import { buildOrderMessage, buildWhatsAppUrl } from "../../features/cart/checkout";
import type { AvailableCartProduct } from "../../features/cart/types";

const unitProduct: AvailableCartProduct = {
  id: "product-unit",
  availability: "available",
  name: "Arroz",
  price: "1250.50",
  sale_unit: "unit",
};

const weightProduct: AvailableCartProduct = {
  id: "product-weight",
  availability: "available",
  name: "Manzana",
  price: "10000.00",
  sale_unit: "kg",
};

describe("cart calculations", () => {
  it("calculates unit and gram-based subtotals with two-decimal rounding", () => {
    expect(calculateLineSubtotal(unitProduct, 3)).toBe(3751.5);
    expect(calculateLineSubtotal(weightProduct, 450)).toBe(4500);
    expect(roundMoney(1.005)).toBe(1.01);
  });

  it("sums already-rounded line totals in cents", () => {
    expect(calculateCartTotal([{ subtotal: 1.01 }, { subtotal: 2.34 }])).toBe(3.35);
  });

  it("combines repeated products and safely rejects invalid quantities", () => {
    const cart = addCartItem(
      { version: 2, items: [{ productId: unitProduct.id, quantity: 2, saleUnit: "unit" }] },
      unitProduct.id,
      3,
      "unit",
    );

    expect(cart.items).toEqual([{ productId: unitProduct.id, quantity: 5, saleUnit: "unit" }]);
    expect(isQuantityValid(1, "unit")).toBe(true);
    expect(isQuantityValid(0, "kg")).toBe(false);
    expect(isQuantityValid(1.5, "unit")).toBe(false);
    expect(isQuantityValid(Number.MAX_SAFE_INTEGER + 1, "kg")).toBe(false);
  });

  it("counts weight-based products as one cart article regardless of grams", () => {
    expect(calculateCartItemCount([
      { productId: weightProduct.id, quantity: 1000, saleUnit: "kg" },
      { productId: unitProduct.id, quantity: 3, saleUnit: "unit" },
    ])).toBe(4);
  });
});

describe("cart persistence", () => {
  it("recovers malformed, incompatible, and invalid stored data as an empty cart", () => {
    expect(parseCart("not-json")).toEqual({ version: 2, items: [] });
    expect(parseCart(JSON.stringify({ version: 3, items: [] }))).toEqual({ version: 2, items: [] });
    expect(parseCart(JSON.stringify({
      version: 1,
      items: [{ productId: "bad", quantity: -1 }, { productId: "ok", quantity: 2 }],
    }))).toEqual({ version: 2, items: [{ productId: "ok", quantity: 2 }] });
  });

  it("migrates valid v1 cart data without losing quantity", () => {
    const migratedCart = parseCart(JSON.stringify({
      version: 1,
      items: [{ productId: "legacy-product", quantity: 1000 }],
    }));

    expect(migratedCart).toEqual({
      version: 2,
      items: [{ productId: "legacy-product", quantity: 1000 }],
    });
    expect(calculateCartItemCount(migratedCart.items)).toBe(1);
  });
});

describe("WhatsApp order message", () => {
  it("includes item quantity, current price, estimated total, and URL encoding", () => {
    const message = buildOrderMessage([
      {
        productId: unitProduct.id,
        quantity: 2,
        name: unitProduct.name,
        price: String(unitProduct.price),
        saleUnit: "unit",
        subtotal: 2501,
      },
      {
        productId: weightProduct.id,
        quantity: 450,
        name: weightProduct.name,
        price: String(weightProduct.price),
        saleUnit: "kg",
        subtotal: 4500,
      },
    ], 7001);
    const url = new URL(buildWhatsAppUrl("5491112345678", message));

    expect(message).toContain("2 unidades");
    expect(message).toContain("450 gramos");
    expect(message).toContain("Total estimado");
    expect(message).toContain("sujetos a confirmación");
    expect(url.hostname).toBe("wa.me");
    expect(url.pathname).toBe("/5491112345678");
    expect(url.searchParams.get("text")).toBe(message);
  });
});
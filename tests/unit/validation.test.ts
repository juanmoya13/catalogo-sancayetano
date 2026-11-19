import { describe, expect, it } from "vitest";
import { categorySchema } from "../../features/categories/schemas";
import { productSchema } from "../../features/products/schemas";

describe("product validation", () => {
  const validProduct = {
    name: "  Arroz  ",
    categoryId: "10000000-0000-4000-8000-000000000001",
    price: "1250.50",
    saleUnit: "unit",
    isActive: "true",
  };

  it("normalizes valid product fields", () => {
    expect(productSchema.parse(validProduct)).toEqual({
      ...validProduct,
      name: "Arroz",
      isActive: true,
    });
  });

  it.each(["0", "-1", "12.345", "1e3", "abc"])("rejects invalid price %s", (price) => {
    expect(productSchema.safeParse({ ...validProduct, price }).success).toBe(false);
  });

  it("rejects unsupported sale units", () => {
    expect(productSchema.safeParse({ ...validProduct, saleUnit: "box" }).success).toBe(false);
  });
});

describe("category validation", () => {
  it("trims names and converts an empty parent to null", () => {
    expect(categorySchema.parse({ name: "  Bebidas ", parentId: "", sortOrder: "1" })).toEqual({
      name: "Bebidas",
      parentId: null,
      sortOrder: 1,
    });
  });

  it("rejects invalid parent IDs and non-integer order values", () => {
    expect(categorySchema.safeParse({ name: "Bebidas", parentId: "invalid", sortOrder: "0" }).success).toBe(false);
    expect(categorySchema.safeParse({ name: "Bebidas", parentId: "", sortOrder: "1.5" }).success).toBe(false);
  });
});
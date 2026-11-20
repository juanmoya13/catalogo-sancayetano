import {
  calculateCartTotal,
  calculateLineSubtotal,
  currencyFormatter,
} from "./domain";
import type { AvailableCartProduct, CartItem } from "./types";

export type PreparedOrderLine = CartItem & {
  name: string;
  price: string;
  saleUnit: AvailableCartProduct["sale_unit"];
  subtotal: number;
};

export function calculatePreparedOrder(
  items: CartItem[],
  products: AvailableCartProduct[],
) {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const lines = items.map((item) => {
    const product = productsById.get(item.productId);
    if (!product) throw new Error("Falta un producto validado para el pedido.");

    return {
      productId: product.id,
      quantity: item.quantity,
      name: product.name,
      price: String(product.price),
      saleUnit: product.sale_unit,
      subtotal: calculateLineSubtotal(product, item.quantity),
    } satisfies PreparedOrderLine;
  });

  return {
    lines,
    total: calculateCartTotal(lines),
  };
}

export function buildOrderMessage(
  lines: PreparedOrderLine[],
  total: number,
) {
  const details = lines.map((line) => {
    const unitLabel = line.saleUnit === "kg" ? "por kg" : "por unidad";
    const quantityLabel = line.saleUnit === "kg"
      ? `${line.quantity} gramos`
      : `${line.quantity} ${line.quantity === 1 ? "unidad" : "unidades"}`;

    return [
      `- ${line.name}`,
      `  Cantidad: ${quantityLabel}`,
      `  Precio: ${currencyFormatter.format(Number(line.price))} ${unitLabel}`,
    ].join("\n");
  });

  return [
    "Hola, quisiera hacer este pedido:",
    "",
    ...details,
    "",
    `Total estimado: ${currencyFormatter.format(total)}`,
    "",
    "Los importes son estimativos y están sujetos a confirmación del supermercado.",
  ].join("\n");
}

export function buildWhatsAppUrl(phoneNumber: string, message: string) {
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

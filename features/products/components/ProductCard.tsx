import { AddToCart } from "@/features/cart/components/AddToCart";
import type { PublicProduct } from "../types";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function ProductCard({ product }: { product: PublicProduct }) {
  const price = typeof product.price === "number"
    ? product.price
    : Number(product.price);

  return (
    <article className="product-card">
      <h2 className="product-card__name">{product.name}</h2>
      <div className="product-card__price">
        <strong>{currencyFormatter.format(price)}</strong>
        <span>{product.sale_unit === "kg" ? "por kg" : "por unidad"}</span>
      </div>
      <AddToCart productId={product.id} saleUnit={product.sale_unit} />
    </article>
  );
}

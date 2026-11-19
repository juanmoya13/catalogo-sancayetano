import { createClient } from "@/lib/supabase/server";
import type { CartProduct } from "./types";

export async function getCartProducts(productIds: string[]): Promise<CartProduct[]> {
  const uniqueIds = [...new Set(productIds)].filter((id) =>
    /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)
  );

  if (uniqueIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, sale_unit")
    .eq("is_active", true)
    .in("id", uniqueIds);

  if (error) throw new Error("No se pudieron consultar los productos del carrito.");

  const activeProducts = new Map(
    ((data ?? []) as Omit<Extract<CartProduct, { availability: "available" }>, "availability">[])
      .map((product) => [product.id, product]),
  );

  return uniqueIds.map((id): CartProduct => {
    const product = activeProducts.get(id);
    return product
      ? { ...product, availability: "available" }
      : { id, availability: "unavailable" };
  });
}

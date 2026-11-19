import { createClient } from "@/lib/supabase/server";
import type { PublicProductPage } from "./types";

export const PUBLIC_PRODUCT_PAGE_SIZE = 24;

export async function getPublicProductPage(
  page = 1,
  pageSize = PUBLIC_PRODUCT_PAGE_SIZE,
): Promise<PublicProductPage> {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 100
      ? pageSize
      : PUBLIC_PRODUCT_PAGE_SIZE;

  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  const supabase = await createClient();

  const { data, count, error } = await supabase
    .from("products")
    .select("id, name, price, sale_unit", { count: "exact" })
    .eq("is_active", true)
    .order("name", { ascending: true })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) {
    throw new Error("No se pudo consultar el catálogo.");
  }

  const total = count ?? 0;

  return {
    products: data ?? [],
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages: Math.ceil(total / safePageSize),
  };
}

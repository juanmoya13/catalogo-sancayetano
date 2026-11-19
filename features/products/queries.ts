import { createClient } from "@/lib/supabase/server";
import { MAX_PUBLIC_SEARCH_LENGTH } from "./constants";
import type { PublicProductPage } from "./types";

export const PUBLIC_PRODUCT_PAGE_SIZE = 24;

export type PublicProductFilters = {
  search?: string;
  categoryId?: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export function isPublicCategoryId(value: string) {
  return UUID_PATTERN.test(value);
}

export async function getPublicProductPage(
  page = 1,
  pageSize = PUBLIC_PRODUCT_PAGE_SIZE,
  filters: PublicProductFilters = {},
): Promise<PublicProductPage> {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 100
      ? pageSize
      : PUBLIC_PRODUCT_PAGE_SIZE;

  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  const supabase = await createClient();
  const search = filters.search?.trim().slice(0, MAX_PUBLIC_SEARCH_LENGTH);
  let categoryIds: string[] | undefined;

  if (filters.categoryId) {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id, parent_id")
      .eq("id", filters.categoryId)
      .maybeSingle();

    if (categoryError) {
      throw new Error("No se pudieron consultar las categorías del catálogo.");
    }

    if (!category) {
      return {
        products: [],
        page: safePage,
        pageSize: safePageSize,
        total: 0,
        totalPages: 0,
      };
    }

    categoryIds = [category.id];

    if (!category.parent_id) {
      const { data: children, error: childrenError } = await supabase
        .from("categories")
        .select("id")
        .eq("parent_id", category.id);

      if (childrenError) {
        throw new Error("No se pudieron consultar las categorías del catálogo.");
      }

      categoryIds.push(...(children ?? []).map((child) => child.id));
    }
  }

  let query = supabase
    .from("products")
    .select("id, name, price, sale_unit", { count: "exact" })
    .eq("is_active", true);

  if (search) {
    const escapedSearch = search.replace(/[\\%_]/g, "\\$&");
    query = query.ilike("name", `%${escapedSearch}%`);
  }

  if (categoryIds) {
    query = query.in("category_id", categoryIds);
  }

  const { data, count, error } = await query
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

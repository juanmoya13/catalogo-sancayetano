import { createClient } from "@/lib/supabase/server";
import type { AdminProduct, ProductFormProduct } from "./admin-types";

const ADMIN_PRODUCT_FIELDS = "id, category_id, name, price, sale_unit, is_active, created_at, updated_at";

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const supabase = await createClient();
  const [{ data: products, error: productsError }, { data: categories, error: categoriesError }] =
    await Promise.all([
      supabase
        .from("products")
        .select(ADMIN_PRODUCT_FIELDS)
        .order("name", { ascending: true })
        .order("id", { ascending: true }),
      supabase.from("categories").select("id, name"),
    ]);

  if (productsError || categoriesError) {
    throw new Error("No se pudieron cargar los productos.");
  }

  const categoryNames = new Map((categories ?? []).map((category) => [category.id, category.name]));
  return (products ?? []).map((product) => ({
    ...product,
    category_name: categoryNames.get(product.category_id) ?? "Categoría no disponible",
  }));
}

export async function getAdminProduct(id: string): Promise<ProductFormProduct | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(ADMIN_PRODUCT_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("No se pudo cargar el producto.");
  return data;
}
import { createClient } from "@/lib/supabase/server";
import type { AdminCategory, Category, PublicCategory } from "./types";

const CATEGORY_FIELDS = "id, parent_id, name, sort_order";

function compareCategories(left: Category, right: Category) {
  return left.sort_order - right.sort_order || left.name.localeCompare(right.name, "es");
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const supabase = await createClient();
  const [{ data: categories, error: categoriesError }, { data: products, error: productsError }] =
    await Promise.all([
      supabase.from("categories").select(CATEGORY_FIELDS),
      supabase.from("products").select("category_id"),
    ]);

  if (categoriesError || productsError) {
    throw new Error("No se pudieron cargar las categorías.");
  }

  const productCounts = new Map<string, number>();
  for (const product of products ?? []) {
    productCounts.set(product.category_id, (productCounts.get(product.category_id) ?? 0) + 1);
  }

  const categoriesById = new Map<string, AdminCategory>();
  for (const category of categories ?? []) {
    categoriesById.set(category.id, {
      ...category,
      productsCount: productCounts.get(category.id) ?? 0,
      children: [],
    });
  }

  const roots: AdminCategory[] = [];
  for (const category of categoriesById.values()) {
    if (category.parent_id) {
      categoriesById.get(category.parent_id)?.children.push(category);
    } else {
      roots.push(category);
    }
  }

  const sortTree = (items: AdminCategory[]) => {
    items.sort(compareCategories);
    items.forEach((item) => sortTree(item.children));
  };
  sortTree(roots);

  return roots;
}

export async function getPublicCategories(): Promise<PublicCategory[]> {
  const supabase = await createClient();
  const [{ data: categories, error: categoriesError }, { data: products, error: productsError }] =
    await Promise.all([
      supabase.from("categories").select(CATEGORY_FIELDS),
      supabase.from("products").select("category_id").eq("is_active", true),
    ]);

  if (categoriesError || productsError) {
    throw new Error("No se pudieron consultar las categorías del catálogo.");
  }

  const categoriesById = new Map<string, PublicCategory>();
  for (const category of categories ?? []) {
    categoriesById.set(category.id, { ...category, children: [] });
  }

  const visibleIds = new Set((products ?? []).map((product) => product.category_id));
  for (const category of categoriesById.values()) {
    if (category.parent_id && visibleIds.has(category.id)) {
      visibleIds.add(category.parent_id);
    }
  }

  const roots: PublicCategory[] = [];
  for (const category of categoriesById.values()) {
    if (!visibleIds.has(category.id)) continue;

    if (category.parent_id) {
      categoriesById.get(category.parent_id)?.children.push(category);
    } else {
      roots.push(category);
    }
  }

  const sortTree = (items: PublicCategory[]) => {
    items.sort(compareCategories);
    items.forEach((item) => sortTree(item.children));
  };
  sortTree(roots);

  return roots;
}
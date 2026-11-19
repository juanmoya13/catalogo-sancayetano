"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { categoryIdSchema, categorySchema } from "./schemas";
import type { CategoryActionState } from "./types";

const initialState: CategoryActionState = { status: "idle", message: "" };

function formValues(formData: FormData) {
  return {
    name: formData.get("name"),
    parentId: formData.get("parentId"),
    sortOrder: formData.get("sortOrder"),
  };
}

function validationState(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): CategoryActionState {
  const fieldErrors: NonNullable<CategoryActionState["fieldErrors"]> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if ((field === "name" || field === "parentId" || field === "sortOrder") && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return { status: "error", message: "Revisá los datos ingresados.", fieldErrors };
}

async function validateParent(parentId: string | null, categoryId?: string) {
  const supabase = await createClient();

  if (categoryId && parentId === categoryId) {
    return { error: "Una categoría no puede ser su propia categoría principal." };
  }

  if (parentId) {
    const { data: parent, error } = await supabase
      .from("categories")
      .select("id, parent_id")
      .eq("id", parentId)
      .maybeSingle();

    if (error || !parent) return { error: "La categoría principal seleccionada no existe." };
    if (parent.parent_id) return { error: "Una subcategoría no puede contener otras categorías." };
  }

  if (categoryId && parentId) {
    const { count, error } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", categoryId);

    if (error) return { error: "No se pudo validar la jerarquía de la categoría." };
    if (count) return { error: "Una categoría con subcategorías debe mantenerse como principal." };
  }

  return { error: null };
}

function revalidateCategories() {
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function createCategoryAction(
  _previousState: CategoryActionState = initialState,
  formData: FormData,
): Promise<CategoryActionState> {
  void _previousState;
  await requireAdmin();
  const parsed = categorySchema.safeParse(formValues(formData));
  if (!parsed.success) return validationState(parsed.error);

  const parentValidation = await validateParent(parsed.data.parentId);
  if (parentValidation.error) {
    return {
      status: "error",
      message: parentValidation.error,
      fieldErrors: { parentId: parentValidation.error },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    name: parsed.data.name,
    parent_id: parsed.data.parentId,
    sort_order: parsed.data.sortOrder,
  });

  if (error) return { status: "error", message: "No se pudo crear la categoría. Verificá los datos e intentá nuevamente." };
  revalidateCategories();
  return { status: "success", message: "Categoría creada correctamente." };
}

export async function updateCategoryAction(
  _previousState: CategoryActionState = initialState,
  formData: FormData,
): Promise<CategoryActionState> {
  void _previousState;
  await requireAdmin();
  const id = categoryIdSchema.safeParse(formData.get("id"));
  if (!id.success) return { status: "error", message: "La categoría seleccionada no es válida." };

  const parsed = categorySchema.safeParse(formValues(formData));
  if (!parsed.success) return validationState(parsed.error);

  const parentValidation = await validateParent(parsed.data.parentId, id.data);
  if (parentValidation.error) {
    return {
      status: "error",
      message: parentValidation.error,
      fieldErrors: { parentId: parentValidation.error },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      parent_id: parsed.data.parentId,
      sort_order: parsed.data.sortOrder,
    })
    .eq("id", id.data)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "No se pudo guardar la categoría. Verificá los datos e intentá nuevamente." };
  }
  revalidateCategories();
  return { status: "success", message: "Cambios guardados correctamente." };
}

export async function deleteCategoryAction(
  _previousState: CategoryActionState = initialState,
  formData: FormData,
): Promise<CategoryActionState> {
  void _previousState;
  await requireAdmin();
  const parsedId = categoryIdSchema.safeParse(formData.get("id"));
  if (!parsedId.success) return { status: "error", message: "La categoría seleccionada no es válida." };

  const supabase = await createClient();
  const [{ count: productCount, error: productsError }, { count: childCount, error: childrenError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("category_id", parsedId.data),
      supabase
        .from("categories")
        .select("id", { count: "exact", head: true })
        .eq("parent_id", parsedId.data),
    ]);

  if (productsError || childrenError) {
    return { status: "error", message: "No se pudieron verificar las dependencias de la categoría." };
  }
  if (productCount || childCount) {
    const dependencies = [
      productCount ? `${productCount} producto${productCount === 1 ? "" : "s"}` : null,
      childCount ? `${childCount} subcategoría${childCount === 1 ? "" : "s"}` : null,
    ].filter(Boolean);
    return {
      status: "error",
      message: `No se puede eliminar: ${dependencies.join(" y ")}. Reasignalos o resolvelos antes de continuar.`,
    };
  }

  const { error } = await supabase.from("categories").delete().eq("id", parsedId.data);
  if (error) {
    if (error.code === "23503") {
      return { status: "error", message: "La categoría tiene dependencias. Resolvelas antes de eliminarla." };
    }
    return { status: "error", message: "No se pudo eliminar la categoría. Intentá nuevamente." };
  }

  revalidateCategories();
  return { status: "success", message: "Categoría eliminada correctamente." };
}
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { productIdSchema, productSchema } from "./schemas";
import type { ProductActionState } from "./types";

const initialState: ProductActionState = { status: "idle", message: "" };
const zBooleanSchema = z.enum(["true", "false"]).transform((value) => value === "true");

function formValues(formData: FormData) {
  return {
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    price: formData.get("price"),
    saleUnit: formData.get("saleUnit"),
    isActive: formData.get("isActive"),
  };
}

function validationState(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): ProductActionState {
  const fieldErrors: NonNullable<ProductActionState["fieldErrors"]> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (
      (field === "name" || field === "categoryId" || field === "price" || field === "saleUnit" || field === "isActive") &&
      !fieldErrors[field]
    ) {
      fieldErrors[field] = issue.message;
    }
  }

  return { status: "error", message: "Revisá los datos ingresados.", fieldErrors };
}

async function categoryExists(categoryId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

function revalidateProductRoutes(id?: string) {
  revalidatePath("/");
  revalidatePath("/admin/productos");
  if (id) revalidatePath(`/admin/productos/${id}`);
}

export async function createProductAction(
  _previousState: ProductActionState = initialState,
  formData: FormData,
): Promise<ProductActionState> {
  void _previousState;
  await requireAdmin();
  const parsed = productSchema.safeParse(formValues(formData));
  if (!parsed.success) return validationState(parsed.error);
  if (!(await categoryExists(parsed.data.categoryId))) {
    return {
      status: "error",
      message: "La categoría seleccionada no existe o no se pudo validar.",
      fieldErrors: { categoryId: "Seleccioná una categoría disponible." },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    name: parsed.data.name,
    category_id: parsed.data.categoryId,
    price: parsed.data.price,
    sale_unit: parsed.data.saleUnit,
    is_active: parsed.data.isActive,
  });

  if (error) return { status: "error", message: "No se pudo crear el producto. Verificá los datos e intentá nuevamente." };
  revalidateProductRoutes();
  return { status: "success", message: "Producto creado correctamente." };
}

export async function updateProductAction(
  _previousState: ProductActionState = initialState,
  formData: FormData,
): Promise<ProductActionState> {
  void _previousState;
  await requireAdmin();
  const parsedId = productIdSchema.safeParse(formData.get("id"));
  if (!parsedId.success) return { status: "error", message: "El producto seleccionado no es válido." };

  const parsed = productSchema.safeParse(formValues(formData));
  if (!parsed.success) return validationState(parsed.error);
  if (!(await categoryExists(parsed.data.categoryId))) {
    return {
      status: "error",
      message: "La categoría seleccionada no existe o no se pudo validar.",
      fieldErrors: { categoryId: "Seleccioná una categoría disponible." },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({
      name: parsed.data.name,
      category_id: parsed.data.categoryId,
      price: parsed.data.price,
      sale_unit: parsed.data.saleUnit,
      is_active: parsed.data.isActive,
    })
    .eq("id", parsedId.data)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "No se pudo guardar el producto. Verificá los datos e intentá nuevamente." };
  }
  revalidateProductRoutes(parsedId.data);
  return { status: "success", message: "Cambios guardados correctamente." };
}

export async function toggleProductStatusAction(
  _previousState: ProductActionState = initialState,
  formData: FormData,
): Promise<ProductActionState> {
  void _previousState;
  await requireAdmin();
  const parsedId = productIdSchema.safeParse(formData.get("id"));
  const isActive = zBooleanSchema.safeParse(formData.get("isActive"));
  if (!parsedId.success || !isActive.success) {
    return { status: "error", message: "No se pudo validar el producto seleccionado." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({ is_active: isActive.data })
    .eq("id", parsedId.data)
    .select("id")
    .maybeSingle();

  if (error || !data) return { status: "error", message: "No se pudo cambiar la disponibilidad del producto." };
  revalidateProductRoutes(parsedId.data);
  return {
    status: "success",
    message: isActive.data ? "Producto activado." : "Producto desactivado.",
  };
}

export async function deleteProductAction(
  _previousState: ProductActionState = initialState,
  formData: FormData,
): Promise<ProductActionState> {
  void _previousState;
  await requireAdmin();
  const parsedId = productIdSchema.safeParse(formData.get("id"));
  if (!parsedId.success) return { status: "error", message: "El producto seleccionado no es válido." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", parsedId.data)
    .select("id")
    .maybeSingle();

  if (error || !data) return { status: "error", message: "No se pudo eliminar el producto. Intentá nuevamente." };
  revalidateProductRoutes(parsedId.data);
  return { status: "success", message: "Producto eliminado correctamente." };
}
"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createProductAction, updateProductAction } from "@/features/products/actions";
import type { ProductFormProduct } from "@/features/products/admin-types";
import type { AdminCategory } from "@/features/categories/types";
import type { ProductActionState } from "@/features/products/types";

const emptyState: ProductActionState = { status: "idle", message: "" };

function flattenCategories(categories: AdminCategory[]): AdminCategory[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children)]);
}

function FieldError({ children }: { children?: string }) {
  return children ? <span className="category-field-error">{children}</span> : null;
}

export default function ProductForm({
  categories,
  product,
}: {
  categories: AdminCategory[];
  product?: ProductFormProduct;
}) {
  const action = product ? updateProductAction : createProductAction;
  const [state, formAction, pending] = useActionState(action, emptyState);
  const options = flattenCategories(categories);

  return (
    <form className="product-form" action={formAction}>
      {product && <input type="hidden" name="id" value={product.id} />}
      <label>
        Nombre del producto
        <input name="name" defaultValue={product?.name ?? ""} maxLength={160} required autoFocus />
        <FieldError>{state.fieldErrors?.name}</FieldError>
      </label>
      <label>
        Categoría
        <select name="categoryId" defaultValue={product?.category_id ?? ""} required>
          <option value="" disabled>Seleccioná una categoría</option>
          {options.map((category) => (
            <option key={category.id} value={category.id}>
              {category.parent_id ? `— ${category.name}` : category.name}
            </option>
          ))}
        </select>
        <FieldError>{state.fieldErrors?.categoryId}</FieldError>
      </label>
      <label>
        Precio
        <input
          name="price"
          type="number"
          inputMode="decimal"
          min="0.01"
          max="9999999999.99"
          step="0.01"
          placeholder="0,00"
          defaultValue={product?.price ?? ""}
          required
        />
        <FieldError>{state.fieldErrors?.price}</FieldError>
      </label>
      <label>
        Unidad de venta
        <select name="saleUnit" defaultValue={product?.sale_unit ?? "unit"} required>
          <option value="unit">Por unidad</option>
          <option value="kg">Por kilogramo</option>
        </select>
        <FieldError>{state.fieldErrors?.saleUnit}</FieldError>
      </label>
      <label>
        Disponibilidad
        <select name="isActive" defaultValue={String(product?.is_active ?? true)} required>
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
        <FieldError>{state.fieldErrors?.isActive}</FieldError>
      </label>
      {options.length === 0 && (
        <p className="product-form__notice" role="alert">
          Primero necesitás crear una categoría. <Link href="/admin/categorias">Administrar categorías</Link>
        </p>
      )}
      {state.message && (
        <p className={`product-message product-message--${state.status}`} role={state.status === "error" ? "alert" : "status"}>
          {state.message}
        </p>
      )}
      <div className="product-form__actions">
        <button className="catalog-button" type="submit" disabled={pending || options.length === 0}>
          {pending ? "Guardando..." : product ? "Guardar cambios" : "Crear producto"}
        </button>
        <Link className="category-secondary-button" href="/admin/productos">Cancelar</Link>
      </div>
    </form>
  );
}
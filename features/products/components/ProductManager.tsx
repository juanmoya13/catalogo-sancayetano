"use client";

import Link from "next/link";
import { useActionState } from "react";
import { deleteProductAction, toggleProductStatusAction } from "@/features/products/actions";
import type { AdminProduct } from "@/features/products/admin-types";
import type { ProductActionState } from "@/features/products/types";

const emptyState: ProductActionState = { status: "idle", message: "" };
const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

function ActionMessage({ state }: { state: ProductActionState }) {
  if (!state.message) return null;
  return (
    <p className={`product-message product-message--${state.status}`} role={state.status === "error" ? "alert" : "status"}>
      {state.message}
    </p>
  );
}

function ProductRow({ product }: { product: AdminProduct }) {
  const [toggleState, toggleAction, toggling] = useActionState(toggleProductStatusAction, emptyState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteProductAction, emptyState);
  const nextStatus = !product.is_active;

  return (
    <article className="product-admin-row">
      <div className="product-admin-row__details">
        <div>
          <Link className="product-admin-row__name" href={`/admin/productos/${product.id}`}>
            {product.name}
          </Link>
          <p>{product.category_name}</p>
        </div>
        <strong>{currency.format(Number(product.price))}</strong>
        <span>{product.sale_unit === "kg" ? "Por kilogramo" : "Por unidad"}</span>
        <span className={`product-status${product.is_active ? " product-status--active" : " product-status--inactive"}`}>
          {product.is_active ? "Activo" : "Inactivo"}
        </span>
      </div>
      <div className="product-admin-row__actions">
        <Link className="category-secondary-button" href={`/admin/productos/${product.id}`}>
          Editar
        </Link>
        <form action={toggleAction}>
          <input type="hidden" name="id" value={product.id} />
          <input type="hidden" name="isActive" value={String(nextStatus)} />
          <button className="category-secondary-button" type="submit" disabled={toggling}>
            {toggling ? "Guardando..." : nextStatus ? "Activar" : "Desactivar"}
          </button>
        </form>
        <form
          action={deleteAction}
          onSubmit={(event) => {
            if (!window.confirm(`¿Eliminar definitivamente el producto "${product.name}"?`)) event.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={product.id} />
          <button className="category-delete-button" type="submit" disabled={deleting}>
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>
        </form>
      </div>
      <ActionMessage state={toggleState} />
      <ActionMessage state={deleteState} />
    </article>
  );
}

export default function ProductManager({ products }: { products: AdminProduct[] }) {
  const activeCount = products.filter((product) => product.is_active).length;

  return (
    <div className="product-manager">
      <section className="category-section" aria-labelledby="product-list-title">
        <div className="category-section__heading">
          <div>
            <p className="catalog-header__eyebrow">Catálogo completo</p>
            <h2 id="product-list-title">Productos</h2>
          </div>
          <span className="category-count">
            {activeCount} activos · {products.length} en total
          </span>
        </div>
        {products.length === 0 ? (
          <div className="category-empty">
            <h3>Todavía no hay productos</h3>
            <p>Creá el primer producto para comenzar a completar el catálogo.</p>
          </div>
        ) : (
          <div className="product-admin-list">
            {products.map((product) => <ProductRow key={product.id} product={product} />)}
          </div>
        )}
      </section>
    </div>
  );
}
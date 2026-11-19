"use client";

import { useActionState } from "react";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/features/categories/actions";
import type { AdminCategory, CategoryActionState } from "@/features/categories/types";

const emptyState: CategoryActionState = { status: "idle", message: "" };

function ActionMessage({ state }: { state: CategoryActionState }) {
  if (!state.message) return null;
  return (
    <p className={`category-message category-message--${state.status}`} role={state.status === "error" ? "alert" : "status"}>
      {state.message}
    </p>
  );
}

function FieldError({ children }: { children?: string }) {
  return children ? <span className="category-field-error">{children}</span> : null;
}

function CreateCategoryForm({ parents }: { parents: AdminCategory[] }) {
  const [state, formAction, pending] = useActionState(createCategoryAction, emptyState);

  return (
    <form className="category-create-form" action={formAction}>
      <label>
        Nombre
        <input name="name" maxLength={100} required />
        <FieldError>{state.fieldErrors?.name}</FieldError>
      </label>
      <label>
        Tipo
        <select name="parentId" defaultValue="">
          <option value="">Categoría principal</option>
          {parents.map((parent) => (
            <option key={parent.id} value={parent.id}>Subcategoría de {parent.name}</option>
          ))}
        </select>
        <FieldError>{state.fieldErrors?.parentId}</FieldError>
      </label>
      <label>
        Orden
        <input name="sortOrder" type="number" step="1" defaultValue="0" required />
        <FieldError>{state.fieldErrors?.sortOrder}</FieldError>
      </label>
      <button className="catalog-button" type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Crear categoría"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

function CategoryRow({ category, parents, depth = 0 }: {
  category: AdminCategory;
  parents: AdminCategory[];
  depth?: number;
}) {
  const [updateState, updateAction, updating] = useActionState(updateCategoryAction, emptyState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteCategoryAction, emptyState);
  const hasDependencies = category.productsCount > 0 || category.children.length > 0;

  return (
    <li className="category-tree__item">
      <div className={`category-row${depth ? " category-row--child" : ""}`}>
        <div className="category-row__heading">
          <div>
            <span className="category-row__kind">{depth ? "Subcategoría" : "Categoría principal"}</span>
            <h3>{category.name}</h3>
          </div>
          <span className="category-row__order">Orden {category.sort_order}</span>
        </div>
        <form className="category-edit-form" action={updateAction}>
          <input type="hidden" name="id" value={category.id} />
          <label>
            Nombre
            <input name="name" defaultValue={category.name} maxLength={100} required />
            <FieldError>{updateState.fieldErrors?.name}</FieldError>
          </label>
          <label>
            Categoría principal
            <select name="parentId" defaultValue={category.parent_id ?? ""}>
              <option value="">Ninguna (principal)</option>
              {parents.filter((parent) => parent.id !== category.id).map((parent) => (
                <option key={parent.id} value={parent.id}>{parent.name}</option>
              ))}
            </select>
            <FieldError>{updateState.fieldErrors?.parentId}</FieldError>
          </label>
          <label className="category-edit-form__order">
            Orden
            <input name="sortOrder" type="number" step="1" defaultValue={category.sort_order} required />
            <FieldError>{updateState.fieldErrors?.sortOrder}</FieldError>
          </label>
          <button className="category-secondary-button" type="submit" disabled={updating}>
            {updating ? "Guardando..." : "Guardar"}
          </button>
        </form>
        <div className="category-row__footer">
          <span>
            {category.productsCount} producto{category.productsCount === 1 ? "" : "s"}
            {category.children.length > 0 && ` · ${category.children.length} subcategoría${category.children.length === 1 ? "" : "s"}`}
          </span>
          <form
            action={deleteAction}
            onSubmit={(event) => {
              if (!window.confirm(`¿Eliminar la categoría "${category.name}"?`)) event.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={category.id} />
            <button className="category-delete-button" type="submit" disabled={hasDependencies || deleting}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </form>
        </div>
        {hasDependencies && (
          <p className="category-dependency-note">
            Para eliminarla, reasigná sus productos y resolvé sus subcategorías.
          </p>
        )}
        <ActionMessage state={updateState} />
        <ActionMessage state={deleteState} />
      </div>
      {category.children.length > 0 && (
        <ul className="category-tree category-tree--nested">
          {category.children.map((child) => (
            <CategoryRow key={child.id} category={child} parents={parents} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CategoryManager({ categories }: { categories: AdminCategory[] }) {
  return (
    <div className="category-manager">
      <section className="category-section" aria-labelledby="category-create-title">
        <div className="category-section__heading">
          <div>
            <p className="catalog-header__eyebrow">Nueva entrada</p>
            <h2 id="category-create-title">Agregar categoría</h2>
          </div>
        </div>
        <CreateCategoryForm parents={categories} />
      </section>

      <section className="category-section" aria-labelledby="category-list-title">
        <div className="category-section__heading">
          <div>
            <p className="catalog-header__eyebrow">Estructura actual</p>
            <h2 id="category-list-title">Categorías y subcategorías</h2>
          </div>
          <span className="category-count">{categories.length} principales</span>
        </div>
        {categories.length === 0 ? (
          <div className="category-empty">
            <h3>Todavía no hay categorías</h3>
            <p>Creá una categoría principal para empezar a organizar el catálogo.</p>
          </div>
        ) : (
          <ul className="category-tree">
            {categories.map((category) => (
              <CategoryRow key={category.id} category={category} parents={categories} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
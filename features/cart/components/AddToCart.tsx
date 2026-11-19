"use client";

import { useState } from "react";
import { isQuantityValid } from "../domain";
import { useCart } from "../context";
import type { SaleUnit } from "../types";

export function AddToCart({
  productId,
  saleUnit,
}: {
  productId: string;
  saleUnit: SaleUnit;
}) {
  const { addItem, isHydrated } = useCart();
  const [quantity, setQuantity] = useState(saleUnit === "kg" ? "1000" : "1");
  const [message, setMessage] = useState("");

  function submit() {
    const parsed = Number(quantity);
    if (!isQuantityValid(parsed, saleUnit)) {
      setMessage(saleUnit === "unit"
        ? "Ingresá una cantidad entera entre 1 y 999."
        : "Ingresá gramos enteros entre 1 y 100.000.");
      return;
    }

    if (addItem(productId, parsed, saleUnit)) {
      setMessage("Agregado al carrito.");
    }
  }

  return (
    <div className="add-to-cart">
      <label>
        <span>{saleUnit === "kg" ? "Gramos" : "Cantidad"}</span>
        <input
          disabled={!isHydrated}
          inputMode="numeric"
          min="1"
          max={saleUnit === "unit" ? 999 : 100000}
          onChange={(event) => {
            setQuantity(event.currentTarget.value);
            setMessage("");
          }}
          step="1"
          type="number"
          value={quantity}
        />
      </label>
      <button
        className="catalog-button"
        disabled={!isHydrated}
        onClick={submit}
        type="button"
      >
        Agregar
      </button>
      {message ? <p className="add-to-cart__message" aria-live="polite">{message}</p> : null}
    </div>
  );
}

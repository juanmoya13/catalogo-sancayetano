"use client";

import Link from "next/link";
import { useCart } from "../context";

export function CartIndicator() {
  const { lineCount, isHydrated } = useCart();

  return (
    <Link className="cart-indicator" href="/carrito">
      Carrito
      {isHydrated ? <span aria-label={`${lineCount} unidades o gramos en el carrito`}>{lineCount}</span> : null}
    </Link>
  );
}

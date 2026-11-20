"use client";

import Link from "next/link";
import { useCart } from "../context";

export function CartIndicator() {
  const { lineCount, isHydrated } = useCart();

  return (
    <Link className="cart-indicator" href="/carrito">
      Carrito
      {isHydrated ? <span aria-label={`${lineCount} artículos en el carrito`}>{lineCount}</span> : null}
    </Link>
  );
}

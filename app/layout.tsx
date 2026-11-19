import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { CartProvider } from "@/features/cart/context";
import { CartIndicator } from "@/features/cart/components/CartIndicator";
import "./globals.css";

export const metadata: Metadata = {
  title: "Autoservicio San Cayetano",
  description: "Catálogo online de Autoservicio San Cayetano.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <CartProvider>
          <div className="site-topbar">
            <Link className="site-topbar__brand" href="/">San Cayetano</Link>
            <CartIndicator />
          </div>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}

import { CartPage } from "@/features/cart/components/CartPage";

export default function CartRoute() {
  return (
    <main className="catalog-shell">
      <header className="catalog-header">
        <p className="catalog-header__eyebrow">Autoservicio San Cayetano</p>
        <h1>Carrito</h1>
      </header>
      <CartPage />
    </main>
  );
}

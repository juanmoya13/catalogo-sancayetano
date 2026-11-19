export type SaleUnit = "unit" | "kg";

export type CartItem = {
  productId: string;
  quantity: number;
};

export type Cart = {
  version: 1;
  items: CartItem[];
};

export type AvailableCartProduct = {
  id: string;
  availability: "available";
  name: string;
  price: number | string;
  sale_unit: SaleUnit;
};

export type CartProduct = AvailableCartProduct | {
  id: string;
  availability: "unavailable";
};

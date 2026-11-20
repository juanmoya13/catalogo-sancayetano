export type SaleUnit = "unit" | "kg";

export type CartItem = {
  productId: string;
  quantity: number;
  saleUnit?: SaleUnit;
};

export type Cart = {
  version: 2;
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

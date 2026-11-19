import type { ProductActionState } from "./types";

export type AdminProduct = {
  id: string;
  category_id: string;
  category_name: string;
  name: string;
  price: number | string;
  sale_unit: "unit" | "kg";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductFormProduct = Omit<AdminProduct, "category_name">;

export type { ProductActionState };
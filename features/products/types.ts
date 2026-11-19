export type PublicProduct = {
  id: string;
  name: string;
  price: number | string;
  sale_unit: "unit" | "kg";
};

export type PublicProductPage = {
  products: PublicProduct[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PublicProductBatch = {
  products: PublicProduct[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type ProductActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<"name" | "categoryId" | "price" | "saleUnit" | "isActive", string>>;
};

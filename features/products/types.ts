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

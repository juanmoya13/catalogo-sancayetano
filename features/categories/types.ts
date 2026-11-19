export type Category = {
  id: string;
  parent_id: string | null;
  name: string;
  sort_order: number;
};

export type AdminCategory = Category & {
  productsCount: number;
  children: AdminCategory[];
};

export type PublicCategory = Category & {
  children: PublicCategory[];
};

export type CategoryActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<"name" | "parentId" | "sortOrder", string>>;
};
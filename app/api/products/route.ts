import { NextRequest, NextResponse } from "next/server";
import {
  getPublicProductPage,
  isPublicCategoryId,
  PUBLIC_PRODUCT_PAGE_SIZE,
} from "@/features/products/queries";
import { MAX_PUBLIC_SEARCH_LENGTH } from "@/features/products/constants";

export async function GET(request: NextRequest) {
  const rawPage = request.nextUrl.searchParams.get("page") ?? "1";
  const parsedPage = Number(rawPage);
  const search = request.nextUrl.searchParams.get("q") ?? "";
  const rawCategoryId = request.nextUrl.searchParams.get("category") ?? "";

  if (
    !/^\d+$/.test(rawPage) ||
    !Number.isSafeInteger(parsedPage) ||
    parsedPage < 1 ||
    search.length > MAX_PUBLIC_SEARCH_LENGTH ||
    (rawCategoryId && !isPublicCategoryId(rawCategoryId))
  ) {
    return NextResponse.json(
      { error: "Los filtros o la página indicados no son válidos." },
      { status: 400 },
    );
  }

  try {
    const catalog = await getPublicProductPage(parsedPage, PUBLIC_PRODUCT_PAGE_SIZE, {
      search,
      categoryId: rawCategoryId || undefined,
    });

    return NextResponse.json(
      catalog,
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudo cargar el catálogo." },
      { status: 503 },
    );
  }
}

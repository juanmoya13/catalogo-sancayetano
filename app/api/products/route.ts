import { NextRequest, NextResponse } from "next/server";
import {
  getPublicProductPage,
  PUBLIC_PRODUCT_PAGE_SIZE,
} from "@/features/products/queries";

export async function GET(request: NextRequest) {
  const rawPage = request.nextUrl.searchParams.get("page") ?? "1";
  const parsedPage = Number(rawPage);

  if (!/^\d+$/.test(rawPage) || parsedPage < 1) {
    return NextResponse.json(
      { error: "La página indicada no es válida." },
      { status: 400 },
    );
  }

  try {
    const catalog = await getPublicProductPage(parsedPage);

    return NextResponse.json(
      {
        products: catalog.products,
        page: catalog.page,
        pageSize: PUBLIC_PRODUCT_PAGE_SIZE,
        total: catalog.total,
        hasMore: catalog.page < catalog.totalPages,
      },
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

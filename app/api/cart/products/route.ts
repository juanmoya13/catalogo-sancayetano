import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCartProducts } from "@/features/cart/queries";

const schema = z.object({
  productIds: z.array(z.string().uuid()).max(200),
});

export async function POST(request: NextRequest) {
  let productIds: string[];

  try {
    const body = schema.parse(await request.json());
    productIds = body.productIds;
  } catch {
    return NextResponse.json(
      { error: "No se pudo consultar el carrito." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const products = await getCartProducts(productIds);

    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudo consultar el carrito." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

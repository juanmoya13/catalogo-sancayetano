import { NextResponse } from "next/server";
import { z } from "zod";
import { buildOrderMessage, buildWhatsAppUrl, calculatePreparedOrder } from "@/features/cart/checkout";
import { MAX_CART_LINES } from "@/features/cart/constants";
import { isQuantityValid } from "@/features/cart/domain";
import { getCartProducts } from "@/features/cart/queries";
import type { AvailableCartProduct } from "@/features/cart/types";

const schema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive().refine(Number.isSafeInteger),
  }).strict()).min(1).max(MAX_CART_LINES),
}).strict();

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  let items: z.infer<typeof schema>["items"];

  try {
    const parsed = schema.parse(await request.json());
    const productIds = parsed.items.map((item) => item.productId.toLowerCase());
    if (new Set(productIds).size !== productIds.length) {
      return NextResponse.json(
        { error: "El carrito contiene productos repetidos. Actualizalo e intentá nuevamente." },
        { status: 400, headers: noStore },
      );
    }
    items = parsed.items.map((item) => ({
      ...item,
      productId: item.productId.toLowerCase(),
    }));
  } catch {
    return NextResponse.json(
      { error: "El carrito no tiene un formato válido o está vacío." },
      { status: 400, headers: noStore },
    );
  }

  const phoneNumber = process.env.WHATSAPP_PHONE_NUMBER;
  if (!phoneNumber || !/^[1-9]\d{7,14}$/.test(phoneNumber)) {
    return NextResponse.json(
      { error: "El envío por WhatsApp no está configurado correctamente." },
      { status: 503, headers: noStore },
    );
  }

  try {
    const products = await getCartProducts(items.map((item) => item.productId));
    const unavailableProductIds = products
      .filter((product) => product.availability === "unavailable")
      .map((product) => product.id);

    if (unavailableProductIds.length > 0) {
      return NextResponse.json(
        {
          error: "Hay productos que ya no están disponibles. Quitalos del carrito para continuar.",
          unavailableProductIds,
        },
        { status: 409, headers: noStore },
      );
    }

    const availableProducts = products as AvailableCartProduct[];
    const productsById = new Map(availableProducts.map((product) => [product.id, product]));
    const invalidQuantityProductIds = items
      .filter((item) => {
        const product = productsById.get(item.productId);
        return !product || !isQuantityValid(item.quantity, product.sale_unit);
      })
      .map((item) => item.productId);

    if (invalidQuantityProductIds.length > 0) {
      return NextResponse.json(
        {
          error: "Cambió la modalidad de venta o la cantidad supera el límite permitido. Revisá las cantidades actualizadas.",
          invalidQuantityProductIds,
          products: availableProducts,
        },
        { status: 422, headers: noStore },
      );
    }

    const preparedOrder = calculatePreparedOrder(items, availableProducts);
    const message = buildOrderMessage(preparedOrder.lines, preparedOrder.total);

    return NextResponse.json(
      {
        ...preparedOrder,
        message,
        whatsappUrl: buildWhatsAppUrl(phoneNumber, message),
      },
      { headers: noStore },
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudo verificar el pedido. Revisá tu conexión e intentá nuevamente." },
      { status: 500, headers: noStore },
    );
  }
}
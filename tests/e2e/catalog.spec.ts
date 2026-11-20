import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

test("searches, filters, paginates, and keeps unit and weight items in the cart", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  await expect(page.getByRole("heading", { name: "Catálogo" })).toBeVisible();

  const search = page.getByRole("searchbox", { name: "Buscar por nombre" });
  const category = page.getByLabel("Categoría");
  await search.fill("fideos");
  await category.selectOption({ label: "Almacén (incluye subcategorías)" });
  await expect(page.getByRole("heading", { name: "Fideos tirabuzón 500 g" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coca-Cola 1,5 l" })).toHaveCount(0);

  await search.fill("");
  await category.selectOption("");
  await expect(page.locator(".catalog-summary")).toHaveText("29 productos encontrados");
  await expect(page.getByRole("button", { name: "Página siguiente" })).toBeEnabled();
  await page.getByRole("button", { name: "Página siguiente" }).click();
  await expect(page.getByText("Página 2 de", { exact: false })).toBeVisible();

  await page.goto("/");
  const unitCard = page.locator("article.product-card").filter({ has: page.getByRole("heading", { name: "Fideos tirabuzón 500 g" }) });
  await unitCard.getByLabel("Cantidad").fill("2");
  await unitCard.getByRole("button", { name: "Agregar" }).click();
  await expect(unitCard.getByText("Agregado al carrito.")).toBeVisible();

  const weightCard = page.locator("article.product-card").filter({ has: page.getByRole("heading", { name: "Banana" }) });
  await weightCard.getByLabel("Gramos").fill("450");
  await weightCard.getByRole("button", { name: "Agregar" }).click();
  await page.getByRole("link", { name: /Carrito/ }).click();
  await expect(page.getByRole("heading", { name: "Fideos tirabuzón 500 g" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Banana" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Fideos tirabuzón 500 g" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Banana" })).toBeVisible();
  await expect(page.getByText("Total estimativo", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Actualizar precios y disponibilidad" })).toHaveCount(0);
  const firstPopupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  const firstPopup = await firstPopupPromise;
  await expect.poll(() => firstPopup.url()).toContain("wa.me");
  const firstMessage = new URL(firstPopup.url()).searchParams.get("text") ?? "";
  expect(firstMessage).toContain("Fideos tirabuzón 500 g");
  expect(firstMessage).toContain("Total estimado");

  await page.goto("/");
  await page.getByRole("searchbox", { name: "Buscar por nombre" }).fill("Aceite de oliva");
  const extraCard = page.locator("article.product-card").filter({
    has: page.getByRole("heading", { name: "Aceite de oliva 500 ml" }),
  });
  await expect(extraCard).toBeVisible();
  await extraCard.getByRole("button", { name: "Agregar" }).click();

  await page.goto("/carrito");
  await expect(page.getByRole("heading", { name: "Aceite de oliva 500 ml" })).toBeVisible();
  const secondPopupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Enviar pedido" }).click();
  const secondPopup = await secondPopupPromise;
  await expect.poll(() => secondPopup.url()).toContain("wa.me");
  const secondMessage = new URL(secondPopup.url()).searchParams.get("text") ?? "";
  expect(secondMessage).toContain("Aceite de oliva 500 ml");
  expect(secondMessage).toContain("Banana");
  expect(secondMessage).toContain("Fideos tirabuzón 500 g");

  const viewport = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    contentWidth: document.documentElement.scrollWidth,
  }));
  expect(viewport.contentWidth).toBeLessThanOrEqual(viewport.width);
});

test("redirects anonymous visitors away from protected administration", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
});

test("admin price changes and deactivation update an existing cart", async ({ page }) => {
  const adminEmail = process.env.SUPABASE_TEST_ADMIN_EMAIL!;
  const adminPassword = process.env.SUPABASE_TEST_ADMIN_PASSWORD!;
  const productName = `E2E producto ${crypto.randomUUID()}`;

  await page.goto("/admin/login");
  await page.getByLabel("Correo electrónico").fill(adminEmail);
  await page.getByLabel("Contraseña").fill(adminPassword);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  try {
    await page.goto("/admin/productos/nuevo");
    await page.getByLabel("Nombre del producto").fill(productName);
    await page.getByLabel("Categoría").selectOption({ label: "Almacén" });
    await page.getByLabel("Precio").fill("123.00");
    await page.getByRole("button", { name: "Crear producto" }).click();
    await expect(page.getByRole("status")).toHaveText("Producto creado correctamente.");

    await page.goto("/");
    await page.getByRole("searchbox", { name: "Buscar por nombre" }).fill(productName);
    const productCard = page.locator("article.product-card").filter({ has: page.getByRole("heading", { name: productName }) });
    await expect(productCard).toBeVisible();
    await productCard.getByRole("button", { name: "Agregar" }).click();

    await page.goto("/admin/productos");
    await page.getByRole("link", { name: productName }).click();
    await page.getByLabel("Precio").fill("456.50");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByRole("status")).toHaveText("Cambios guardados correctamente.");

    await page.goto("/carrito");
    const cartLine = page.locator("article.cart-line").filter({ hasText: productName });
    await expect(cartLine.getByText(/456,50/)).toBeVisible();

    await page.goto("/admin/productos");
    const productRow = page.locator("article.product-admin-row").filter({ hasText: productName });
    await productRow.getByRole("button", { name: "Desactivar" }).click();
    await expect(productRow.getByRole("status")).toHaveText("Producto desactivado.");

    await page.goto("/carrito");
    await expect(page.getByText("Producto no disponible", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Enviar pedido" })).toBeDisabled();
  } finally {
    const cleanupClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );
    const { error: signInError } = await cleanupClient.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    if (signInError) throw signInError;
    const { error: cleanupError } = await cleanupClient
      .from("products")
      .delete()
      .eq("name", productName);
    await cleanupClient.auth.signOut();
    if (cleanupError) throw cleanupError;
  }
});

test("authenticated non-admin cannot open the administration area", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Correo electrónico").fill(process.env.SUPABASE_TEST_MEMBER_EMAIL!);
  await page.getByLabel("Contraseña").fill(process.env.SUPABASE_TEST_MEMBER_PASSWORD!);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin\/access-denied$/);
});
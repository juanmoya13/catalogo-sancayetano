import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const adminEmail = process.env.SUPABASE_TEST_ADMIN_EMAIL!;
const adminPassword = process.env.SUPABASE_TEST_ADMIN_PASSWORD!;
const memberEmail = process.env.SUPABASE_TEST_MEMBER_EMAIL!;
const memberPassword = process.env.SUPABASE_TEST_MEMBER_PASSWORD!;
const seededActiveProductId = "20000000-0000-4000-8000-000000000001";
const seededInactiveProductId = "20000000-0000-4000-8000-000000000099";

let anonymousClient: SupabaseClient;
let adminClient: SupabaseClient;
let memberClient: SupabaseClient;

beforeAll(async () => {
  if ([anonKey, adminEmail, adminPassword, memberEmail, memberPassword].some((value) => !value)) {
    throw new Error("Configure the public key and dedicated development admin/member credentials.");
  }

  anonymousClient = createClient(url, anonKey, { auth: { persistSession: false } });
  adminClient = createClient(url, anonKey, { auth: { persistSession: false } });
  memberClient = createClient(url, anonKey, { auth: { persistSession: false } });

  const [adminSignIn, memberSignIn] = await Promise.all([
    adminClient.auth.signInWithPassword({ email: adminEmail, password: adminPassword }),
    memberClient.auth.signInWithPassword({ email: memberEmail, password: memberPassword }),
  ]);

  if (adminSignIn.error || memberSignIn.error) {
    throw new Error("Development test users could not authenticate.");
  }
}, 30_000);

afterAll(async () => {
  await Promise.all([
    adminClient?.auth.signOut(),
    memberClient?.auth.signOut(),
  ]);
});

describe("Supabase public and administrator policies", () => {
  it("exposes active rows only and denies public writes and admin table reads", async () => {
    const [{ data: active, error: activeError }, { data: inactive, error: inactiveError }] = await Promise.all([
      anonymousClient.from("products").select("id").eq("id", seededActiveProductId).maybeSingle(),
      anonymousClient.from("products").select("id").eq("id", seededInactiveProductId).maybeSingle(),
    ]);
    const [{ error: categoryWriteError }, { error: productWriteError }, { error: adminReadError }] = await Promise.all([
      anonymousClient.from("categories").insert({ name: "RLS test", sort_order: 0 }),
      anonymousClient.from("products").insert({
        category_id: "10000000-0000-4000-8000-000000000001",
        name: "RLS test product",
        price: 1,
        sale_unit: "unit",
      }),
      anonymousClient.from("admin_users").select("user_id"),
    ]);

    expect(activeError).toBeNull();
    expect(active?.id).toBe(seededActiveProductId);
    expect(inactiveError).toBeNull();
    expect(inactive).toBeNull();
    expect(categoryWriteError).not.toBeNull();
    expect(productWriteError).not.toBeNull();
    expect(adminReadError).not.toBeNull();
  });

  it("denies an authenticated non-admin and permits admin CRUD within category rules", async () => {
    const [{ data: hiddenProduct }, { error: categoryWriteError }, { error: adminTableError }] = await Promise.all([
      memberClient.from("products").select("id").eq("id", seededInactiveProductId).maybeSingle(),
      memberClient.from("categories").insert({ name: "Unauthorized test", sort_order: 0 }),
      memberClient.from("admin_users").select("user_id"),
    ]);

    expect(hiddenProduct).toBeNull();
    expect(categoryWriteError).not.toBeNull();
    expect(adminTableError).not.toBeNull();

    const suffix = crypto.randomUUID();
    let rootId: string | undefined;
    let childId: string | undefined;
    let productId: string | undefined;

    try {
      const { data: root, error: rootError } = await adminClient
        .from("categories")
        .insert({ name: `Integration root ${suffix}`, sort_order: 0 })
        .select("id")
        .single();
      expect(rootError).toBeNull();
      rootId = root!.id;

      const { data: child, error: childError } = await adminClient
        .from("categories")
        .insert({ name: `Integration child ${suffix}`, parent_id: rootId, sort_order: 0 })
        .select("id")
        .single();
      expect(childError).toBeNull();
      childId = child!.id;

      const { data: updatedChild, error: categoryUpdateError } = await adminClient
        .from("categories")
        .update({ name: `Integration child updated ${suffix}` })
        .eq("id", childId)
        .select("name")
        .single();
      expect(categoryUpdateError).toBeNull();
      expect(updatedChild?.name).toBe(`Integration child updated ${suffix}`);

      const { error: depthError } = await adminClient
        .from("categories")
        .insert({ name: `Integration depth ${suffix}`, parent_id: childId, sort_order: 0 });
      expect(depthError).not.toBeNull();

      const { data: product, error: productError } = await adminClient
        .from("products")
        .insert({
          category_id: childId,
          name: `Integration product ${suffix}`,
          price: 12.5,
          sale_unit: "unit",
          is_active: true,
        })
        .select("id")
        .single();
      expect(productError).toBeNull();
      productId = product!.id;

      const [{ error: priceConstraintError }, { error: saleUnitConstraintError }, { error: categoryForeignKeyError }] = await Promise.all([
        adminClient.from("products").insert({
          category_id: childId,
          name: `Integration invalid price ${suffix}`,
          price: 0,
          sale_unit: "unit",
          is_active: true,
        }),
        adminClient.from("products").insert({
          category_id: childId,
          name: `Integration invalid unit ${suffix}`,
          price: 1,
          sale_unit: "box",
          is_active: true,
        }),
        adminClient.from("products").insert({
          category_id: "30000000-0000-4000-8000-000000000001",
          name: `Integration invalid category ${suffix}`,
          price: 1,
          sale_unit: "unit",
          is_active: true,
        }),
      ]);
      expect(priceConstraintError).not.toBeNull();
      expect(saleUnitConstraintError).not.toBeNull();
      expect(categoryForeignKeyError).not.toBeNull();

      const { error: restrictedDeleteError } = await adminClient
        .from("categories")
        .delete()
        .eq("id", childId);
      expect(restrictedDeleteError).not.toBeNull();

      const { error: updateError } = await adminClient
        .from("products")
        .update({ price: 15.25 })
        .eq("id", productId);
      expect(updateError).toBeNull();
    } finally {
      if (productId) await adminClient.from("products").delete().eq("id", productId);
      if (childId) await adminClient.from("categories").delete().eq("id", childId);
      if (rootId) await adminClient.from("categories").delete().eq("id", rootId);
    }
  });
});
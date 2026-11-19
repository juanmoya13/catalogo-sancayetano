import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  const { data: isAdmin, error: permissionError } = await supabase.rpc("is_admin");

  if (permissionError) {
    throw new Error("No se pudieron verificar los permisos administrativos.");
  }

  if (!isAdmin) {
    redirect("/admin/access-denied");
  }

  return user;
}
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export type LoginActionState = {
  error: string | null;
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Ingresá un correo y una contraseña válidos." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);

  if (signInError) {
    return { error: "No se pudo iniciar sesión. Revisá tus datos e intentá nuevamente." };
  }

  const { data: isAdmin, error: permissionError } = await supabase.rpc("is_admin");

  if (permissionError || !isAdmin) {
    await supabase.auth.signOut();
    return {
      error: permissionError
        ? "No se pudo verificar el acceso administrativo. Intentá nuevamente."
        : "Esta cuenta no tiene permisos de administración.",
    };
  }

  redirect("/admin");
}
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("categories").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        { status: "error", message: "No se pudo verificar la conexión con Supabase." },
        { status: 503 },
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json(
      { status: "error", message: "No se pudo verificar la conexión con Supabase." },
      { status: 503 },
    );
  }
}
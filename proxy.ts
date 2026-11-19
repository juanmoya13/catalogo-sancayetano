import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { response, supabase, user, authError } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  if (pathname === "/admin/login" || pathname === "/admin/access-denied") {
    return response;
  }

  const redirectWithCookies = (destination: string) => {
    const url = request.nextUrl.clone();
    url.pathname = destination;
    url.search = "";
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  };

  if (authError || !user) {
    return redirectWithCookies("/admin/login");
  }

  const { data: isAdmin, error: permissionError } = await supabase.rpc("is_admin");

  if (permissionError) {
    const errorResponse = NextResponse.json(
      { error: "No se pudo verificar el acceso administrativo." },
      { status: 503 },
    );
    response.cookies.getAll().forEach((cookie) => {
      errorResponse.cookies.set(cookie);
    });
    return errorResponse;
  }

  if (!isAdmin) {
    return redirectWithCookies("/admin/access-denied");
  }

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
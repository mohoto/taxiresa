import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Pages accessibles par rôle (préfixes de routes)
const ROLE_ALLOWED_PATHS: Record<string, string[]> = {
  ADMIN: ["/"], // tout
  OPERATOR: ["/reservations"],
  COURIER: ["/commissions/a-recuperer"],
};

// Page de redirection par défaut après login selon le rôle
const ROLE_DEFAULT_PATH: Record<string, string> = {
  ADMIN: "/dashboard",
  OPERATOR: "/reservations",
  COURIER: "/commissions/a-recuperer",
};

function isAllowed(role: string, pathname: string): boolean {
  if (role === "ADMIN") return true;
  const allowed = ROLE_ALLOWED_PATHS[role] ?? [];
  return allowed.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "?"));
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Rafraîchit la session si expirée — IMPORTANT : ne pas supprimer cet appel
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicRoute = pathname.startsWith("/login") || pathname.startsWith("/api/") || pathname.startsWith("/reserver");

  // Non connecté → login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const role = (user.user_metadata?.role as string) ?? "OPERATOR";
    const defaultPath = ROLE_DEFAULT_PATH[role] ?? "/reservations";

    // Connecté sur /login → rediriger vers la page par défaut du rôle
    if (pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = defaultPath;
      return NextResponse.redirect(url);
    }

    // Route protégée : vérifier les droits
    if (!isPublicRoute && !isAllowed(role, pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = defaultPath;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

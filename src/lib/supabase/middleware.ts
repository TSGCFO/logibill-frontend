import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require admin role
const adminOnlyRoutes = [
  "/admin/users",
  "/admin/settings",
  "/admin/onboarding-tokens",
];

// Routes that require at least accountant role (admin or accountant)
const accountantRoutes = [
  "/admin/sync-status",
  "/admin/periods",
  "/admin/accrual",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - redirect to login if not authenticated
  const protectedPaths = [
    "/",
    "/customers",
    "/orders",
    "/invoices",
    "/billing",
    "/reports",
    "/admin",
    "/products",
    "/services",
    "/inventory",
    "/files",
    "/unauthorized",
  ];

  const isProtectedPath = protectedPaths.some(
    (path) =>
      request.nextUrl.pathname === path ||
      request.nextUrl.pathname.startsWith(`${path}/`)
  );

  if (
    isProtectedPath &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    // No user, redirect to login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // If user is logged in and trying to access login page, redirect to dashboard
  if (user && request.nextUrl.pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Role-based access control
  // Note: We check user metadata for role since we can't access our API from middleware
  // The actual role is stored in our database and synced to Supabase user metadata
  if (user) {
    const pathname = request.nextUrl.pathname;

    // Get role from user metadata (set during login/signup)
    const userRole = user.user_metadata?.role as string | undefined;

    // Check admin-only routes
    const isAdminRoute = adminOnlyRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isAdminRoute && userRole !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }

    // Check accountant routes (require admin or accountant)
    const isAccountantRoute = accountantRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isAccountantRoute && !["admin", "accountant"].includes(userRole || "")) {
      const url = request.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}

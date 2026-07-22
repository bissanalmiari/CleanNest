import { NextResponse, type NextRequest } from "next/server";

// This middleware only checks whether a session cookie is PRESENT — it does
// NOT verify the JWT or read the user's role. That's intentional:
// verifying a signed JWT needs Node's crypto module, which isn't reliably
// available in the Edge runtime middleware runs in. Treat this as a UX
// convenience (skip the flash of a protected page before redirecting to
// /login) — NOT as the real access-control boundary.
//
// The actual security boundary is requireUser()/requireRole() in
// src/lib/auth.ts, called at the top of every protected Route Handler and
// Server Component. Even if someone bypassed this middleware entirely,
// every API call and data fetch is still checked there.

const AUTH_COOKIE = "cleannest_token";

// Route groups like (customer)/dashboard render at /dashboard — the
// parenthesised segment is stripped from the URL. Admin and cleaner pages
// live under real /admin/* and /cleaner/* prefixes (see the folder-rename
// note in the project README) so their paths don't collide with the
// customer group's unprefixed routes.
const PROTECTED_PATHS = [
  // Customer (route group, no URL prefix)
  "/dashboard",
  "/book",
  "/bookings",
  "/addresses",
  "/payments",
  "/profile",
  "/reviews",
  // Admin
  "/admin",
  // Cleaner
  "/cleaner",
];

// Logged-in users shouldn't see the auth screens again.
const AUTH_ONLY_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isAuthOnlyPath(pathname: string): boolean {
  return AUTH_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

  if (isProtectedPath(pathname) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthOnlyPath(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets and API routes (API routes do
     * their own requireUser/requireRole checks and shouldn't be redirected —
     * they need to return a JSON 401/403, not an HTML redirect).
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
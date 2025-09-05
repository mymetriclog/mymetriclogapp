import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const nonAuthPath = [
  "/login",
  "/signup",
  "/register",
  "/email-verify",
  "/forgot-password",
  "/reset-password",
  "/api/auth/callback",
  "/", // Allow home page access
];

const protectedRoutes = [
  "/dashboard",
  "/reports",
  "/settings",
  "/integrations",
  "/weathers",
  "/profile",
  "/analytics",
  "/queue",
];

export async function middleware(request: NextRequest) {
  // Create a single response object that we'll reuse
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Don't create new response objects, just set cookies on existing response
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Don't create new response objects, just remove cookies on existing response
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && nonAuthPath.some((e) => request.nextUrl.pathname.startsWith(e)))
    return response;

  if (user && nonAuthPath.some((e) => request.nextUrl.pathname.startsWith(e))) {
    // Redirect all authenticated users to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    !user &&
    protectedRoutes.some((e) => request.nextUrl.pathname.startsWith(e))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

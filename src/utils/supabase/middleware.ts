import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const nonAuthPath = [
  "/login",
  "/signup",
  "/register",
  "/email-verify",
  "/forgot-password",
  "/password-reset",
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
  const { pathname } = request.nextUrl;

  // Get the pathname of the request (e.g. /, /protected)
  const isAuthPage = pathname.startsWith('/login') || 
                    pathname.startsWith('/signup') || 
                    pathname.startsWith('/forgot') || 
                    pathname.startsWith('/reset') || 
                    pathname.startsWith('/verify');

  const isProtectedPage = pathname.startsWith('/dashboard') || 
                         pathname.startsWith('/reports') || 
                         pathname.startsWith('/integrations') || 
                         pathname.startsWith('/queue') || 
                         pathname.startsWith('/weathers') || 
                         pathname.startsWith('/settings');

  const isApiRoute = pathname.startsWith('/api/');

  // Create a response object
  let response = NextResponse.next();

  // Get the session from the request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Handle authentication logic
  if (isProtectedPage && !session) {
    // Redirect to login if accessing protected page without session
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isAuthPage && session) {
    // Redirect to dashboard if accessing auth page with session
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // For API routes, let them handle their own authentication
  if (isApiRoute) {
    return response;
  }

  return response;
}

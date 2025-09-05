import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            const cookie = await cookieStore.get(name);
            return cookie?.value;
          },
          async set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          async remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth callback error:", error);
        return NextResponse.redirect(new URL("/login", requestUrl.origin), {
          headers: { "Cache-Control": "no-store" },
        });
      }

      if (!session) {
        console.error("No session after code exchange");
        return NextResponse.redirect(new URL("/login", requestUrl.origin), {
          headers: { "Cache-Control": "no-store" },
        });
      }

      // Refresh the session to ensure we have valid tokens
      const { error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error("Error refreshing session:", refreshError);
        return NextResponse.redirect(new URL("/login", requestUrl.origin), {
          headers: { "Cache-Control": "no-store" },
        });
      }

      // Successfully authenticated, redirect to dashboard
      const response = NextResponse.redirect(
        new URL("/dashboard", requestUrl.origin),
        {
          headers: { "Cache-Control": "no-store" },
        }
      );

      // Set a cookie to indicate successful authentication
      response.cookies.set({
        name: "auth_success",
        value: "true",
        path: "/",
        maxAge: 60, // 1 minute
      });

      return response;
    } catch (error) {
      console.error("Unexpected error during auth callback:", error);
      return NextResponse.redirect(new URL("/login", requestUrl.origin), {
        headers: { "Cache-Control": "no-store" },
      });
    }
  }

  // If no code provided, redirect to login
  return NextResponse.redirect(new URL("/login", requestUrl.origin), {
    headers: { "Cache-Control": "no-store" },
  });
}

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

export async function getServerSupabaseClient() {
  const cookieStore = await cookies();

  // Prefer env vars, but fall back to provided values so the preview works
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://fsrotbnsysjbawubovsp.supabase.co";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // ignore in preview
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // ignore in preview
        }
      },
    },
  });
}

export async function getServerSupabaseClientWithServiceRole() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://fsrotbnsysjbawubovsp.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for service role operations"
    );
  }

  return createServerClient(url, serviceRoleKey, {
    cookies: {
      get() {
        return undefined;
      },
      set() {
        // No-op for service role client
      },
      remove() {
        // No-op for service role client
      },
    },
  });
}

export async function getServerSession() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Return a minimal session-like object to avoid getSession() warning
  const session: { user: User } = { user };
  return session;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

export default function Page() {
  const router = useRouter();
  const supabase = getBrowserSupabaseClient();

  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          // User is authenticated, redirect to dashboard
          router.replace("/dashboard");
        } else {
          // User is not authenticated, redirect to login
          router.replace("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        // On error, redirect to login
        router.replace("/login");
      }
    }

    checkAuth();
  }, [router, supabase.auth]);

  // Return null - no HTML will be shown
  return null;
}

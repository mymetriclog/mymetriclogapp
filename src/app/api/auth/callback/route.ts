import { NextRequest, NextResponse } from "next/server"
import { getServerSupabaseClient } from "@/lib/supabase/server"

// OAuth/email confirmation callback: exchange code and set cookies, then redirect to dashboard
export async function GET(req: NextRequest) {
  const supabase = getServerSupabaseClient()
  const url = new URL(req.url)

  try {
    await supabase.auth.exchangeCodeForSession(url.searchParams)
  } catch (_) {
    // Ignore errors for now; you can log or return an error page if needed.
  }

  // Always redirect to dashboard after successful authentication
  const redirectUrl = new URL("/dashboard", url.origin)
  return NextResponse.redirect(redirectUrl)
}

"use client"

import { useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Singleton browser client
let browserClient: SupabaseClient | null = null

export function getBrowserSupabaseClient() {
  if (browserClient) return browserClient

  // Prefer env vars, but fall back to provided values so the preview works
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://fsrotbnsysjbawubovsp.supabase.co"
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzcm90Ym5zeXNqYmF3dWJvdnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNzA2NzksImV4cCI6MjA2Njg0NjY3OX0.Vynuwx5g597xudaQSkraP8wlysg99PvHynSfg8JkQ88"

  browserClient = createBrowserClient(url, anon)
  return browserClient
}

// Optional React hook
export function useSupabase() {
  return useMemo(() => getBrowserSupabaseClient(), [])
}

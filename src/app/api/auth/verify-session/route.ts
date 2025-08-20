import { NextRequest, NextResponse } from "next/server"
import { getServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const { session } = await req.json()
    
    if (!session) {
      return NextResponse.json({ valid: false, error: "No session provided" }, { status: 400 })
    }

    // Initialize Supabase client
    const supabase = await getServerSupabaseClient()
    
    // Verify the session by making a test request
    const { data: { user }, error } = await supabase.auth.getUser(session.access_token)
    
    if (error || !user) {
      console.log("Session verification failed:", error?.message || "No user found")
      return NextResponse.json({ valid: false, error: error?.message || "Invalid session" }, { status: 401 })
    }

    // Session is valid
    console.log("Session verified for user:", user.email)
    return NextResponse.json({ 
      valid: true, 
      user: { 
        id: user.id, 
        email: user.email,
        metadata: user.user_metadata 
      } 
    })

  } catch (error) {
    console.error("Session verification error:", error)
    return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 })
  }
}

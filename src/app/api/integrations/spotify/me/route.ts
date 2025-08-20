import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/supabase/server"
import { getSpotifyAccessToken } from "@/lib/integrations/spotify"

export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const token = await getSpotifyAccessToken(session.user.id)
  if (!token) return NextResponse.json({ error: "no_token" }, { status: 401 })

  const me = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  if (!me.ok) return NextResponse.json({ error: "spotify_error" }, { status: me.status })

  const data = await me.json()
  return NextResponse.json({
    display_name: data.display_name,
    email: data.email,
    product: data.product,
    id: data.id,
  })
}

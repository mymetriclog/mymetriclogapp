import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/supabase/server"
import { getSpotifyAccessToken } from "@/lib/integrations/spotify"

export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const token = await getSpotifyAccessToken(session.user.id)
  if (!token) return NextResponse.json({ error: "no_token" }, { status: 401 })

  const sp = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=10", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  if (sp.status === 204) return NextResponse.json({ items: [] })
  if (!sp.ok) return NextResponse.json({ error: "spotify_error" }, { status: sp.status })

  const data = await sp.json()
  const items =
    (data.items || []).map((it: any) => ({
      id: it.played_at,
      title: it.track?.name,
      artist: (it.track?.artists || []).map((a: any) => a.name).join(", "),
      playedAt: it.played_at,
      art: it.track?.album?.images?.[0]?.url,
    })) ?? []

  return NextResponse.json({ items })
}

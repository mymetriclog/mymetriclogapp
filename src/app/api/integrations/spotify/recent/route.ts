import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { getSpotifyAccessToken } from "@/lib/integrations/spotify";

export async function GET() {
  console.log("🔍 Spotify /recent API called");

  const session = await getServerSession();
  if (!session) {
    console.log("❌ No session found");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  console.log("👤 User ID:", session.user.id);

  const token = await getSpotifyAccessToken(session.user.id);
  if (!token) {
    console.log("❌ No Spotify token found");
    return NextResponse.json({ error: "no_token" }, { status: 401 });
  }

  console.log("🔑 Token found, calling Spotify API...");

  // Try to get more recent tracks with higher limit
  const sp = await fetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=50",
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  console.log("📡 Spotify API response status:", sp.status);

  if (sp.status === 204) {
    console.log("ℹ️ No recent tracks found (204 status)");
    return NextResponse.json({ items: [] });
  }

  if (!sp.ok) {
    const errorText = await sp.text();
    console.log("❌ Spotify API error:", errorText);
    return NextResponse.json({ error: "spotify_error" }, { status: sp.status });
  }

  const data = await sp.json();
  console.log("✅ Recent tracks data received:", data);

  const items =
    (data.items || []).map((it: any) => ({
      id: it.played_at,
      title: it.track?.name,
      artist: (it.track?.artists || []).map((a: any) => a.name).join(", "),
      playedAt: it.played_at,
      art: it.track?.album?.images?.[0]?.url,
    })) ?? [];

  console.log("🎵 Processed items:", items.length);
  return NextResponse.json({ items });
}

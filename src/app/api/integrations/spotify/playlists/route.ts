import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { getSpotifyAccessToken } from "@/lib/integrations/spotify";

export async function GET() {
  console.log("🔍 Spotify /playlists API called");

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

  const playlists = await fetch(
    "https://api.spotify.com/v1/me/playlists?limit=50",
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  console.log("📡 Playlists API response status:", playlists.status);

  if (!playlists.ok) {
    const errorText = await playlists.text();
    console.log("❌ Playlists API error:", errorText);
    return NextResponse.json(
      { error: "spotify_error" },
      { status: playlists.status }
    );
  }

  const data = await playlists.json();
  console.log(
    "✅ Playlists data received:",
    data.items?.length || 0,
    "playlists"
  );

  const items = (data.items || []).map((playlist: any) => ({
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    images: playlist.images,
    tracks: playlist.tracks?.total || 0,
    owner: playlist.owner?.display_name,
    public: playlist.public,
    collaborative: playlist.collaborative,
  }));

  console.log("🎵 Processed playlists:", items.length);
  return NextResponse.json({ items });
}

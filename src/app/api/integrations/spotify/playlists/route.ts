import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { getSpotifyAccessToken } from "@/lib/integrations/spotify";

export async function GET() {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const token = await getSpotifyAccessToken(session.user.id);
  if (!token) return NextResponse.json({ error: "no_token" }, { status: 401 });

  const playlists = await fetch(
    "https://api.spotify.com/v1/me/playlists?limit=20",
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (!playlists.ok)
    return NextResponse.json(
      { error: "spotify_error" },
      { status: playlists.status }
    );

  const data = await playlists.json();
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

  return NextResponse.json({ items });
}

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { getSpotifyAccessToken } from "@/lib/integrations/spotify";

export async function GET() {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const token = await getSpotifyAccessToken(session.user.id);
  if (!token) return NextResponse.json({ error: "no_token" }, { status: 401 });

  const topTracks = await fetch(
    "https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=short_term",
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (!topTracks.ok)
    return NextResponse.json(
      { error: "spotify_error" },
      { status: topTracks.status }
    );

  const data = await topTracks.json();
  const items = (data.items || []).map((track: any) => ({
    id: track.id,
    name: track.name,
    artist: (track.artists || []).map((a: any) => a.name).join(", "),
    album: track.album?.name,
    duration: track.duration_ms,
    popularity: track.popularity,
    images: track.album?.images,
    uri: track.uri,
  }));

  return NextResponse.json({ items });
}

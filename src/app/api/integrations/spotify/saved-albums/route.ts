import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { getSpotifyAccessToken } from "@/lib/integrations/spotify";

export async function GET() {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const token = await getSpotifyAccessToken(session.user.id);
  if (!token) return NextResponse.json({ error: "no_token" }, { status: 401 });

  const savedAlbums = await fetch(
    "https://api.spotify.com/v1/me/albums?limit=20",
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (!savedAlbums.ok)
    return NextResponse.json(
      { error: "spotify_error" },
      { status: savedAlbums.status }
    );

  const data = await savedAlbums.json();
  const items = (data.items || []).map((item: any) => ({
    id: item.album.id,
    name: item.album.name,
    artist: (item.album.artists || []).map((a: any) => a.name).join(", "),
    images: item.album.images,
    release_date: item.album.release_date,
    total_tracks: item.album.total_tracks,
    album_type: item.album.album_type,
    added_at: item.added_at,
  }));

  return NextResponse.json({ items });
}

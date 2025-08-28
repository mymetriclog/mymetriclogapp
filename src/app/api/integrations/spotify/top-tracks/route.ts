import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { getSpotifyAccessToken } from "@/lib/integrations/spotify";

export async function GET() {
  console.log("🔍 Spotify /top-tracks API called");

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

  // Try multiple time ranges to get more data
  const timeRanges = ["short_term", "medium_term", "long_term"];
  let allItems: any[] = [];

  for (const timeRange of timeRanges) {
    try {
      console.log(`🔍 Fetching top tracks for ${timeRange}...`);

      const topTracks = await fetch(
        `https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=${timeRange}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      console.log(
        `📡 Top tracks API response status for ${timeRange}:`,
        topTracks.status
      );

      if (topTracks.ok) {
        const data = await topTracks.json();
        console.log(
          `✅ Top tracks data received for ${timeRange}:`,
          data.items?.length || 0,
          "tracks"
        );

        const items = (data.items || []).map((track: any) => ({
          id: track.id,
          name: track.name,
          artist: (track.artists || []).map((a: any) => a.name).join(", "),
          album: track.album?.name,
          duration: track.duration_ms,
          popularity: track.popularity,
          images: track.album?.images,
          uri: track.uri,
          timeRange: timeRange,
        }));

        allItems = [...allItems, ...items];
      } else {
        console.log(
          `❌ Top tracks API failed for ${timeRange}:`,
          topTracks.status
        );
      }
    } catch (error) {
      console.log(`❌ Error fetching top tracks for ${timeRange}:`, error);
    }
  }

  // Remove duplicates based on track ID
  const uniqueItems = allItems.filter(
    (item, index, self) => index === self.findIndex((t) => t.id === item.id)
  );

  console.log("🎵 Total unique top tracks:", uniqueItems.length);
  return NextResponse.json({ items: uniqueItems });
}

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { getSpotifyAccessToken } from "@/lib/integrations/spotify";

export async function GET() {
  console.log("🔍 Spotify /me API called");

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

  // Validate token format
  if (!token.startsWith("BQ")) {
    console.log("❌ Invalid token format:", token.substring(0, 20) + "...");
    return NextResponse.json(
      { error: "invalid_token_format" },
      { status: 401 }
    );
  }

  console.log("🔑 Token found, calling Spotify API...");
  console.log("🔑 Token format:", token.substring(0, 20) + "...");

  const me = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  console.log("📡 Spotify API response status:", me.status);

  if (!me.ok) {
    const errorText = await me.text();
    console.log("❌ Spotify API error:", errorText);
    return NextResponse.json({ error: "spotify_error" }, { status: me.status });
  }

  const data = await me.json();
  console.log("✅ Spotify data received:", data);

  return NextResponse.json({
    display_name: data.display_name,
    email: data.email,
    product: data.product,
    id: data.id,
  });
}

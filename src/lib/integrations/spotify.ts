import { getServerSupabaseClient } from "@/lib/supabase/server";
import {
  analyzeAdvancedAudioFeatures,
  generateAudioAnalysisInsights,
  analyzeIndividualTracks,
  AdvancedAudioFeatures,
  AudioAnalysisInsights,
  TrackAnalysis,
} from "../spotify/advanced-audio-analysis";

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
};

type SpotifyProfile = {
  id: string;
  display_name: string;
  email: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  followers: {
    total: number;
  };
  country: string;
  product: string;
};

type SpotifyStats = {
  tracksPlayed: number;
  topGenre: string;
  mood: string;
  topArtists: string[];
  topTracks: string[];
  listeningTime: number;
  audioFeatures: {
    energy: number;
    valence: number;
    tempo: number;
    danceability: number;
  };
  // Enhanced audio analysis
  advancedFeatures: AdvancedAudioFeatures;
  audioInsights: AudioAnalysisInsights;
  trackAnalysis: TrackAnalysis[];
  summary: string;
};

export async function upsertSpotifyTokens(userId: string, tok: TokenResponse) {
  // Validate token data
  if (!tok.access_token || !tok.access_token.trim()) {
    throw new Error("Invalid access token");
  }

  if (!tok.scope || !tok.scope.trim()) {
    console.log("❌ No scope received from Spotify");
    throw new Error("No scope received");
  }

  const supabase = await getServerSupabaseClient();
  const now = Math.floor(Date.now() / 1000);
  const expires_at = now + (tok.expires_in ?? 3600) - 60; // 1 hour default

  console.log(
    "📅 Token expires at:",
    new Date(expires_at * 1000).toISOString()
  );

  const { data: existing } = await supabase
    .from("integration_tokens")
    .select("refresh_token")
    .eq("user_id", userId)
    .eq("provider", "spotify")
    .maybeSingle();

  const { error } = await supabase.from("integration_tokens").upsert(
    {
      user_id: userId,
      provider: "spotify",
      access_token: tok.access_token.trim(),
      refresh_token: tok.refresh_token ?? existing?.refresh_token ?? null,
      scope: tok.scope.trim(),
      token_type: tok.token_type ?? "Bearer",
      expires_at,
    },
    { onConflict: "user_id,provider" }
  );

  if (error) {
    console.log("❌ Error storing tokens:", error);
    throw error;
  }
}

export async function getSpotifyAccessToken(
  userId: string
): Promise<string | null> {
  try {
    const { getServerSupabaseClientWithServiceRole } = await import(
      "@/lib/supabase/server"
    );
    const supabase = await getServerSupabaseClientWithServiceRole();

    const { data, error } = await supabase
      .from("integration_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", userId)
      .eq("provider", "spotify")
      .maybeSingle();

    if (error) {
      console.log("❌ Spotify token query error:", error);
      return null;
    }

    if (!data) {
      console.log("❌ No Spotify token data found for user:", userId);
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    if (data.expires_at && data.expires_at > now && data.access_token) {
      return data.access_token;
    }

    if (!data.refresh_token) {
      console.log("❌ No refresh token available for Spotify");
      return null;
    }
    const refreshed = await refreshSpotifyToken(data.refresh_token);
    if (!refreshed) {
      console.log("❌ Failed to refresh Spotify token");
      return null;
    }

    await upsertSpotifyTokens(userId, refreshed);
    return refreshed.access_token;
  } catch (error) {
    console.error("❌ Error in getSpotifyAccessToken:", error);
    return null;
  }
}

async function refreshSpotifyToken(
  refreshToken: string
): Promise<TokenResponse | null> {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return null;
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${clientId}:${clientSecret}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const tokenData = await response.json();
    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || refreshToken,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type || "Bearer",
      scope: tokenData.scope,
    };
  } catch (error) {
    return null;
  }
}

export async function getSpotifyProfile(
  accessToken: string
): Promise<SpotifyProfile | null> {
  try {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const profile = await response.json();
    return profile;
  } catch (error) {
    return null;
  }
}

export async function getSpotifyStats(
  accessToken: string
): Promise<SpotifyStats | null> {
  try {
    // Get recently played tracks
    const response = await fetch(
      "https://api.spotify.com/v1/me/player/recently-played?limit=50",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const tracks = data.items || [];

    if (tracks.length === 0) {
      return {
        tracksPlayed: 0,
        topGenre: "Unknown",
        mood: "Neutral",
        topArtists: [],
        topTracks: [],
        listeningTime: 0,
        audioFeatures: {
          energy: 0,
          valence: 0,
          tempo: 0,
          danceability: 0,
        },
        advancedFeatures: {
          energy: 0,
          valence: 0,
          tempo: 0,
          danceability: 0,
          acousticness: 0,
          instrumentalness: 0,
          liveness: 0,
          speechiness: 0,
          loudness: 0,
          key: 0,
          mode: 0,
          timeSignature: 0,
          duration: 0,
          mood: "Unknown",
          energyLevel: "Unknown",
          tempoCategory: "Unknown",
          genre: "Unknown",
          listeningPattern: "Unknown",
          focusScore: 0,
          relaxationScore: 0,
          motivationScore: 0,
          creativityScore: 0,
        },
        audioInsights: {
          overallMood: "No data available",
          energyProfile: "No data available",
          listeningHabits: "No data available",
          focusPattern: "No data available",
          stressIndicators: [],
          wellnessCorrelations: [],
          recommendations: [],
          audioSummary: "No Spotify data available",
        },
        trackAnalysis: [],
        summary: "No Spotify data available",
      };
    }

    // Extract track IDs for audio features
    const trackIds = tracks.map((item: any) => item.track.id).slice(0, 20);

    // Get audio features for tracks
    let audioFeatures = null;
    if (trackIds.length > 0) {
      const featuresResponse = await fetch(
        `https://api.spotify.com/v1/audio-features?ids=${trackIds.join(",")}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      if (featuresResponse.ok) {
        const featuresData = await featuresResponse.json();
        audioFeatures = featuresData.audio_features;
      }
    }

    // Calculate stats
    const tracksPlayed = tracks.length;
    const topArtists = [
      ...new Set(tracks.map((item: any) => item.track.artists[0].name)),
    ].slice(0, 5) as string[];
    const topTracks = tracks
      .map((item: any) => item.track.name)
      .slice(0, 5) as string[];

    // Calculate average audio features
    let avgEnergy = 0,
      avgValence = 0,
      avgTempo = 0,
      avgDanceability = 0;
    if (audioFeatures) {
      const validFeatures = audioFeatures.filter((f: any) => f !== null);
      if (validFeatures.length > 0) {
        avgEnergy =
          validFeatures.reduce((sum: number, f: any) => sum + f.energy, 0) /
          validFeatures.length;
        avgValence =
          validFeatures.reduce((sum: number, f: any) => sum + f.valence, 0) /
          validFeatures.length;
        avgTempo =
          validFeatures.reduce((sum: number, f: any) => sum + f.tempo, 0) /
          validFeatures.length;
        avgDanceability =
          validFeatures.reduce(
            (sum: number, f: any) => sum + f.danceability,
            0
          ) / validFeatures.length;
      }
    }

    // Determine mood based on valence
    let mood = "Neutral";
    if (avgValence > 0.6) mood = "Positive";
    else if (avgValence < 0.4) mood = "Melancholic";
    else mood = "Neutral";

    // Determine top genre (simplified - would need artist genre lookup for accuracy)
    const topGenre = "Pop"; // Placeholder

    // Calculate listening time (estimated)
    const listeningTime = tracksPlayed * 3.5; // Average 3.5 minutes per track

    // Perform advanced audio analysis
    const advancedFeatures = analyzeAdvancedAudioFeatures(
      tracks,
      audioFeatures
    );
    const audioInsights = generateAudioAnalysisInsights(
      advancedFeatures,
      tracks
    );
    const trackAnalysis = analyzeIndividualTracks(tracks, audioFeatures);

    return {
      tracksPlayed,
      topGenre: advancedFeatures.genre,
      mood: advancedFeatures.mood,
      topArtists,
      topTracks,
      listeningTime,
      audioFeatures: {
        energy: avgEnergy,
        valence: avgValence,
        tempo: avgTempo,
        danceability: avgDanceability,
      },
      advancedFeatures,
      audioInsights,
      trackAnalysis,
      summary: audioInsights.audioSummary,
    };
  } catch (error) {
    return null;
  }
}

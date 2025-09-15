import { getServerSupabaseClient } from "@/lib/supabase/server";

export interface SpotifyData {
  summary: string;
  totalListeningTime: number;
  tracks: any[];
  audioFeatures: any;
  insights: any;
}

export class SpotifyService {
  private baseUrl = "https://api.spotify.com/v1";

  async getDailyData(userId: string, date: Date): Promise<SpotifyData> {
    try {
      const accessToken = await this.getValidAccessToken(userId);
      if (!accessToken) {
        throw new Error("No valid Spotify access token found");
      }

      const tracks = await this.fetchRecentTracks(accessToken, 50);
      const dailyTracks = tracks.filter((track) => {
        const playedAt = new Date(track.played_at);
        return (
          playedAt.toISOString().split("T")[0] ===
          date.toISOString().split("T")[0]
        );
      });

      const audioFeatures = await this.getAudioFeatures(
        accessToken,
        dailyTracks
      );
      const insights = this.calculateInsights(dailyTracks, audioFeatures);
      const summary = this.generateSummary(
        dailyTracks,
        audioFeatures,
        insights
      );

      return {
        summary,
        totalListeningTime: this.calculateTotalListeningTime(dailyTracks),
        tracks: dailyTracks,
        audioFeatures,
        insights,
      };
    } catch (error) {
      console.error("❌ [SpotifyService] Error fetching daily data:", error);
      return this.getFallbackData();
    }
  }

  async getWeeklyData(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SpotifyData> {
    try {
      const accessToken = await this.getValidAccessToken(userId);
      if (!accessToken) {
        throw new Error("No valid Spotify access token found");
      }

      const tracks = await this.fetchRecentTracks(accessToken, 200);
      const weeklyTracks = tracks.filter((track) => {
        const playedAt = new Date(track.played_at);
        return playedAt >= startDate && playedAt <= endDate;
      });

      const audioFeatures = await this.getAudioFeatures(
        accessToken,
        weeklyTracks
      );
      const insights = this.calculateInsights(weeklyTracks, audioFeatures);
      const summary = this.generateSummary(
        weeklyTracks,
        audioFeatures,
        insights
      );

      return {
        summary,
        totalListeningTime: this.calculateTotalListeningTime(weeklyTracks),
        tracks: weeklyTracks,
        audioFeatures,
        insights,
      };
    } catch (error) {
      console.error("❌ [SpotifyService] Error fetching weekly data:", error);
      return this.getFallbackData();
    }
  }

  private async getValidAccessToken(userId: string): Promise<string | null> {
    try {
      const supabase = await getServerSupabaseClient();

      const { data: tokenData } = await supabase
        .from("integration_tokens")
        .select("access_token, refresh_token, expires_at")
        .eq("user_id", userId)
        .eq("provider", "spotify")
        .single();

      if (!tokenData) return null;

      const now = Math.floor(Date.now() / 1000);
      if (tokenData.expires_at && tokenData.expires_at < now) {
        const refreshedToken = await this.refreshAccessToken(
          tokenData.refresh_token
        );
        if (refreshedToken) {
          await supabase
            .from("integration_tokens")
            .update({
              access_token: refreshedToken.access_token,
              refresh_token: refreshedToken.refresh_token,
              expires_at: refreshedToken.expires_at,
            })
            .eq("user_id", userId)
            .eq("provider", "spotify");

          return refreshedToken.access_token;
        }
        return null;
      }

      return tokenData.access_token;
    } catch (error) {
      console.error("❌ [SpotifyService] Error getting access token:", error);
      return null;
    }
  }

  private async refreshAccessToken(refreshToken: string): Promise<any> {
    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token || refreshToken,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      };
    } catch (error) {
      console.error("❌ [SpotifyService] Error refreshing token:", error);
      return null;
    }
  }

  private async fetchRecentTracks(
    accessToken: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me/player/recently-played?limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Recent tracks API error: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("❌ [SpotifyService] Error fetching recent tracks:", error);
      return [];
    }
  }

  private async getAudioFeatures(
    accessToken: string,
    tracks: any[]
  ): Promise<any> {
    if (tracks.length === 0) {
      return {
        energy: 0.5,
        valence: 0.5,
        danceability: 0.5,
        acousticness: 0.5,
        instrumentalness: 0.5,
        liveness: 0.5,
        speechiness: 0.5,
        tempo: 120,
      };
    }

    try {
      const trackIds = tracks.map((track) => track.track.id).filter((id) => id);

      if (trackIds.length === 0) {
        return this.getDefaultAudioFeatures();
      }

      const response = await fetch(
        `${this.baseUrl}/audio-features?ids=${trackIds.join(",")}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Audio features API error: ${response.status}`);
      }

      const data = await response.json();
      const features = data.audio_features.filter((f: any) => f !== null);

      if (features.length === 0) {
        return this.getDefaultAudioFeatures();
      }

      return {
        energy:
          features.reduce((sum: number, f: any) => sum + f.energy, 0) /
          features.length,
        valence:
          features.reduce((sum: number, f: any) => sum + f.valence, 0) /
          features.length,
        danceability:
          features.reduce((sum: number, f: any) => sum + f.danceability, 0) /
          features.length,
        acousticness:
          features.reduce((sum: number, f: any) => sum + f.acousticness, 0) /
          features.length,
        instrumentalness:
          features.reduce(
            (sum: number, f: any) => sum + f.instrumentalness,
            0
          ) / features.length,
        liveness:
          features.reduce((sum: number, f: any) => sum + f.liveness, 0) /
          features.length,
        speechiness:
          features.reduce((sum: number, f: any) => sum + f.speechiness, 0) /
          features.length,
        tempo:
          features.reduce((sum: number, f: any) => sum + f.tempo, 0) /
          features.length,
      };
    } catch (error) {
      console.error(
        "❌ [SpotifyService] Error fetching audio features:",
        error
      );
      return this.getDefaultAudioFeatures();
    }
  }

  private calculateInsights(tracks: any[], audioFeatures: any): any {
    return {
      topArtists: this.getTopArtists(tracks),
      moodAnalysis: this.analyzeMood(audioFeatures),
      energyLevel: this.analyzeEnergy(audioFeatures),
      listeningPatterns: this.analyzeListeningPatterns(tracks),
      recommendations: this.generateRecommendations(audioFeatures),
    };
  }

  private generateSummary(
    tracks: any[],
    audioFeatures: any,
    insights: any
  ): string {
    if (tracks.length === 0) {
      return "No music data available";
    }

    const hours = Math.floor(this.calculateTotalListeningTime(tracks) / 60);
    const minutes = this.calculateTotalListeningTime(tracks) % 60;

    let summary = `🎵 Listened to ${tracks.length} tracks (${hours}h ${minutes}m)`;

    if (insights.topArtists.length > 0) {
      summary += ` • Top artist: ${insights.topArtists[0].name}`;
    }

    if (insights.moodAnalysis) {
      summary += ` • Mood: ${insights.moodAnalysis}`;
    }

    return summary;
  }

  private calculateTotalListeningTime(tracks: any[]): number {
    return tracks.reduce((total, track) => {
      return total + track.track.duration_ms / 1000 / 60;
    }, 0);
  }

  private getTopArtists(tracks: any[]): any[] {
    const artistCount: { [key: string]: { name: string; count: number } } = {};

    tracks.forEach((track) => {
      track.track.artists.forEach((artist: any) => {
        if (artistCount[artist.id]) {
          artistCount[artist.id].count++;
        } else {
          artistCount[artist.id] = { name: artist.name, count: 1 };
        }
      });
    });

    return Object.values(artistCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private analyzeMood(audioFeatures: any): string {
    const { valence, energy } = audioFeatures;

    if (valence >= 0.7 && energy >= 0.6) return "Happy & Energetic";
    if (valence >= 0.7 && energy < 0.6) return "Happy & Calm";
    if (valence < 0.3 && energy >= 0.6) return "Sad & Energetic";
    if (valence < 0.3 && energy < 0.6) return "Sad & Calm";
    if (valence >= 0.5) return "Positive";
    return "Neutral";
  }

  private analyzeEnergy(audioFeatures: any): string {
    const { energy } = audioFeatures;

    if (energy >= 0.8) return "Very High";
    if (energy >= 0.6) return "High";
    if (energy >= 0.4) return "Medium";
    if (energy >= 0.2) return "Low";
    return "Very Low";
  }

  private analyzeListeningPatterns(tracks: any[]): any {
    const hourlyCount: { [key: number]: number } = {};

    tracks.forEach((track) => {
      const hour = new Date(track.played_at).getHours();
      hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourlyCount).sort(
      ([, a], [, b]) => b - a
    )[0];

    return {
      peakHour: peakHour ? parseInt(peakHour[0]) : 0,
      totalHours: Object.keys(hourlyCount).length,
      distribution: hourlyCount,
    };
  }

  private generateRecommendations(audioFeatures: any): string[] {
    const recommendations = [];

    if (audioFeatures.valence < 0.3) {
      recommendations.push(
        "Try listening to more upbeat music to improve your mood"
      );
    }

    if (audioFeatures.energy < 0.3) {
      recommendations.push(
        "Consider adding some high-energy tracks to boost your energy"
      );
    }

    if (audioFeatures.danceability < 0.3) {
      recommendations.push("Try some more danceable music to get moving");
    }

    return recommendations;
  }

  private getDefaultAudioFeatures(): any {
    return {
      energy: 0.5,
      valence: 0.5,
      danceability: 0.5,
      acousticness: 0.5,
      instrumentalness: 0.5,
      liveness: 0.5,
      speechiness: 0.5,
      tempo: 120,
    };
  }

  private getFallbackData(): SpotifyData {
    return {
      summary: "No music data available",
      totalListeningTime: 0,
      tracks: [],
      audioFeatures: this.getDefaultAudioFeatures(),
      insights: {
        topArtists: [],
        moodAnalysis: "Unknown",
        energyLevel: "Unknown",
        listeningPatterns: { peakHour: 0, totalHours: 0, distribution: {} },
        recommendations: [],
      },
    };
  }
}

import { getServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

export interface RefreshResult {
  success: boolean;
  provider: string;
  newExpiresAt?: number;
  error?: string;
}

export class TokenRefreshService {
  /**
   * Automatically refresh all expired/expiring tokens for a user
   */
  static async refreshUserTokens(userId: string): Promise<RefreshResult[]> {
    const supabase = await getServerSupabaseClientWithServiceRole();

    // Get all tokens that need refresh
    const { data: tokens } = await supabase
      .from("integration_tokens")
      .select("provider, access_token, refresh_token, expires_at")
      .eq("user_id", userId);

    if (!tokens) return [];

    const results: RefreshResult[] = [];
    const now = Math.floor(Date.now() / 1000);

    for (const token of tokens) {
      // Check if token needs refresh (expired or expiring within 1 hour)
      const needsRefresh =
        token.expires_at &&
        (token.expires_at < now || token.expires_at < now + 3600);

      if (needsRefresh && token.refresh_token) {
        try {
          const result = await this.refreshToken(
            token.provider,
            token.refresh_token,
            userId
          );
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            provider: token.provider,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    return results;
  }

  /**
   * Refresh a specific token for a provider
   */
  private static async refreshToken(
    provider: string,
    refreshToken: string,
    userId: string
  ): Promise<RefreshResult> {
    try {
      let newTokenData: any;

      switch (provider) {
        case "spotify":
          newTokenData = await this.refreshSpotifyToken(refreshToken);
          break;
        case "fitbit":
          newTokenData = await this.refreshFitbitToken(refreshToken);
          break;
        case "gmail":
          newTokenData = await this.refreshGmailToken(refreshToken);
          break;
        case "google-calendar":
          newTokenData = await this.refreshGoogleCalendarToken(refreshToken);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      // Update the token in database
      await this.updateTokenInDatabase(provider, userId, newTokenData);

      return {
        success: true,
        provider,
        newExpiresAt: newTokenData.expires_at,
      };
    } catch (error) {
      return {
        success: false,
        provider,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Refresh Spotify token
   */
  private static async refreshSpotifyToken(refreshToken: string): Promise<any> {
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
      throw new Error(`Spotify refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      refresh_token: data.refresh_token || refreshToken, // Keep old refresh token if new one not provided
    };
  }

  /**
   * Refresh Fitbit token
   */
  private static async refreshFitbitToken(refreshToken: string): Promise<any> {
    const response = await fetch("https://api.fitbit.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Fitbit refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      refresh_token: data.refresh_token || refreshToken,
    };
  }

  /**
   * Refresh Gmail token
   */
  private static async refreshGmailToken(refreshToken: string): Promise<any> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Gmail refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      refresh_token: data.refresh_token || refreshToken,
    };
  }

  /**
   * Refresh Google Calendar token
   */
  private static async refreshGoogleCalendarToken(
    refreshToken: string
  ): Promise<any> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Calendar refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      refresh_token: data.refresh_token || refreshToken,
    };
  }

  /**
   * Update token in database after refresh
   */
  private static async updateTokenInDatabase(
    provider: string,
    userId: string,
    tokenData: any
  ): Promise<void> {
    const supabase = await getServerSupabaseClientWithServiceRole();

    const { error } = await supabase
      .from("integration_tokens")
      .update({
        access_token: tokenData.access_token,
        expires_at: tokenData.expires_at,
        refresh_token: tokenData.refresh_token,
        updated_at: new Date().toISOString(),
      })
      .eq("provider", provider)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to update token in database: ${error.message}`);
    }
  }
}

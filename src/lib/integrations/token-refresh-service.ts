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
      .select("provider, access_token, refresh_token, expires_at, user_id")
      .eq("user_id", userId);

    if (!tokens) return [];

    const results: RefreshResult[] = [];
    const now = Math.floor(Date.now() / 1000);

    for (const token of tokens) {
      // Check if token is actually expired
      const isExpired = token.expires_at && token.expires_at < now;

      if (isExpired && token.refresh_token) {
        // Token is expired, try to refresh
        console.log(
          `🔄 Token expired for ${token.provider}, attempting refresh...`
        );
        console.log(`🔍 Refresh token exists: ${!!token.refresh_token}`);
        console.log(
          `⏰ Token expires at: ${token.expires_at}, Current time: ${now}`
        );
        try {
          const result = await this.refreshToken(
            token.provider,
            token.refresh_token,
            userId
          );
          console.log(`✅ Refresh successful for ${token.provider}:`, result);
          results.push(result);
        } catch (error) {
          console.log(
            `❌ Failed to refresh expired token for ${token.provider}:`,
            error
          );

          // Check if it's an invalid_grant error (refresh token expired)
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          const isRefreshTokenExpired =
            errorMessage.includes("invalid_grant") ||
            errorMessage.includes("unauthorized_client") ||
            errorMessage.includes("invalid_client");

          if (isRefreshTokenExpired) {
            console.log(
              `🔄 Refresh token expired for ${token.provider}, marking for reconnection`
            );
            // Mark this integration for reconnection
            await this.markForReconnection(token.user_id, token.provider);
          }

          results.push({
            success: false,
            provider: token.provider,
            error: errorMessage,
          });
        }
      } else if (isExpired && !token.refresh_token) {
        // Token is expired but no refresh token available
        console.log(
          `❌ Token expired for ${token.provider} but no refresh token available`
        );
        results.push({
          success: false,
          provider: token.provider,
          error: "Token expired and no refresh token available",
        });
      } else {
        // Token is still valid, no need to refresh
        console.log(
          `✅ Token still valid for ${token.provider}, no refresh needed`
        );
        results.push({
          success: true,
          provider: token.provider,
          newExpiresAt: token.expires_at, // Keep original expiration
        });
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
    console.log(`🔄 Refreshing Spotify token...`);
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
      const errorText = await response.text();
      console.log(
        `❌ Spotify refresh failed: ${response.status} ${response.statusText} - ${errorText}`
      );
      throw new Error(`Spotify refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Spotify token refreshed successfully`);
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
    console.log(`🔄 Refreshing Gmail token...`);
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
      const errorText = await response.text();
      console.log(
        `❌ Gmail refresh failed: ${response.status} ${response.statusText} - ${errorText}`
      );
      throw new Error(`Gmail refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Gmail token refreshed successfully`);
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

    // Use upsert to handle cases where the token might not exist or RLS policies are strict
    const { error } = await supabase.from("integration_tokens").upsert(
      {
        user_id: userId,
        provider: provider,
        access_token: tokenData.access_token,
        expires_at: tokenData.expires_at,
        refresh_token: tokenData.refresh_token,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,provider",
      }
    );

    if (error) {
      console.error(
        `❌ Failed to update token in database for ${provider}:`,
        error
      );
      throw new Error(`Failed to update token in database: ${error.message}`);
    }

    console.log(`✅ Token updated successfully for ${provider} user ${userId}`);
  }

  /**
   * Mark integration for reconnection when refresh token is expired
   */
  private static async markForReconnection(
    userId: string,
    provider: string
  ): Promise<void> {
    try {
      const supabase = await getServerSupabaseClientWithServiceRole();

      const { error } = await supabase
        .from("integration_tokens")
        .update({
          needs_reconnection: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("provider", provider);

      if (error) {
        console.error(`❌ Failed to mark ${provider} for reconnection:`, error);
      } else {
        console.log(
          `✅ Marked ${provider} for reconnection for user ${userId}`
        );
      }
    } catch (error) {
      console.error(`❌ Error marking ${provider} for reconnection:`, error);
    }
  }
}

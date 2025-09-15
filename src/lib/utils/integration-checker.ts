import { getServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Check if a user has valid integrations connected
 * @param userId - The user ID to check
 * @returns Promise<boolean> - true if user has valid integrations, false otherwise
 */
export async function hasValidIntegrations(userId: string): Promise<boolean> {
  try {
    const supabase = await getServerSupabaseClient();

    // Get integration tokens from database
    const { data, error } = await supabase
      .from("integration_tokens")
      .select("provider, access_token, expires_at")
      .eq("user_id", userId);

    if (error) {
      console.error(`❌ Error checking user integrations:`, error);
      return false;
    }

    if (!data || data.length === 0) {
      console.log(`❌ No integration records found for user ${userId}`);
      return false;
    }

    // Check if any integration has a valid token
    const now = Math.floor(Date.now() / 1000);
    let hasWorkingIntegration = false;

    for (const integration of data) {
      const isTokenValid =
        integration.access_token &&
        integration.expires_at &&
        integration.expires_at > now;

      if (isTokenValid) {
        hasWorkingIntegration = true;
        console.log(
          `✅ User ${userId} has working integration: ${integration.provider}`
        );
        break; // At least one working integration is enough
      }
    }

    console.log(
      `📊 User ${userId} has working integrations: ${hasWorkingIntegration}`
    );
    return hasWorkingIntegration;
  } catch (error) {
    console.error(`❌ Error checking user integrations:`, error);
    return false;
  }
}

/**
 * Get list of connected integration providers for a user
 * @param userId - The user ID to check
 * @returns Promise<string[]> - Array of connected integration providers
 */
export async function getConnectedIntegrations(
  userId: string
): Promise<string[]> {
  try {
    const supabase = await getServerSupabaseClient();

    const { data, error } = await supabase
      .from("integration_tokens")
      .select("provider, access_token, expires_at")
      .eq("user_id", userId);

    if (error || !data) {
      return [];
    }

    const now = Math.floor(Date.now() / 1000);
    const connectedProviders: string[] = [];

    for (const integration of data) {
      const isTokenValid =
        integration.access_token &&
        integration.expires_at &&
        integration.expires_at > now;

      if (isTokenValid) {
        connectedProviders.push(integration.provider);
      }
    }

    return connectedProviders;
  } catch (error) {
    console.error(`❌ Error getting connected integrations:`, error);
    return [];
  }
}

import { Suspense } from "react";
import { IntegrationsList } from "@/components/integrations-list";
import { mockIntegrations, type IntegrationItem } from "@/app/data/mock";
import {
  getServerSupabaseClient,
  getServerSession,
} from "@/lib/supabase/server";
import {
  validateIntegrationTokens,
  getExpiringSoonTokens,
} from "@/lib/integrations/token-validator";
import { ManualRefreshButton } from "@/components/manual-refresh-button";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = "force-dynamic";

// Simulate loading delay for better UX
async function getIntegrationsData() {
  // Add a realistic delay to show loading state and simulate network latency
  // This gives users time to see the loading skeleton and provides better perceived performance
  await new Promise((resolve) => setTimeout(resolve, 800));

  const session = await getServerSession();
  const supabase = await getServerSupabaseClient();

  let connectedProviders: string[] = [];
  let tokenData: Record<
    string,
    { created_at: string; expires_at?: number; refresh_token?: string }
  > = {};
  let expiredTokens: string[] = [];

  if (session) {
    const { data, error } = await supabase
      .from("integration_tokens")
      .select("provider, created_at, expires_at, refresh_token")
      .eq("user_id", session.user.id);

    console.log("🔍 [Integrations] Database query result:", { data, error });

    if (error) {
      console.error("❌ [Integrations] Database error:", error);
    }

    if (data) {
      const now = Math.floor(Date.now() / 1000);
      console.log("🔍 [Integrations] Current timestamp:", now);
      console.log("🔍 [Integrations] Found tokens:", data.length);

      data.forEach((d) => {
        // Handle both Unix timestamp (number) and ISO string formats
        let expiresAtUnix: number | null = null;
        if (d.expires_at !== null && d.expires_at !== undefined) {
          if (typeof d.expires_at === "number") {
            expiresAtUnix = d.expires_at;
          } else if (typeof d.expires_at === "string") {
            // Convert ISO string to Unix timestamp
            expiresAtUnix = Math.floor(new Date(d.expires_at).getTime() / 1000);
          }
        }

        console.log(`🔍 [Integrations] Processing ${d.provider}:`, {
          expires_at: d.expires_at,
          expires_at_type: typeof d.expires_at,
          expiresAtUnix,
          hasRefreshToken: !!d.refresh_token,
          isExpired: expiresAtUnix ? expiresAtUnix < now : false,
        });

        const isExpired = expiresAtUnix ? expiresAtUnix < now : false;
        const hasRefreshToken = !!d.refresh_token;

        // If no expires_at is set, consider the token as valid (legacy tokens)
        const isLegacyToken =
          d.expires_at === null || d.expires_at === undefined;

        // Only consider it truly expired if there's no refresh token for auto-refresh
        const needsManualReconnection = isExpired && !hasRefreshToken;

        if (isLegacyToken || !isExpired || hasRefreshToken) {
          connectedProviders.push(d.provider);
          console.log(
            `✅ [Integrations] ${d.provider} marked as connected (legacy: ${isLegacyToken}, expired: ${isExpired}, hasRefresh: ${hasRefreshToken})`
          );
        } else {
          expiredTokens.push(d.provider);
          console.log(`❌ [Integrations] ${d.provider} marked as expired`);
        }

        tokenData[d.provider] = {
          created_at: d.created_at,
          expires_at: expiresAtUnix || undefined,
          refresh_token: d.refresh_token,
        };
      });

      console.log(
        "🔍 [Integrations] Final connected providers:",
        connectedProviders
      );
      console.log("🔍 [Integrations] Final expired tokens:", expiredTokens);
    } else {
      console.log("❌ [Integrations] No data returned from database");
    }
  } else {
    console.log("❌ [Integrations] No session found");
  }

  const items: IntegrationItem[] = mockIntegrations.map((it) => {
    const isConnected = connectedProviders.includes(it.key);
    const isExpired = expiredTokens.includes(it.key);
    const realTokenData = tokenData[it.key];
    const hasRefreshToken = realTokenData?.refresh_token;

    console.log(`🔍 [Integrations] Mapping ${it.key}:`, {
      isConnected,
      isExpired,
      hasRealTokenData: !!realTokenData,
      hasRefreshToken,
      realTokenData,
    });

    if (
      it.key === "spotify" ||
      it.key === "fitbit" ||
      it.key === "google-calendar" ||
      it.key === "gmail" ||
      it.key === "google-tasks"
    ) {
      // If token is expired but has refresh token, show as connected (will auto-refresh)
      if (
        realTokenData?.expires_at &&
        realTokenData.expires_at < Math.floor(Date.now() / 1000) &&
        hasRefreshToken
      ) {
        console.log(
          `✅ [Integrations] ${it.key} - Auto-refreshing (expired but has refresh token)`
        );
        return {
          ...it,
          status: "connected",
          lastSync: "Auto-refreshing",
          created_at: realTokenData.created_at,
          notes: `Your ${it.name} token will be automatically refreshed.`,
        };
      }

      const finalStatus = isExpired
        ? "error"
        : isConnected
        ? "connected"
        : "disconnected";

      console.log(`🔍 [Integrations] ${it.key} - Final status: ${finalStatus}`);

      return {
        ...it,
        status: finalStatus,
        lastSync: isExpired ? "Token expired" : isConnected ? "just now" : "—",
        created_at: realTokenData ? realTokenData.created_at : it.created_at,
        notes: isExpired
          ? `Your ${it.name} token has expired. Please reconnect.`
          : isConnected
          ? undefined
          : `Connect your ${it.name} account.`,
      };
    }
    return it;
  });

  return { items, expiredTokens };
}

export default async function IntegrationsPage() {
  const { items, expiredTokens } = await getIntegrationsData();

  // Get additional token validation data
  let expiringSoonTokens: any[] = [];
  try {
    const session = await getServerSession();
    if (session?.user?.id) {
      const tokenStatuses = await validateIntegrationTokens(session.user.id);
      expiringSoonTokens = getExpiringSoonTokens(tokenStatuses);
    }
  } catch (error) {
    console.error("❌ Integrations: Error validating tokens:", error);
  }

  return (
    <div className="p-0 space-y-6 mx-auto">
      {/* Auto Token Refresh Component */}
      {/* Removed AutoTokenRefresh component */}

      {/* Expired Token Warning (No refresh token available) */}
      {expiredTokens.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-amber-600">⚠️</span>
            <div>
              <div className="font-medium text-amber-800">
                Integration Tokens Expired
              </div>
              <div className="text-sm text-amber-700">
                The following integrations need reconnection:{" "}
                {expiredTokens.join(", ")}
              </div>
              <div className="mt-2 text-xs text-amber-600">
                Click on the integration card below to reconnect.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expiring Soon Warning (No refresh token available) */}
      {expiringSoonTokens.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">⏰</span>
            <div>
              <div className="font-medium text-blue-800">
                Integration Tokens Expiring Soon
              </div>
              <div className="text-sm text-blue-700">
                The following integrations will expire soon:{" "}
                {expiringSoonTokens
                  .map((t) => `${t.provider} (${t.daysUntilExpiry} days)`)
                  .join(", ")}
              </div>
              <div className="mt-2 text-xs text-blue-600">
                Consider reconnecting these integrations to maintain access.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Integrations
          </h1>
          <p className="text-muted-foreground">
            Connect your accounts to aggregate data. You can safely add more
            later.
          </p>
        </div>
        <ManualRefreshButton />
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>Loading integrations...</span>
            </div>
            <IntegrationsList integrations={[]} isLoading={true} />
          </div>
        }
      >
        <IntegrationsList integrations={items} />
      </Suspense>
    </div>
  );
}

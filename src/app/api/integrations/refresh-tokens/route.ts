import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { TokenRefreshService } from "@/lib/integrations/token-refresh-service";

// Simple in-memory rate limiting (in production, use Redis or similar)
const refreshCooldowns = new Map<string, number>();
const REFRESH_COOLDOWN_MS = 30000; // 30 seconds cooldown

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = Date.now();
    const lastRefresh = refreshCooldowns.get(userId);

    // Check if user is on cooldown
    if (lastRefresh && now - lastRefresh < REFRESH_COOLDOWN_MS) {
      const remainingCooldown = Math.ceil(
        (REFRESH_COOLDOWN_MS - (now - lastRefresh)) / 1000
      );
      console.log(
        `⏳ User ${userId} is on cooldown, ${remainingCooldown}s remaining`
      );
      return NextResponse.json(
        {
          error: "Rate limited",
          message: `Please wait ${remainingCooldown} seconds before trying again`,
          cooldownRemaining: remainingCooldown,
        },
        { status: 429 }
      );
    }

    console.log(
      `🔄 Token refresh requested for user: ${userId} at ${new Date().toISOString()}`
    );

    // Set cooldown
    refreshCooldowns.set(userId, now);

    // Automatically refresh all expired/expiring tokens
    const results = await TokenRefreshService.refreshUserTokens(userId);

    const successfulRefreshes = results.filter((r) => r.success);
    const failedRefreshes = results.filter((r) => !r.success);

    console.log(
      `✅ Token refresh completed: ${successfulRefreshes.length} successful, ${failedRefreshes.length} failed`
    );

    return NextResponse.json({
      success: true,
      message: `Refreshed ${successfulRefreshes.length} tokens successfully`,
      results: {
        successful: successfulRefreshes,
        failed: failedRefreshes,
      },
      summary: {
        total: results.length,
        successful: successfulRefreshes.length,
        failed: failedRefreshes.length,
      },
    });
  } catch (error) {
    console.error("❌ Token refresh error:", error);
    return NextResponse.json(
      {
        error: "Failed to refresh tokens",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return current token status without refreshing
    return NextResponse.json({
      message: "Token refresh endpoint ready",
      userId: session.user.id,
      endpoint: "POST to /api/integrations/refresh-tokens to refresh tokens",
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

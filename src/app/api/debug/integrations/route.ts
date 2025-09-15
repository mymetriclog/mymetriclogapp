import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getServerSupabaseClient();

    // Get all integration tokens for the user
    const { data: tokens, error } = await supabase
      .from("integration_tokens")
      .select("*")
      .eq("user_id", session.user.id);

    if (error) {
      return NextResponse.json(
        { error: "Database error", details: error },
        { status: 500 }
      );
    }

    const now = Math.floor(Date.now() / 1000);

    // Process tokens to show their status
    const processedTokens =
      tokens?.map((token) => {
        // Handle both Unix timestamp (number) and ISO string formats
        let expiresAtUnix: number | null = null;
        if (token.expires_at) {
          if (typeof token.expires_at === "number") {
            expiresAtUnix = token.expires_at;
          } else if (typeof token.expires_at === "string") {
            // Convert ISO string to Unix timestamp
            expiresAtUnix = Math.floor(
              new Date(token.expires_at).getTime() / 1000
            );
          }
        }

        return {
          provider: token.provider,
          created_at: token.created_at,
          expires_at: token.expires_at,
          expires_at_type: typeof token.expires_at,
          expiresAtUnix,
          hasRefreshToken: !!token.refresh_token,
          isExpired: expiresAtUnix ? expiresAtUnix < now : false,
          expiresIn: expiresAtUnix ? expiresAtUnix - now : null,
          daysUntilExpiry: expiresAtUnix
            ? Math.ceil((expiresAtUnix - now) / (24 * 60 * 60))
            : null,
        };
      }) || [];

    return NextResponse.json({
      userId: session.user.id,
      userEmail: session.user.email,
      currentTimestamp: now,
      currentDate: new Date().toISOString(),
      tokenCount: tokens?.length || 0,
      tokens: processedTokens,
      rawTokens: tokens,
    });
  } catch (error) {
    console.error("❌ Debug integrations error:", error);
    return NextResponse.json(
      { error: "Server error", details: error },
      { status: 500 }
    );
  }
}

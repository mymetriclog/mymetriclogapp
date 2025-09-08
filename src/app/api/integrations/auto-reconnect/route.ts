import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(
      `🔗 Auto-reconnection requested for user: ${userEmail || userId}`
    );

    const supabase = await getServerSupabaseClientWithServiceRole();

    // Get all integrations that need reconnection for this user
    const { data: integrations, error } = await supabase
      .from("integration_tokens")
      .select("provider, needs_reconnection, created_at")
      .eq("user_id", userId)
      .eq("needs_reconnection", true);

    if (error) {
      console.error(
        `❌ Error fetching integrations needing reconnection:`,
        error
      );
      return NextResponse.json(
        { error: "Failed to fetch integrations" },
        { status: 500 }
      );
    }

    if (!integrations || integrations.length === 0) {
      console.log(
        `✅ No integrations need reconnection for user: ${userEmail || userId}`
      );
      return NextResponse.json({
        message: "No integrations need reconnection",
        integrations: [],
      });
    }

    // Generate reconnection URLs for each provider
    const reconnectionUrls = integrations.map((integration) => {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return {
        provider: integration.provider,
        reconnectUrl: `${baseUrl}/api/integrations/${integration.provider}/connect?returnTo=/integrations&autoReconnect=true`,
        requestedAt: integration.created_at,
      };
    });

    console.log(
      `🔗 Generated ${reconnectionUrls.length} reconnection URLs for user: ${
        userEmail || userId
      }`
    );

    // TODO: Send email notification to user with reconnection links
    // This would typically send an email with the reconnection URLs
    // For now, we'll just log the URLs
    console.log(
      `📧 Reconnection URLs for ${userEmail || userId}:`,
      reconnectionUrls
    );

    return NextResponse.json({
      message: "Reconnection URLs generated successfully",
      userEmail: userEmail || userId,
      integrations: reconnectionUrls,
      totalIntegrations: reconnectionUrls.length,
    });
  } catch (error) {
    console.error(`❌ Error in auto-reconnect:`, error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Get integrations that need reconnection for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = await getServerSupabaseClientWithServiceRole();

    const { data: integrations, error } = await supabase
      .from("integration_tokens")
      .select("provider, needs_reconnection, created_at, updated_at")
      .eq("user_id", userId)
      .eq("needs_reconnection", true);

    if (error) {
      console.error(
        `❌ Error fetching integrations needing reconnection:`,
        error
      );
      return NextResponse.json(
        { error: "Failed to fetch integrations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      userId,
      integrations: integrations || [],
      totalIntegrations: integrations?.length || 0,
    });
  } catch (error) {
    console.error(`❌ Error in auto-reconnect GET:`, error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

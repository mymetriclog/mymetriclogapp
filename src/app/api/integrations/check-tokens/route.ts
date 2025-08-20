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
    
    // Get user's integration tokens from the integration_tokens table (same as integrations page)
    const { data: tokens, error } = await supabase
      .from("integration_tokens")
      .select("provider, created_at, expires_at")
      .eq("user_id", session.user.id);

    if (error) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const connectedProviders = tokens ? tokens.map(t => t.provider) : [];
    const hasIntegrations = connectedProviders.length > 0;

    // Create integrations object for backward compatibility
    const integrations = connectedProviders.reduce((acc, provider) => {
      acc[provider] = { connected: true };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      hasIntegrations,
      integrations,
      connectedProviders
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

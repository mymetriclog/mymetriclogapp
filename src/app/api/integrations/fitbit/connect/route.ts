import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fitbit OAuth 2.0 configuration
    const clientId = process.env.FITBIT_CLIENT_ID;
    const redirectUri =
      process.env.FITBIT_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/fitbit/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: "Fitbit client ID not configured" },
        { status: 500 }
      );
    }

    // Generate state parameter for CSRF protection
    const state =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Store state in session or database for validation
    // For now, we'll use a simple approach - in production, store this securely

    // Fitbit OAuth scopes
    const scopes = [
      "activity", // Read activity data
      "heartrate", // Read heart rate data
      "location", // Read location data
      "nutrition", // Read nutrition data
      "profile", // Read profile data
      "settings", // Read settings
      "sleep", // Read sleep data
      "social", // Read social data
      "weight", // Read weight data
    ].join(" ");

    // Build OAuth URL
    const oauthUrl = new URL("https://www.fitbit.com/oauth2/authorize");
    oauthUrl.searchParams.set("response_type", "code");
    oauthUrl.searchParams.set("client_id", clientId);
    oauthUrl.searchParams.set("redirect_uri", redirectUri);
    oauthUrl.searchParams.set("scope", scopes);
    oauthUrl.searchParams.set("state", state);
    oauthUrl.searchParams.set("expires_in", "604800"); // 7 days

    // Redirect to Fitbit OAuth
    return NextResponse.redirect(oauthUrl.toString());
  } catch (error) {
    console.error("Fitbit OAuth error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Fitbit OAuth" },
      { status: 500 }
    );
  }
}

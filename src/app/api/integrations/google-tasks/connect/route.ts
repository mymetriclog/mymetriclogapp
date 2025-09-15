import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const clientId =
      process.env.TASK_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;

    // Determine redirect URI based on environment
    let redirectUri;
    const isProduction = process.env.NODE_ENV === "production";

    if (process.env.GOOGLE_TASK_REDIRECT_URL) {
      // Use explicit environment variable if set
      redirectUri = process.env.GOOGLE_TASK_REDIRECT_URL;
    } else if (isProduction) {
      // Production fallback
      redirectUri =
        "https://www.mymetriclog.com/api/integrations/google-tasks/callback";
    } else {
      // Development fallback
      redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-tasks/callback`;
    }

    const scope = "https://www.googleapis.com/auth/tasks";
    const responseType = "code";

    if (!clientId) {
      return NextResponse.json(
        { error: "Google Client ID not configured" },
        { status: 500 }
      );
    }

    // Log for debugging
    console.log("🔐 [Google Tasks] OAuth Configuration:", {
      clientId: clientId.substring(0, 20) + "...",
      redirectUri,
      isProduction,
      nodeEnv: process.env.NODE_ENV,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(
      scope
    )}&response_type=${responseType}&access_type=offline&prompt=consent`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Error creating Google Tasks OAuth URL:", error);
    return NextResponse.json(
      { error: "Failed to create OAuth URL" },
      { status: 500 }
    );
  }
}

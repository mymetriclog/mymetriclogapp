import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const clientId =
      process.env.TASK_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    // Use environment-specific redirect URI
    const redirectUri =
      process.env.NODE_ENV === "production"
        ? "https://www.mymetriclog.com/api/integrations/google-tasks/callback"
        : process.env.GOOGLE_TASK_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-tasks/callback`;
    const scope = "https://www.googleapis.com/auth/tasks";
    const responseType = "code";

    if (!clientId) {
      return NextResponse.json(
        { error: "Google Client ID not configured" },
        { status: 500 }
      );
    }

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

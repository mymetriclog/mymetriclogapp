import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-tasks/callback`;
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

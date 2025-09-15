import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  try {
    const clientId =
      process.env.TASK_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_TASK_REDIRECT_URL; // <-- set this per env

    if (!clientId) {
      return NextResponse.json(
        { error: "Google Client ID not configured" },
        { status: 500 }
      );
    }
    if (!redirectUri) {
      return NextResponse.json(
        { error: "GOOGLE_TASK_REDIRECT_URL not configured" },
        { status: 500 }
      );
    }

    // Optional: assert no trailing slash if your console entry has none
    // if (redirectUri.endsWith("/")) throw new Error("redirectUri should not end with '/'");

    const scope = "https://www.googleapis.com/auth/tasks";
    const responseType = "code";
    const state = Buffer.from(
      JSON.stringify({ returnTo: "/settings/integrations" })
    ).toString("base64url");

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&response_type=${responseType}` +
      `&access_type=offline&prompt=consent` +
      `&state=${state}`;

    console.log("Computed redirectUri:", redirectUri);
    return NextResponse.json({ authUrl });
  } catch (err) {
    console.error("Error creating Google Tasks OAuth URL:", err);
    return NextResponse.json(
      { error: "Failed to create OAuth URL" },
      { status: 500 }
    );
  }
}

import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { upsertGoogleTasksTokens } from "@/lib/integrations/google-tasks";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    const url = new URL(req.url);

    if (!session) {
      const login = new URL("/login", url.origin);
      return NextResponse.redirect(login);
    }

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      console.error("❌ Google Tasks OAuth error:", error);
      const errorUrl = new URL("/integrations", url.origin);
      errorUrl.searchParams.set(
        "error",
        `Google Tasks authorization failed: ${error}`
      );
      return NextResponse.redirect(errorUrl);
    }

    if (!code || !state) {
      const errorUrl = new URL("/integrations", url.origin);
      errorUrl.searchParams.set("error", "Missing authorization code or state");
      return NextResponse.redirect(errorUrl);
    }

    // Verify state parameter
    const cookies = req.cookies.get("mml_google_tasks_state");
    if (
      !cookies ||
      cookies.value !==
        JSON.parse(Buffer.from(state, "base64").toString()).nonce
    ) {
      const errorUrl = new URL("/integrations", url.origin);
      errorUrl.searchParams.set("error", "Invalid state parameter");
      return NextResponse.redirect(errorUrl);
    }

    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_TASKS_REDIRECT_URI ||
      new URL("/api/integrations/google-tasks/callback", url.origin).toString();

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();

    // Store tokens in database
    await upsertGoogleTasksTokens(session.user.id, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
    });

    console.log("✅ Google Tasks tokens stored successfully");

    // Redirect back to integrations page
    const returnTo =
      JSON.parse(Buffer.from(state, "base64").toString()).returnTo ||
      "/integrations";
    const successUrl = new URL(returnTo, url.origin);
    successUrl.searchParams.set(
      "success",
      "Google Tasks connected successfully"
    );

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error("❌ Google Tasks callback error:", error);
    const errorUrl = new URL("/integrations", req.nextUrl.origin);
    errorUrl.searchParams.set(
      "error",
      `Google Tasks connection failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    return NextResponse.redirect(errorUrl);
  }
}

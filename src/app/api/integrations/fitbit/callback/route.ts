import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { upsertFitbitTokens } from "@/lib/integrations/fitbit";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.redirect("/auth/signin");
    }

    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("Fitbit OAuth error:", error);
      return NextResponse.redirect("/integrations/fitbit?error=oauth_failed");
    }

    // Validate required parameters
    if (!code) {
      return NextResponse.redirect("/integrations/fitbit?error=no_code");
    }

    // Exchange authorization code for tokens
    const tokenResponse = await exchangeCodeForTokens(code);
    if (!tokenResponse) {
      return NextResponse.redirect(
        "/integrations/fitbit?error=token_exchange_failed"
      );
    }

    // Store tokens in database
    await upsertFitbitTokens(session.user.id, tokenResponse);

    // Redirect to success page
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/integrations/fitbit?success=connected`
    );
  } catch (error) {
    console.error("Fitbit callback error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/integrations/fitbit?error=callback_failed`
    );
  }
}

async function exchangeCodeForTokens(code: string) {
  try {
    const clientId = process.env.FITBIT_CLIENT_ID;
    const clientSecret = process.env.FITBIT_CLIENT_SECRET;
    const redirectUri =
      process.env.FITBIT_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/fitbit/callback`;

    if (!clientId || !clientSecret) {
      throw new Error("Fitbit credentials not configured");
    }

    // Exchange code for tokens
    const response = await fetch("https://api.fitbit.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${clientId}:${clientSecret}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Fitbit token exchange error:", errorText);
      return null;
    }

    const tokenData = await response.json();
    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type || "Bearer",
      scope: tokenData.scope,
    };
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    return null;
  }
}

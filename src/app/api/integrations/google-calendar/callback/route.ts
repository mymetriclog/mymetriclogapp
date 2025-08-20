import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { upsertGoogleCalendarTokens } from "@/lib/integrations/google-calendar";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function GET(req: NextRequest) {
  try {
    console.log("Google Calendar callback started");
    console.log("Request URL:", req.url);

    // Convert headers to a safe object format
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log("Request headers:", headers);

    const session = await getServerSession();
    if (!session) {
      console.log("No session found, redirecting to login");
      return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
    }

    console.log("Session found for user:", session.user.id);

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    console.log("Callback parameters:", {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error,
      stateLength: state?.length,
    });

    if (error) {
      console.error("Google Calendar OAuth error:", error);
      const errorUrl = new URL(
        "/integrations/google-calendar",
        req.nextUrl.origin
      );
      errorUrl.searchParams.set("error", `OAuth error: ${error}`);
      return NextResponse.redirect(errorUrl);
    }

    if (!code || !state) {
      console.error("Missing code or state");
      const errorUrl = new URL(
        "/integrations/google-calendar",
        req.nextUrl.origin
      );
      errorUrl.searchParams.set("error", "Missing authorization code or state");
      return NextResponse.redirect(errorUrl);
    }

    // Verify state to prevent CSRF attacks
    const cookies = req.cookies;
    const stateCookie = cookies.get("mml_google_calendar_state");

    console.log("State validation:", {
      hasStateCookie: !!stateCookie,
      cookieValue: stateCookie?.value?.substring(0, 10) + "...",
    });

    if (!stateCookie) {
      console.error("No state cookie found");
      const errorUrl = new URL(
        "/integrations/google-calendar",
        req.nextUrl.origin
      );
      errorUrl.searchParams.set("error", "Invalid state parameter");
      return NextResponse.redirect(errorUrl);
    }

    let statePayload;
    try {
      statePayload = JSON.parse(Buffer.from(state, "base64").toString());
      console.log("State payload parsed:", {
        nonce: statePayload.nonce?.substring(0, 10) + "...",
        returnTo: statePayload.returnTo,
      });
    } catch (parseError) {
      console.error("Failed to parse state:", parseError);
      const errorUrl = new URL(
        "/integrations/google-calendar",
        req.nextUrl.origin
      );
      errorUrl.searchParams.set("error", "Invalid state format");
      return NextResponse.redirect(errorUrl);
    }

    if (statePayload.nonce !== stateCookie.value) {
      console.error("State mismatch:", {
        expected: statePayload.nonce?.substring(0, 10) + "...",
        actual: stateCookie.value?.substring(0, 10) + "...",
      });
      const errorUrl = new URL(
        "/integrations/google-calendar",
        req.nextUrl.origin
      );
      errorUrl.searchParams.set("error", "State mismatch");
      return NextResponse.redirect(errorUrl);
    }

    console.log("State validation successful, proceeding with token exchange");

    // Exchange authorization code for access token
    const clientId = requiredEnv("GOOGLE_CLIENT_ID");
    const clientSecret = requiredEnv("GOOGLE_CLIENT_SECRET");
    const redirectUri =
      process.env.GOOGLE_CALENDAR_REDIRECT_URL ||
      new URL(
        "/api/integrations/google-calendar/callback",
        req.nextUrl.origin
      ).toString();

    console.log("Token exchange parameters:", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      redirectUri: redirectUri.substring(0, 50) + "...",
    });

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      const errorUrl = new URL(
        "/integrations/google-calendar",
        req.nextUrl.origin
      );
      errorUrl.searchParams.set(
        "error",
        "Failed to exchange authorization code for token"
      );
      return NextResponse.redirect(errorUrl);
    }

    const tokenData = await tokenResponse.json();
    console.log("Token exchange successful, token data received:", {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
    });

    // Save tokens to database
    console.log("Saving tokens to database for user:", session.user.id);
    try {
      await upsertGoogleCalendarTokens(session.user.id, tokenData);
      console.log("Tokens saved successfully");
    } catch (dbError) {
      console.error("Failed to save tokens to database:", dbError);
      const errorUrl = new URL(
        "/integrations/google-calendar",
        req.nextUrl.origin
      );
      errorUrl.searchParams.set(
        "error",
        "Failed to save authentication tokens"
      );
      return NextResponse.redirect(errorUrl);
    }

    // Redirect back to the integration page
    const returnTo = statePayload.returnTo || "/integrations/google-calendar";
    const successUrl = new URL(returnTo, req.nextUrl.origin);
    successUrl.searchParams.set(
      "success",
      "Google Calendar connected successfully"
    );

    console.log("Redirecting to success URL:", successUrl.toString());

    const response = NextResponse.redirect(successUrl);

    // Clear the state cookie
    response.cookies.delete("mml_google_calendar_state");

    return response;
  } catch (error) {
    console.error("Google Calendar callback error:", error);
    const errorUrl = new URL(
      "/integrations/google-calendar",
      req.nextUrl.origin
    );
    errorUrl.searchParams.set(
      "error",
      `Failed to complete Google Calendar connection: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    return NextResponse.redirect(errorUrl);
  }
}

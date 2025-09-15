import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("Google Tasks OAuth error:", error);
      return NextResponse.redirect(
        `${
          process.env.NEXT_PUBLIC_APP_URL
        }/integrations/google-tasks?error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations/google-tasks?error=No authorization code received`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-tasks/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations/google-tasks?error=Failed to exchange authorization code`
      );
    }

    const tokenData = await tokenResponse.json();
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Get user session
    const supabase = await getServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("User not authenticated:", userError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations/google-tasks?error=User not authenticated`
      );
    }

    // Store the token in database
    const { error: insertError } = await supabase
      .from("integration_tokens")
      .upsert({
        user_id: user.id,
        provider: "google-tasks",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        scope: tokenData.scope,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Failed to store Google Tasks token:", insertError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations/google-tasks?error=Failed to store authentication token`
      );
    }

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/integrations/google-tasks?success=true`
    );
  } catch (error) {
    console.error("Google Tasks OAuth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/integrations/google-tasks?error=An unexpected error occurred`
    );
  }
}

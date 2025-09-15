import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { upsertGoogleTasksTokens } from "@/lib/integrations/google-tasks";

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
        client_id:
          process.env.TASK_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID!,
        client_secret:
          process.env.TASK_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: (() => {
          if (process.env.GOOGLE_TASK_REDIRECT_URL) {
            return process.env.GOOGLE_TASK_REDIRECT_URL;
          } else if (process.env.NODE_ENV === "production") {
            return "https://www.mymetriclog.com/api/integrations/google-tasks/callback";
          } else {
            return `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-tasks/callback`;
          }
        })(),
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
    // Store the token in database using upsert function
    console.log(
      "🔐 [Google Tasks] Attempting to save token for user:",
      user.id
    );

    try {
      await upsertGoogleTasksTokens(user.id, tokenData);
      console.log("✅ [Google Tasks] Token saved successfully");
    } catch (dbError) {
      console.error("❌ [Google Tasks] Failed to save token:", dbError);
      return NextResponse.redirect(
        `${
          process.env.NEXT_PUBLIC_APP_URL
        }/integrations/google-tasks?error=Failed to store authentication token: ${
          dbError instanceof Error ? dbError.message : "Unknown error"
        }`
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

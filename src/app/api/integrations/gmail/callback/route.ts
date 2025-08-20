import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { upsertGmailTokens } from "@/lib/integrations/gmail";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const cookieState = req.cookies.get("mml_gmail_state")?.value;

    if (!code || !stateParam || !cookieState) {
      const errorUrl = new URL("/integrations/gmail", url.origin);
      errorUrl.searchParams.set("error", "Invalid callback parameters");
      return NextResponse.redirect(errorUrl);
    }

    let statePayload;
    try {
      statePayload = JSON.parse(Buffer.from(stateParam, "base64").toString());
    } catch {
      const errorUrl = new URL("/integrations/gmail", url.origin);
      errorUrl.searchParams.set("error", "Invalid state parameter");
      return NextResponse.redirect(errorUrl);
    }

    if (statePayload.nonce !== cookieState) {
      const errorUrl = new URL("/integrations/gmail", url.origin);
      errorUrl.searchParams.set("error", "State validation failed");
      return NextResponse.redirect(errorUrl);
    }

    const clientId = requiredEnv("GOOGLE_CLIENT_ID");
    const clientSecret = requiredEnv("GOOGLE_CLIENT_SECRET");
    const redirectUri =
      process.env.GOOGLE_GMAIL_REDIRECT_URL ||
      new URL("/api/integrations/gmail/callback", url.origin).toString();

    // Exchange authorization code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      cache: "no-store",
    });

    if (!tokenRes.ok) {
      console.error("Token exchange failed:", await tokenRes.text());
      const errorUrl = new URL("/integrations/gmail", url.origin);
      errorUrl.searchParams.set("error", "Token exchange failed");
      return NextResponse.redirect(errorUrl);
    }

    const tokenData = await tokenRes.json();
    const session = await getServerSession();

    if (!session) {
      const errorUrl = new URL("/integrations/gmail", url.origin);
      errorUrl.searchParams.set("error", "Not authenticated");
      return NextResponse.redirect(errorUrl);
    }

    // Store the tokens in the database
    await upsertGmailTokens(session.user.id, tokenData);

    const returnTo = statePayload.returnTo || "/integrations/gmail";
    const successUrl = new URL(returnTo, url.origin);
    successUrl.searchParams.set("success", "true");

    const res = NextResponse.redirect(successUrl);
    res.cookies.delete("mml_gmail_state");
    return res;
  } catch (error) {
    console.error("Gmail callback error:", error);
    const errorUrl = new URL("/integrations/gmail", req.nextUrl.origin);
    errorUrl.searchParams.set("error", "Callback processing failed");
    return NextResponse.redirect(errorUrl);
  }
}

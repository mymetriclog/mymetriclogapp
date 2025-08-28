import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { upsertSpotifyTokens } from "@/lib/integrations/spotify";

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
    const cookieState = req.cookies.get("mml_spotify_state")?.value;

    if (!code || !stateParam || !cookieState) {
      const errorUrl = new URL("/integrations/spotify", url.origin);
      errorUrl.searchParams.set("error", "Invalid callback parameters");
      return NextResponse.redirect(errorUrl);
    }

    let statePayload;
    try {
      statePayload = JSON.parse(Buffer.from(stateParam, "base64").toString());
    } catch {
      const errorUrl = new URL("/integrations/spotify", url.origin);
      errorUrl.searchParams.set("error", "Invalid state parameter");
      return NextResponse.redirect(errorUrl);
    }

    if (statePayload.nonce !== cookieState) {
      const errorUrl = new URL("/integrations/spotify", url.origin);
      errorUrl.searchParams.set("error", "State validation failed");
      return NextResponse.redirect(errorUrl);
    }

    const clientId = requiredEnv("SPOTIFY_CLIENT_ID");
    const clientSecret = requiredEnv("SPOTIFY_CLIENT_SECRET");
    const redirectUri =
      process.env.SPOTIFY_REDIRECT_URI ||
      new URL("/api/integrations/spotify/callback", url.origin).toString();

    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });

    if (!tokenRes.ok) {
      const errorUrl = new URL("/integrations/spotify", url.origin);
      errorUrl.searchParams.set("error", "Token exchange failed");
      return NextResponse.redirect(errorUrl);
    }

    const tokenData = await tokenRes.json();

    const session = await getServerSession();

    if (!session) {
      const errorUrl = new URL("/integrations/spotify", url.origin);
      errorUrl.searchParams.set("error", "Not authenticated");
      return NextResponse.redirect(errorUrl);
    }

    await upsertSpotifyTokens(session.user.id, tokenData);

    const returnTo = statePayload.returnTo || "/integrations/spotify";
    const successUrl = new URL(returnTo, url.origin);
    successUrl.searchParams.set("success", "true");

    const res = NextResponse.redirect(successUrl);
    res.cookies.delete("mml_spotify_state");
    return res;
  } catch (error) {
    const errorUrl = new URL("/integrations/spotify", req.nextUrl.origin);
    errorUrl.searchParams.set("error", "Callback processing failed");
    return NextResponse.redirect(errorUrl);
  }
}

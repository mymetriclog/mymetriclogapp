import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    const url = new URL(req.url);

    if (!session) {
      const login = new URL("/login", url.origin);
      login.searchParams.set("returnTo", "/integrations/gmail");
      return NextResponse.redirect(login);
    }

    const clientId = requiredEnv("GOOGLE_CLIENT_ID");
    const redirectUri =
      process.env.GOOGLE_GMAIL_REDIRECT_URL ||
      new URL("/api/integrations/gmail/callback", url.origin).toString();

    const returnTo = url.searchParams.get("returnTo") || "/integrations/gmail";

    // Gmail API scopes - Updated with correct permissions for reading emails
    const scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];

    const nonce = crypto.randomUUID();
    const statePayload = { nonce, returnTo };
    const state = Buffer.from(JSON.stringify(statePayload)).toString("base64");

    const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    auth.searchParams.set("response_type", "code");
    auth.searchParams.set("client_id", clientId);
    auth.searchParams.set("redirect_uri", redirectUri);
    auth.searchParams.set("scope", scopes.join(" "));
    auth.searchParams.set("state", state);
    auth.searchParams.set("access_type", "offline");
    auth.searchParams.set("prompt", "consent");

    const res = NextResponse.redirect(auth);
    res.cookies.set("mml_gmail_state", nonce, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
    });

    return res;
  } catch (error) {
    console.error("Gmail connect error:", error);
    const errorUrl = new URL("/integrations/gmail", req.nextUrl.origin);
    errorUrl.searchParams.set("error", "Failed to connect to Gmail");
    return NextResponse.redirect(errorUrl);
  }
}

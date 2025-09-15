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
      login.searchParams.set("returnTo", "/integrations");
      return NextResponse.redirect(login);
    }

    const clientId = requiredEnv("GOOGLE_CLIENT_ID");
    const redirectUri =
      process.env.GOOGLE_TASKS_REDIRECT_URI ||
      new URL("/api/integrations/google-tasks/callback", url.origin).toString();

    const returnTo = url.searchParams.get("returnTo") || "/integrations";

    const scopes = [
      "https://www.googleapis.com/auth/tasks",
      "https://www.googleapis.com/auth/tasks.readonly",
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
    res.cookies.set("mml_google_tasks_state", nonce, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
    });

    return res;
  } catch (error) {
    const errorUrl = new URL("/integrations", req.nextUrl.origin);
    errorUrl.searchParams.set("error", "Failed to connect to Google Tasks");
    return NextResponse.redirect(errorUrl);
  }
}

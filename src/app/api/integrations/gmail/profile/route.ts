import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { getGmailAccessToken, getGmailProfile } from "@/lib/integrations/gmail";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const accessToken = await getGmailAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Gmail not connected" },
        { status: 400 }
      );
    }

    const profile = await getGmailProfile(accessToken);
    if (!profile) {
      return NextResponse.json(
        { error: "Failed to fetch Gmail profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      email: profile.emailAddress,
      name: profile.emailAddress.split("@")[0], // Extract name from email
      totalEmails: profile.messagesTotal,
      unreadCount: 0, // Will be calculated separately
      lastSync: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching Gmail profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

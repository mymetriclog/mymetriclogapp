import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import {
  getGmailAccessToken,
  getGmailProfile,
  getGmailStats as getGmailStatsData,
  getGmailMessagesWithContent,
  getGmailMessages,
} from "@/lib/integrations/gmail";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get access token
    const accessToken = await getGmailAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json({ error: "No access token" }, { status: 400 });
    }

    // Fetch profile, stats, and emails
    const [profile, stats, emails] = await Promise.all([
      getGmailProfile(accessToken),
      getGmailStatsData(accessToken),
      getGmailMessagesWithContent(accessToken),
    ]);

    if (!profile || !stats) {
      return NextResponse.json(
        { error: "Failed to fetch Gmail data" },
        { status: 500 }
      );
    }

    const result = {
      account: {
        email: profile.emailAddress,
        name: profile.emailAddress.split("@")[0],
        totalEmails: profile.messagesTotal,
        unreadCount: stats.unreadCount,
        lastSync: new Date().toISOString(),
      },
      stats: stats,
      emails: emails || [], // Include actual emails
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

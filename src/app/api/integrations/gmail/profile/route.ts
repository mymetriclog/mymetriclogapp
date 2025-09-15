import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { GmailService } from "@/lib/integrations/gmail";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const gmailService = new GmailService();

    // Get Gmail data which will handle token validation internally
    const gmailData = await gmailService.getDailyData(
      session.user.id,
      new Date(),
      new Date()
    );

    if (!gmailData || !gmailData.profile) {
      return NextResponse.json(
        { error: "Gmail not connected or profile not available" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      email: gmailData.profile.emailAddress,
      name: gmailData.profile.emailAddress.split("@")[0], // Extract name from email
      totalEmails: gmailData.profile.messagesTotal,
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

import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import {
  getGoogleCalendarAccessToken,
  getGoogleCalendarProfile,
  getGoogleCalendarList,
} from "@/lib/integrations/google-calendar";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const accessToken = await getGoogleCalendarAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Google Calendar not connected" },
        { status: 403 }
      );
    }

    // Get primary calendar profile
    const profile = await getGoogleCalendarProfile(accessToken);
    if (!profile) {
      return NextResponse.json(
        { error: "Failed to fetch calendar profile" },
        { status: 500 }
      );
    }

    // Get list of all calendars
    const calendars = await getGoogleCalendarList(accessToken);

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        summary: profile.summary,
        description: profile.description,
        timeZone: profile.timeZone,
        primary: profile.primary,
      },
      calendars: calendars.map((cal) => ({
        id: cal.id,
        summary: cal.summary,
        description: cal.description,
        timeZone: cal.timeZone,
        primary: cal.primary,
      })),
      connectedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Google Calendar profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Google Calendar profile" },
      { status: 500 }
    );
  }
}

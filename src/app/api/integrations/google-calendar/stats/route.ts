import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import {
  getGoogleCalendarAccessToken,
  getGoogleCalendarStats,
  getGoogleCalendarEventsWithDetails,
  getGoogleCalendarUpcomingEvents,
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

    // Get calendar statistics
    const stats = await getGoogleCalendarStats(accessToken);
    if (!stats) {
      return NextResponse.json(
        { error: "Failed to fetch calendar statistics" },
        { status: 500 }
      );
    }

    // Get detailed events for the next 30 days
    const events = await getGoogleCalendarEventsWithDetails(
      accessToken,
      "primary",
      50
    );

    // Get upcoming events for the next 7 days
    const upcomingEvents = await getGoogleCalendarUpcomingEvents(
      accessToken,
      "primary",
      10
    );

    // Calculate additional metrics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const eventsToday = events.filter((event) => {
      const eventStart = new Date(event.start);
      return eventStart >= today && eventStart < todayEnd;
    });

    const eventsThisWeek = events.filter((event) => {
      const eventStart = new Date(event.start);
      const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return eventStart >= today && eventStart < weekEnd;
    });

    // Calculate busy hours (events between 9 AM and 6 PM)
    const busyHours = events.filter((event) => {
      if (event.isAllDay) return false;
      const eventStart = new Date(event.start);
      const hour = eventStart.getHours();
      return hour >= 9 && hour <= 18;
    }).length;

    // Calculate weekend events
    const weekendEvents = events.filter((event) => {
      const eventStart = new Date(event.start);
      const dayOfWeek = eventStart.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    }).length;

    const enhancedStats = {
      ...stats,
      eventsToday: eventsToday.length,
      eventsThisWeek: eventsThisWeek.length,
      busyHours,
      weekendEvents,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      stats: enhancedStats,
      events: events.slice(0, 20), // Return first 20 events
      upcomingEvents,
      totalEventsFetched: events.length,
    });
  } catch (error) {
    console.error("Google Calendar stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Google Calendar statistics" },
      { status: 500 }
    );
  }
}

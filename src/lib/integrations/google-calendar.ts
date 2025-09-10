import { getServerSupabaseClient } from "@/lib/supabase/server";

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
};

type GoogleCalendarProfile = {
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
  primary?: boolean;
};

type GoogleCalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  organizer?: {
    email: string;
    displayName?: string;
  };
  status: string;
  htmlLink: string;
  created: string;
  updated: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
};

type GoogleCalendarList = {
  items: GoogleCalendarProfile[];
};

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function upsertGoogleCalendarTokens(
  userId: string,
  tok: TokenResponse
) {
  try {
    console.log("upsertGoogleCalendarTokens called for user:", userId);

    const supabase = await getServerSupabaseClient();
    const now = Math.floor(Date.now() / 1000);
    const expires_at = now + (tok.expires_in ?? 3600) - 60;

    console.log("Token expiry calculation:", {
      now,
      expires_in: tok.expires_in,
      expires_at,
    });

    const { data: existing, error: selectError } = await supabase
      .from("integration_tokens")
      .select("refresh_token")
      .eq("user_id", userId)
      .eq("provider", "google-calendar")
      .maybeSingle();

    if (selectError) {
      console.error("Error selecting existing token:", selectError);
      throw selectError;
    }

    console.log("Existing token check:", {
      hasExisting: !!existing,
      hasRefreshToken: !!existing?.refresh_token,
    });

    const { error } = await supabase.from("integration_tokens").upsert(
      {
        user_id: userId,
        provider: "google-calendar",
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? existing?.refresh_token ?? null,
        scope: tok.scope ?? null,
        token_type: tok.token_type ?? "Bearer",
        expires_at,
      },
      { onConflict: "user_id,provider" }
    );

    if (error) {
      console.error("Error upserting token:", error);
      throw error;
    }

    console.log("Token upserted successfully");
  } catch (error) {
    console.error("upsertGoogleCalendarTokens failed:", error);
    throw error;
  }
}

export async function getGoogleCalendarAccessToken(
  userId: string
): Promise<string | null> {
  try {
    console.log("🔍 Getting Google Calendar access token for user:", userId);

    const { getServerSupabaseClientWithServiceRole } = await import(
      "@/lib/supabase/server"
    );
    const supabase = await getServerSupabaseClientWithServiceRole();

    const { data, error } = await supabase
      .from("integration_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", userId)
      .eq("provider", "google-calendar")
      .maybeSingle();

    if (error) {
      console.log("❌ Google Calendar token query error:", error);
      return null;
    }
    if (!data) {
      console.log("❌ No Google Calendar token data found for user:", userId);
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    if (data.expires_at && data.expires_at > now && data.access_token) {
      console.log("✅ Google Calendar token is valid and not expired");
      return data.access_token;
    }

    if (!data.refresh_token) {
      console.log("❌ No refresh token available for Google Calendar");
      return null;
    }

    const refreshed = await refreshGoogleCalendarToken(data.refresh_token);
    if (!refreshed) {
      console.log("❌ Failed to refresh Google Calendar token");
      return null;
    }

    await upsertGoogleCalendarTokens(userId, refreshed);
    return refreshed.access_token;
  } catch (error) {
    console.error("❌ Error in getGoogleCalendarAccessToken:", error);
    return null;
  }
}

export async function refreshGoogleCalendarToken(
  refreshToken: string
): Promise<TokenResponse | null> {
  const clientId = requiredEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requiredEnv("GOOGLE_CLIENT_SECRET");

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", refreshToken);
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!tokenRes.ok) return null;

  const tok = (await tokenRes.json()) as TokenResponse;
  return tok;
}

export async function getGoogleCalendarProfile(
  accessToken: string
): Promise<GoogleCalendarProfile | null> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const data: GoogleCalendarList = await response.json();
    if (data.items && data.items.length > 0) {
      return data.items[0];
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function getGoogleCalendarList(
  accessToken: string
): Promise<GoogleCalendarProfile[]> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) return [];

    const data: GoogleCalendarList = await response.json();
    return data.items || [];
  } catch (error) {
    return [];
  }
}

export async function getGoogleCalendarEvents(
  accessToken: string,
  calendarId: string = "primary",
  maxResults: number = 50,
  timeMin?: string,
  timeMax?: string
): Promise<GoogleCalendarEvent[]> {
  try {
    let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?maxResults=${maxResults}&singleEvents=true&orderBy=startTime`;

    if (timeMin) {
      url += `&timeMin=${encodeURIComponent(timeMin)}`;
    }
    if (timeMax) {
      url += `&timeMax=${encodeURIComponent(timeMax)}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    return [];
  }
}

export async function getGoogleCalendarEventsWithDetails(
  accessToken: string,
  calendarId: string = "primary",
  maxResults: number = 50
): Promise<
  Array<{
    id: string;
    summary: string;
    description: string;
    start: string;
    end: string;
    duration: string;
    attendees: string[];
    organizer: string;
    status: string;
    isAllDay: boolean;
    hasReminders: boolean;
    created: string;
    updated: string;
  }>
> {
  try {
    // Get events for the next 30 days
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    const timeMin = now.toISOString();
    const timeMax = thirtyDaysFromNow.toISOString();

    const events = await getGoogleCalendarEvents(
      accessToken,
      calendarId,
      maxResults,
      timeMin,
      timeMax
    );

    return events.map((event) => {
      const start = event.start.dateTime || event.start.date || "";
      const end = event.end.dateTime || event.end.date || "";

      // Calculate duration
      let duration = "";
      if (start && end) {
        if (event.start.dateTime && event.end.dateTime) {
          const startDate = new Date(start);
          const endDate = new Date(end);
          const diffMs = endDate.getTime() - startDate.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMinutes = Math.floor(
            (diffMs % (1000 * 60 * 60)) / (1000 * 60)
          );

          if (diffHours > 0) {
            duration = `${diffHours}h ${diffMinutes}m`;
          } else {
            duration = `${diffMinutes}m`;
          }
        } else {
          duration = "All day";
        }
      }

      const isAllDay = !event.start.dateTime;
      const hasReminders = !!(
        event.reminders?.overrides && event.reminders.overrides.length > 0
      );

      return {
        id: event.id,
        summary: event.summary || "No Title",
        description: event.description || "No description",
        start: start,
        end: end,
        duration: duration,
        attendees: event.attendees?.map((a) => a.displayName || a.email) || [],
        organizer:
          event.organizer?.displayName || event.organizer?.email || "Unknown",
        status: event.status,
        isAllDay,
        hasReminders,
        created: event.created,
        updated: event.updated,
      };
    });
  } catch (error) {
    return [];
  }
}

export async function getGoogleCalendarStats(accessToken: string, date?: Date) {
  try {
    const profile = await getGoogleCalendarProfile(accessToken);
    if (!profile) {
      return null;
    }

    // Get events for the specified date (or next 30 days if no date provided)
    const now = date || new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    const timeMin = now.toISOString();
    const timeMax = thirtyDaysFromNow.toISOString();

    const events = await getGoogleCalendarEvents(
      accessToken,
      "primary",
      1000, // Get more events for accurate stats
      timeMin,
      timeMax
    );

    // Calculate statistics
    const totalEvents = events.length;
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const eventsToday = events.filter((event) => {
      const eventStart = event.start.dateTime || event.start.date;
      if (!eventStart) return false;

      const eventDate = new Date(eventStart);
      return eventDate >= todayStart && eventDate < todayEnd;
    }).length;

    const upcomingEvents = events.filter((event) => {
      const eventStart = event.start.dateTime || event.start.date;
      if (!eventStart) return false;

      const eventDate = new Date(eventStart);
      return eventDate > now;
    }).length;

    const allDayEvents = events.filter((event) => !event.start.dateTime).length;
    const timedEvents = events.filter((event) => event.start.dateTime).length;

    // Calculate average events per day (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const eventsLast30Days = events.filter((event) => {
      const eventStart = event.start.dateTime || event.start.date;
      if (!eventStart) return false;

      const eventDate = new Date(eventStart);
      return eventDate >= thirtyDaysAgo;
    }).length;

    const avgEventsPerDay = Math.round((eventsLast30Days / 30) * 10) / 10;

    const stats = {
      totalEvents,
      eventsToday,
      upcomingEvents,
      allDayEvents,
      timedEvents,
      avgEventsPerDay,
      primaryCalendar: profile.summary,
      timeZone: profile.timeZone,
    };

    return stats;
  } catch (error) {
    return null;
  }
}

export async function getGoogleCalendarUpcomingEvents(
  accessToken: string,
  calendarId: string = "primary",
  maxResults: number = 10
): Promise<
  Array<{
    id: string;
    summary: string;
    start: string;
    end: string;
    duration: string;
    attendees: string[];
    isAllDay: boolean;
  }>
> {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const timeMin = now.toISOString();
    const timeMax = sevenDaysFromNow.toISOString();

    const events = await getGoogleCalendarEvents(
      accessToken,
      calendarId,
      maxResults,
      timeMin,
      timeMax
    );

    return events.map((event) => {
      const start = event.start.dateTime || event.start.date || "";
      const end = event.end.dateTime || event.end.date || "";

      // Calculate duration
      let duration = "";
      if (start && end) {
        if (event.start.dateTime && event.end.dateTime) {
          const startDate = new Date(start);
          const endDate = new Date(end);
          const diffMs = endDate.getTime() - startDate.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMinutes = Math.floor(
            (diffMs % (1000 * 60 * 60)) / (1000 * 60)
          );

          if (diffHours > 0) {
            duration = `${diffHours}h ${diffMinutes}m`;
          } else {
            duration = `${diffMinutes}m`;
          }
        } else {
          duration = "All day";
        }
      }

      return {
        id: event.id,
        summary: event.summary || "No Title",
        start: start,
        end: end,
        duration: duration,
        attendees: event.attendees?.map((a) => a.displayName || a.email) || [],
        isAllDay: !event.start.dateTime,
      };
    });
  } catch (error) {
    return [];
  }
}

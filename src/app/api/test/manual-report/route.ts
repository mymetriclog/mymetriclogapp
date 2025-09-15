import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      );
    }

    console.log(`🧪 Manual testing for user: ${userId}`);

    // Get access tokens
    const { getFitbitAccessToken } = await import("@/lib/integrations/fitbit");
    const { getGmailAccessToken } = await import("@/lib/integrations/gmail");
    const { getGoogleCalendarAccessToken } = await import(
      "@/lib/integrations/google-calendar"
    );
    const { getSpotifyAccessToken } = await import(
      "@/lib/integrations/spotify"
    );

    const [fitbitToken, gmailToken, calendarToken, spotifyToken] =
      await Promise.all([
        getFitbitAccessToken(userId),
        getGmailAccessToken(userId),
        getGoogleCalendarAccessToken(userId),
        getSpotifyAccessToken(userId),
      ]);

    console.log("🔍 Token Status:");
    console.log(`  Fitbit: ${fitbitToken ? "✅ Present" : "❌ Missing"}`);
    console.log(`  Gmail: ${gmailToken ? "✅ Present" : "❌ Missing"}`);
    console.log(`  Calendar: ${calendarToken ? "✅ Present" : "❌ Missing"}`);
    console.log(`  Spotify: ${spotifyToken ? "✅ Present" : "❌ Missing"}`);

    // Test each integration
    const results = {
      userId,
      timestamp: new Date().toISOString(),
      tokens: {
        fitbit: !!fitbitToken,
        gmail: !!gmailToken,
        calendar: !!calendarToken,
        spotify: !!spotifyToken,
      },
      data: {
        fitbit: null,
        gmail: null,
        calendar: null,
        spotify: null,
        weather: null,
      },
      errors: [],
    };

    // Test Fitbit
    if (fitbitToken) {
      try {
        const { getFitbitStats } = await import("@/lib/integrations/fitbit");
        const fitbitData = await getFitbitStats(fitbitToken);
        results.data.fitbit = {
          hasData: !!fitbitData,
          steps: fitbitData?.today?.steps || 0,
          sleep: fitbitData?.today?.sleep ? "Available" : "Not Available",
          heartRate: fitbitData?.today?.heartRate
            ? "Available"
            : "Not Available",
        };
        console.log("✅ Fitbit data:", results.data.fitbit);
      } catch (error) {
        results.errors.push(`Fitbit: ${error.message}`);
        console.error("❌ Fitbit error:", error);
      }
    } else {
      results.data.fitbit = { hasData: false, message: "No access token" };
    }

    // Test Gmail
    if (gmailToken) {
      try {
        const { getGmailStats } = await import("@/lib/integrations/gmail");
        const gmailData = await getGmailStats(gmailToken);
        results.data.gmail = {
          hasData: !!gmailData,
          totalEmails: gmailData?.totalEmails || 0,
          unreadCount: gmailData?.unreadCount || 0,
        };
        console.log("✅ Gmail data:", results.data.gmail);
      } catch (error) {
        results.errors.push(`Gmail: ${error.message}`);
        console.error("❌ Gmail error:", error);
      }
    } else {
      results.data.gmail = { hasData: false, message: "No access token" };
    }

    // Test Calendar
    if (calendarToken) {
      try {
        const { getGoogleCalendarStats, getGoogleCalendarEvents } =
          await import("@/lib/integrations/google-calendar");
        const calendarStats = await getGoogleCalendarStats(calendarToken);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const calendarEvents = await getGoogleCalendarEvents(
          calendarToken,
          "primary",
          10,
          yesterday.toISOString(),
          new Date(yesterday.getTime() + 24 * 60 * 60 * 1000).toISOString()
        );
        results.data.calendar = {
          hasData: !!calendarStats,
          totalEvents: calendarStats?.totalEvents || 0,
          eventsToday: calendarStats?.eventsToday || 0,
          events: calendarEvents?.length || 0,
        };
        console.log("✅ Calendar data:", results.data.calendar);
      } catch (error) {
        results.errors.push(`Calendar: ${error.message}`);
        console.error("❌ Calendar error:", error);
      }
    } else {
      results.data.calendar = { hasData: false, message: "No access token" };
    }

    // Test Spotify
    if (spotifyToken) {
      try {
        const { getSpotifyStats } = await import("@/lib/integrations/spotify");
        const spotifyData = await getSpotifyStats(spotifyToken);
        results.data.spotify = {
          hasData: !!spotifyData,
          tracks: spotifyData?.items?.length || 0,
          topGenre: spotifyData?.topGenre || "Unknown",
          mood: spotifyData?.mood || "Unknown",
        };
        console.log("✅ Spotify data:", results.data.spotify);
      } catch (error) {
        results.errors.push(`Spotify: ${error.message}`);
        console.error("❌ Spotify error:", error);
      }
    } else {
      results.data.spotify = { hasData: false, message: "No access token" };
    }

    // Test Weather
    try {
      const { WeatherService } = await import("@/lib/weather/weather-service");
      const weatherData = await WeatherService.getWeatherData(40.7128, -74.006);
      results.data.weather = {
        hasData: !!weatherData,
        temperature: weatherData?.current?.temp || "Unknown",
        description:
          weatherData?.current?.weather?.[0]?.description || "Unknown",
      };
      console.log("✅ Weather data:", results.data.weather);
    } catch (error) {
      results.errors.push(`Weather: ${error.message}`);
      console.error("❌ Weather error:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Manual integration test completed",
      results,
    });
  } catch (error) {
    console.error("❌ Manual test error:", error);
    return NextResponse.json(
      {
        error: "Manual test failed",
        details: error.message,
        success: false,
      },
      { status: 500 }
    );
  }
}

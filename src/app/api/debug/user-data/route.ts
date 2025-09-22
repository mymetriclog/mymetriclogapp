import { NextRequest, NextResponse } from "next/server";
import {
  getFitbitAccessToken,
  getFitbitStats,
} from "@/lib/integrations/fitbit";
import { getGmailAccessToken, getGmailStats } from "@/lib/integrations/gmail";
import {
  getGoogleCalendarAccessToken,
  getGoogleCalendarStats,
  getGoogleCalendarEvents,
} from "@/lib/integrations/google-calendar";
import {
  getSpotifyAccessToken,
  getSpotifyStats,
} from "@/lib/integrations/spotify";
import {
  getGoogleTasksAccessToken,
  getGoogleTasksStats,
} from "@/lib/integrations/google-tasks";

export async function GET(req: NextRequest) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const today = now;
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log(`🔍 Debugging user data for: ${userId}`);
    console.log(`📅 Today: ${today.toISOString().split("T")[0]}`);
    console.log(`📅 Yesterday: ${yesterday.toISOString().split("T")[0]}`);

    // Get access tokens
    const [
      fitbitToken,
      gmailToken,
      calendarToken,
      spotifyToken,
      googleTasksToken,
    ] = await Promise.all([
      getFitbitAccessToken(userId),
      getGmailAccessToken(userId),
      getGoogleCalendarAccessToken(userId),
      getSpotifyAccessToken(userId),
      getGoogleTasksAccessToken(userId),
    ]);

    console.log("🔑 Token status:", {
      fitbit: !!fitbitToken,
      gmail: !!gmailToken,
      calendar: !!calendarToken,
      spotify: !!spotifyToken,
      googleTasks: !!googleTasksToken,
    });

    // Get integration data
    const [
      fitbitData,
      gmailData,
      calendarStats,
      spotifyData,
      googleTasksStats,
    ] = await Promise.all([
      fitbitToken ? getFitbitStats(fitbitToken, today) : null,
      gmailToken ? getGmailStats(gmailToken, yesterday) : null,
      calendarToken ? getGoogleCalendarStats(calendarToken, yesterday) : null,
      spotifyToken ? getSpotifyStats(spotifyToken, yesterday) : null,
      googleTasksToken
        ? getGoogleTasksStats(googleTasksToken, yesterday)
        : null,
    ]);

    // Get calendar events
    const calendarEvents = calendarToken
      ? await getGoogleCalendarEvents(
          calendarToken,
          "primary",
          100,
          yesterday.toISOString(),
          new Date(yesterday.getTime() + 24 * 60 * 60 * 1000).toISOString()
        )
      : [];

    // Debug information
    const debugInfo = {
      userId,
      dateInfo: {
        today: today.toISOString().split("T")[0],
        yesterday: yesterday.toISOString().split("T")[0],
      },
      summary: {
        fitbit:
          "Uses TODAY's data (current day) - steps, calories, distance, sleep, heart rate",
        gmail:
          "Uses YESTERDAY's data - email count, unread count, response time",
        calendar:
          "Uses YESTERDAY's data - events, meeting duration, productivity",
        spotify:
          "Uses YESTERDAY's data - tracks played, mood, audio features, listening time",
        googleTasks:
          "Uses CURRENT data - completed tasks, pending tasks, productivity score",
      },
      tokens: {
        fitbit: !!fitbitToken,
        gmail: !!gmailToken,
        calendar: !!calendarToken,
        spotify: !!spotifyToken,
        googleTasks: !!googleTasksToken,
      },
      data: {
        fitbit: {
          hasData: !!fitbitData,
          completeData: fitbitData, // Complete FitbitStats object
          rawData: fitbitData
            ? {
                // Today's data (current day for Fitbit)
                today: {
                  steps: fitbitData.today?.steps,
                  calories: fitbitData.today?.calories,
                  distance: fitbitData.today?.distance,
                  activeMinutes: fitbitData.today?.activeMinutes,
                  heartRate: {
                    resting: fitbitData.today?.heartRate?.resting,
                    current: fitbitData.today?.heartRate?.current,
                  },
                  sleep: {
                    duration: fitbitData.today?.sleep?.duration,
                    efficiency: fitbitData.today?.sleep?.efficiency,
                    startTime: fitbitData.today?.sleep?.startTime,
                    endTime: fitbitData.today?.sleep?.endTime,
                    timeInBed: fitbitData.today?.sleep?.timeInBed,
                    stages: {
                      light: fitbitData.today?.sleep?.stages?.light,
                      deep: fitbitData.today?.sleep?.stages?.deep,
                      rem: fitbitData.today?.sleep?.stages?.rem,
                      wake: fitbitData.today?.sleep?.stages?.wake,
                    },
                  },
                },
                // Weekly data arrays
                weekly: fitbitData.weekly,
                // Goals
                goals: fitbitData.goals,
              }
            : null,
        },
        gmail: {
          hasData: !!gmailData,
          rawData: gmailData
            ? {
                totalEmails: gmailData.totalEmails,
                unreadCount: gmailData.unreadCount,
                emailsToday: gmailData.emailsToday,
                averageResponseTime: gmailData.averageResponseTime,
                calendarInvites: gmailData.calendarInvites,
              }
            : null,
        },
        calendar: {
          hasData: !!calendarStats,
          rawStats: calendarStats,
          events: {
            count: calendarEvents.length,
            details: calendarEvents.slice(0, 5).map((event) => ({
              id: event.id,
              summary: event.summary,
              start: event.start?.dateTime || event.start?.date,
              end: event.end?.dateTime || event.end?.date,
              attendees: event.attendees?.length || 0,
            })),
          },
        },
        spotify: {
          hasData: !!spotifyData,
          completeData: spotifyData, // Complete SpotifyStats object
          rawData: spotifyData
            ? {
                // Basic stats
                tracksPlayed: spotifyData.tracksPlayed,
                topGenre: spotifyData.topGenre,
                mood: spotifyData.mood,
                topArtists: spotifyData.topArtists,
                topTracks: spotifyData.topTracks,
                listeningTime: spotifyData.listeningTime,

                // Audio features (average values)
                audioFeatures: {
                  energy: spotifyData.audioFeatures?.energy,
                  valence: spotifyData.audioFeatures?.valence,
                  tempo: spotifyData.audioFeatures?.tempo,
                  danceability: spotifyData.audioFeatures?.danceability,
                },

                // Advanced audio analysis
                advancedFeatures: spotifyData.advancedFeatures,

                // Audio insights
                audioInsights: spotifyData.audioInsights,

                // Individual track analysis
                trackAnalysis: spotifyData.trackAnalysis,

                // Summary
                summary: spotifyData.summary,
              }
            : null,
        },
        googleTasks: {
          hasData: !!googleTasksStats,
          rawData: googleTasksStats
            ? {
                totalTasks: googleTasksStats.totalTasks,
                completedTasks: googleTasksStats.completedTasks,
                pendingTasks: googleTasksStats.pendingTasks,
                overdueTasks: googleTasksStats.overdueTasks,
                completionRate: googleTasksStats.completionRate,
                productivityScore: googleTasksStats.productivityScore,
                tasksByList: googleTasksStats.tasksByList,
                recentTasks: googleTasksStats.recentTasks?.slice(0, 5),
              }
            : null,
        },
      },
    };

    console.log("📊 Debug data summary:", {
      fitbit: debugInfo.data.fitbit.hasData,
      gmail: debugInfo.data.gmail.hasData,
      calendar: debugInfo.data.calendar.hasData,
      spotify: debugInfo.data.spotify.hasData,
      googleTasks: debugInfo.data.googleTasks.hasData,
    });

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error("❌ Debug error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

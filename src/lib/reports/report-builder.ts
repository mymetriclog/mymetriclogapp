import { AIReportData, AIInsight } from "../ai/report-generation";
import {
  WellnessScores,
  calculateWellnessScores,
} from "../scoring/wellness-scoring";

export interface ReportSection {
  title: string;
  stats: Record<string, any>;
  insights: string[];
}

export interface DailyReport {
  type: "daily";
  date: string;
  scores: WellnessScores;
  insight: string;
  mantra: string;
  moodInsight: string;
  sections: Record<string, ReportSection>;
  summary: {
    overallScore: number;
    highlights: string[];
    recommendations: string[];
  };
  connectedIntegrations: string[];
}

export interface WeeklyReport {
  type: "weekly";
  dateRange: string;
  stats: {
    avgScore: number;
    totalEmails: number;
    totalSteps: number;
    totalMeetings: number;
    avgSleep: string;
    avgRHR: number;
  };
  insight: string;
  recommendations: string[];
  trends: Record<string, string>;
  patterns: string[];
  sections: Record<string, ReportSection>;
  connectedIntegrations: string[];
}

/**
 * Build daily report with AI insights
 * Mirrors the logic from code.js generateDailyReport
 */
export async function buildDailyReport(
  gmailData: any,
  googleCalendarData: any,
  fitbitData: any,
  spotifyData: any,
  date: Date,
  connectedIntegrations: Record<string, string | null>,
  aiInsights: AIInsight,
  weatherInsights?: any
): Promise<DailyReport> {
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate scores using the scoring system
  const scores = calculateWellnessScores({
    gmailData,
    fitbitData,
    spotifyData,
  });

  // Build sections for connected integrations
  const sections: Record<string, ReportSection> = {};

  if (connectedIntegrations.gmail) {
    sections.gmail = buildGmailSection(gmailData);
  }
  if (connectedIntegrations["google-calendar"]) {
    sections["google-calendar"] =
      buildGoogleCalendarSection(googleCalendarData);
  }
  if (connectedIntegrations.fitbit) {
    sections.fitbit = buildFitbitSection(fitbitData);
  }
  if (connectedIntegrations.spotify) {
    sections.spotify = buildSpotifySection(spotifyData);
  }

  // Add weather section if available
  if (weatherInsights) {
    sections.weather = buildWeatherSection(weatherInsights);
  }

  // Build summary
  const summary = buildDailySummary(
    scores,
    gmailData,
    googleCalendarData,
    fitbitData,
    spotifyData
  );

  return {
    type: "daily",
    date: dateStr,
    scores,
    insight: aiInsights.insight,
    mantra: aiInsights.mantra,
    moodInsight: aiInsights.moodInsight,
    sections,
    summary,
    connectedIntegrations: Object.keys(connectedIntegrations).filter(
      (key) => connectedIntegrations[key]
    ),
  };
}

/**
 * Build weekly report with AI insights
 * Mirrors the logic from code.js generateWeeklyReport
 */
export async function buildWeeklyReport(
  gmailData: any,
  googleCalendarData: any,
  fitbitData: any,
  spotifyData: any,
  startDate: Date,
  endDate: Date,
  connectedIntegrations: Record<string, string | null>,
  aiInsights: AIInsight,
  weatherInsights?: any
): Promise<WeeklyReport> {
  const dateRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

  // Calculate weekly stats
  const weekStats = calculateWeeklyStats(
    gmailData,
    googleCalendarData,
    fitbitData,
    spotifyData
  );

  // Build sections for connected integrations
  const sections: Record<string, ReportSection> = {};

  if (connectedIntegrations.gmail) {
    sections.gmail = buildWeeklyGmailSection(gmailData);
  }
  if (connectedIntegrations["google-calendar"]) {
    sections["google-calendar"] =
      buildGoogleCalendarSection(googleCalendarData);
  }
  if (connectedIntegrations.fitbit) {
    sections.fitbit = buildWeeklyFitbitSection(fitbitData);
  }
  if (connectedIntegrations.spotify) {
    sections.spotify = buildWeeklySpotifySection(spotifyData);
  }

  return {
    type: "weekly",
    dateRange,
    stats: weekStats,
    insight: aiInsights.insight,
    recommendations: aiInsights.recommendations,
    trends: aiInsights.trends,
    patterns: aiInsights.patterns,
    sections,
    connectedIntegrations: Object.keys(connectedIntegrations).filter(
      (key) => connectedIntegrations[key]
    ),
  };
}

/**
 * Build weather section for reports
 */
function buildWeatherSection(weatherInsights: any): ReportSection {
  return {
    title: "Weather & Environmental Factors",
    stats: {
      "Weather Impact": weatherInsights.weatherImpact,
      "Temperature Analysis": weatherInsights.environmentalFactors.temperature,
      "Humidity Analysis": weatherInsights.environmentalFactors.humidity,
      "Wind Analysis": weatherInsights.environmentalFactors.wind,
      "UV Index": weatherInsights.environmentalFactors.uv,
      "Pressure Analysis": weatherInsights.environmentalFactors.pressure,
    },
    insights: [
      weatherInsights.moodInfluence,
      ...weatherInsights.recommendations,
      ...weatherInsights.activitySuggestions,
    ],
  };
}

/**
 * Build Gmail section for reports
 * Mirrors the logic from code.js generateGmailSection
 */
function buildGmailSection(gmailData: any): ReportSection {
  if (!gmailData?.stats) {
    return {
      title: "📧 Email Summary",
      stats: {
        total: 0,
        unread: 0,
        sent: 0,
        primary: 0,
      },
      insights: [
        "Gmail integration not connected or no data available",
        "Connect your Gmail account to see email insights",
        "Email management data will appear here",
      ],
    };
  }

  return {
    title: "📧 Email Summary",
    stats: {
      total: gmailData.stats.totalEmails || 0,
      unread: gmailData.stats.unreadCount || 0,
      sent: gmailData.stats.sent || 0,
      primary: gmailData.stats.primary || 0,
    },
    insights: [
      `Primary inbox: ${gmailData.stats.primary || 0} emails`,
      `Unread: ${gmailData.stats.unreadCount || 0} emails`,
      `Response rate: ${
        gmailData.stats.totalEmails > 0
          ? Math.round(
              ((gmailData.stats.totalEmails - gmailData.stats.unreadCount) /
                gmailData.stats.totalEmails) *
                100
            )
          : 0
      }%`,
    ],
  };
}

/**
 * Build Fitbit section for daily reports
 * Mirrors the logic from code.js generateFitbitSection
 */
function buildFitbitSection(fitbitData: any): ReportSection {
  if (!fitbitData?.stats?.today) {
    return {
      title: "🏃‍♂️ Fitness Summary",
      stats: {
        steps: 0,
        calories: 0,
        distance: 0,
        sleep: 0,
        restingHR: 0,
      },
      insights: [
        "Fitbit integration not connected or no data available",
        "Connect your Fitbit account to see fitness insights",
        "Daily activity data will appear here",
      ],
    };
  }

  const today = fitbitData.stats.today;

  return {
    title: "🏃‍♂️ Fitness Summary",
    stats: {
      steps: today.steps || 0,
      calories: today.calories || 0,
      distance: today.distance || 0,
      sleep: today.sleep?.duration || 0,
      restingHR: today.heartRate?.resting || 0,
    },
    insights: [
      `Steps: ${(today.steps || 0).toLocaleString()}`,
      `Calories burned: ${(today.calories || 0).toLocaleString()}`,
      `Sleep: ${Math.floor((today.sleep?.duration || 0) / 60)}h ${
        (today.sleep?.duration || 0) % 60
      }m`,
      `Resting HR: ${today.heartRate?.resting || 0} bpm`,
    ],
  };
}

/**
 * Build Spotify section for daily reports
 * Mirrors the logic from code.js generateSpotifySection
 */
function buildSpotifySection(spotifyData: any): ReportSection {
  if (!spotifyData?.stats) {
    return {
      title: "🎧 Music Summary",
      stats: {
        tracksPlayed: 0,
        topGenre: "Not Available",
        mood: "Not Available",
      },
      insights: [
        "Spotify integration not connected or no data available",
        "Connect your Spotify account to see music insights",
        "Recent listening data will appear here",
      ],
    };
  }

  return {
    title: "🎧 Music Summary",
    stats: {
      tracksPlayed: spotifyData.stats.tracksPlayed || 0,
      topGenre: spotifyData.stats.topGenre || "Unknown",
      mood: spotifyData.stats.mood || "Neutral",
    },
    insights: [
      `Tracks played: ${spotifyData.stats.tracksPlayed || 0}`,
      `Top genre: ${spotifyData.stats.topGenre || "Unknown"}`,
      `Mood: ${spotifyData.stats.mood || "Neutral"}`,
    ],
  };
}

/**
 * Build weekly Gmail section
 * Mirrors the logic from code.js generateWeeklyGmailSection
 */
function buildWeeklyGmailSection(gmailData: any): ReportSection {
  return buildGmailSection(gmailData); // Reuse daily for now
}

/**
 * Build weekly Fitbit section
 * Mirrors the logic from code.js generateWeeklyFitbitSection
 */
function buildWeeklyFitbitSection(fitbitData: any): ReportSection {
  return buildFitbitSection(fitbitData); // Reuse daily for now
}

/**
 * Build weekly Spotify section
 * Mirrors the logic from code.js generateWeeklySpotifySection
 */
function buildWeeklySpotifySection(spotifyData: any): ReportSection {
  return buildSpotifySection(spotifyData); // Reuse daily for now
}

/**
 * Build Google Calendar section for reports
 */
function buildGoogleCalendarSection(googleCalendarData: any): ReportSection {
  if (!googleCalendarData?.stats) {
    return {
      title: "📅 Calendar Summary",
      stats: {
        total: 0,
        today: 0,
        upcoming: 0,
        avgPerDay: 0,
      },
      insights: [
        "Google Calendar integration not connected or no data available",
        "Connect your Google Calendar to see schedule insights",
        "Calendar data will appear here",
      ],
    };
  }

  const stats = googleCalendarData.stats;
  const events = googleCalendarData.events || [];

  return {
    title: "📅 Calendar Summary",
    stats: {
      "Total Events": stats.totalEvents || 0,
      "Events Today": stats.eventsToday || 0,
      "Upcoming Events": stats.upcomingEvents || 0,
      "All Day Events": stats.allDayEvents || 0,
      "Timed Events": stats.timedEvents || 0,
      "Avg Per Day": stats.avgEventsPerDay || 0,
    },
    insights: [
      `Primary Calendar: ${stats.primaryCalendar || "Unknown"}`,
      `Time Zone: ${stats.timeZone || "Unknown"}`,
      `Next Event: ${events[0]?.summary || "No upcoming events"}`,
      `Busy Hours: ${stats.busyHours || "Not available"}`,
    ],
  };
}

/**
 * Build daily summary
 * Mirrors the logic from code.js generateDailySummary
 */
function buildDailySummary(
  scores: WellnessScores,
  gmailData: any,
  googleCalendarData: any,
  fitbitData: any,
  spotifyData: any
) {
  return {
    overallScore: scores.total,
    highlights: [
      `Sleep Score: ${scores.sleep}/100`,
      `Activity Score: ${scores.activity}/100`,
      `Heart Score: ${scores.heart}/100`,
      `Work Score: ${scores.work}/100`,
    ],
    recommendations: generateRecommendations(scores),
  };
}

/**
 * Generate recommendations based on scores
 * Mirrors the logic from code.js generateRecommendations
 */
function generateRecommendations(scores: WellnessScores): string[] {
  const recommendations = [];

  if (scores.sleep < 80) {
    recommendations.push("Prioritize 7-9 hours of quality sleep");
  }
  if (scores.activity < 80) {
    recommendations.push("Aim for 10,000 steps or 30 minutes of activity");
  }
  if (scores.heart < 80) {
    recommendations.push("Focus on stress management and recovery");
  }
  if (scores.work < 80) {
    recommendations.push("Improve email management and task completion");
  }

  return recommendations;
}

/**
 * Calculate weekly stats
 * Mirrors the logic from code.js calculateWeeklyStats
 */
function calculateWeeklyStats(
  gmailData: any,
  googleCalendarData: any,
  fitbitData: any,
  spotifyData: any
) {
  return {
    avgScore: 75, // This would be calculated from daily scores
    totalEmails: gmailData?.stats?.totalEmails || 0,
    totalSteps:
      fitbitData?.stats?.weekly?.steps?.reduce(
        (a: number, b: number) => a + b,
        0
      ) || 0,
    totalMeetings: googleCalendarData?.stats?.totalEvents || 0,
    avgSleep: "7h 30m",
    avgRHR: 65,
  };
}

import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import {
  getGmailAccessToken,
  getGmailProfile,
  getGmailStats,
} from "@/lib/integrations/gmail";
import {
  getGoogleCalendarAccessToken,
  getGoogleCalendarStats,
  getGoogleCalendarUpcomingEvents,
} from "@/lib/integrations/google-calendar";
import {
  getFitbitAccessToken,
  getFitbitProfile,
  getFitbitStats,
} from "@/lib/integrations/fitbit";
import {
  getSpotifyAccessToken,
  getSpotifyProfile,
  getSpotifyStats,
} from "@/lib/integrations/spotify";
import {
  generateDailyAIInsights,
  generateWeeklyAIInsights,
} from "@/lib/ai/report-generation";
import {
  buildDailyReport,
  buildWeeklyReport,
} from "@/lib/reports/report-builder";
import { WeatherService } from "@/lib/weather/weather-service";

// Function to save report to database
async function saveReportToDatabase(
  supabase: any,
  userId: string,
  reportType: string,
  reportDate: string,
  reportData: any,
  aiInsights: any,
  scores: any,
  htmlContent: string
) {
  try {
    console.log("💾 Saving report to database...");
    console.log("👤 User ID:", userId);
    console.log("📊 Report Type:", reportType);
    console.log("📅 Report Date:", reportDate);

    const { data, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        report_type: reportType,
        report_date: reportDate,
        report_data: reportData,
        ai_insights: aiInsights,
        scores: scores,
        html_content: htmlContent,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Database save error:", error);
      throw error;
    }

    console.log("✅ Report saved successfully!");
    console.log("🆔 Saved Report ID:", data.id);

    return data;
  } catch (error) {
    console.error("❌ Failed to save report to database:", error);
    throw error;
  }
}

// Function to generate HTML for daily reports with weather
function generateDailyReportHTML(report: any, weatherData?: any): string {
  const weatherSection = weatherData
    ? `
    <div class="section">
      <h3>🌤️ Weather & Environmental Factors</h3>
      <div class="weather-summary">
        <p><strong>Current:</strong> ${weatherData.summary.current}</p>
        <p><strong>Forecast:</strong> ${weatherData.summary.forecast}</p>
        <p><strong>Impact:</strong> ${weatherData.summary.impact}</p>
      </div>
      
      <div class="environmental-factors">
        <h4>Environmental Analysis:</h4>
        <ul>
          <li><strong>Temperature:</strong> ${
            weatherData.insights.environmentalFactors.temperature
          }</li>
          <li><strong>Humidity:</strong> ${
            weatherData.insights.environmentalFactors.humidity
          }</li>
          <li><strong>Wind:</strong> ${
            weatherData.insights.environmentalFactors.wind
          }</li>
          <li><strong>UV Index:</strong> ${
            weatherData.insights.environmentalFactors.uv
          }</li>
          <li><strong>Pressure:</strong> ${
            weatherData.insights.environmentalFactors.pressure
          }</li>
        </ul>
      </div>
      
      <div class="weather-recommendations">
        <h4>Weather-Based Recommendations:</h4>
        <ul>
          ${weatherData.insights.recommendations
            .map((rec: string) => `<li>${rec}</li>`)
            .join("")}
        </ul>
      </div>
      
      <div class="mood-influence">
        <h4>Mood & Weather:</h4>
        <p>${weatherData.insights.moodInfluence}</p>
      </div>
      
      <div class="activity-suggestions">
        <h4>Activity Suggestions:</h4>
        <ul>
          ${weatherData.insights.activitySuggestions
            .map((suggestion: string) => `<li>${suggestion}</li>`)
            .join("")}
        </ul>
      </div>
    </div>
  `
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Daily Report - ${report.date}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .score { font-size: 24px; font-weight: bold; color: #2563eb; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .insight { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .weather-summary { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .environmental-factors { background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .weather-recommendations { background: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .mood-influence { background: #fdf4ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .activity-suggestions { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Daily Wellness Report</h1>
        <p>${report.date}</p>
        <div class="score">Overall Score: ${report.scores.total}/100</div>
      </div>
      
      <div class="insight">
        <h3>AI Insight</h3>
        <p>${report.insight}</p>
        <p><strong>Mantra:</strong> ${report.mantra}</p>
        <p><strong>Mood:</strong> ${report.moodInsight}</p>
      </div>
      
      ${weatherSection}
      
      <div class="section">
        <h3>Summary</h3>
        <p>Overall Score: ${report.summary.overallScore}/100</p>
        <ul>
          ${report.summary.highlights
            .map((h: string) => `<li>${h}</li>`)
            .join("")}
        </ul>
      </div>
      
      ${Object.entries(report.sections)
        .map(
          ([key, section]: [string, any]) => `
        <div class="section">
          <h3>${section.title}</h3>
          <ul>
            ${Object.entries(section.stats)
              .map(
                ([k, v]: [string, any]) =>
                  `<li><strong>${k}:</strong> ${v}</li>`
              )
              .join("")}
          </ul>
        </div>
      `
        )
        .join("")}
    </body>
    </html>
  `;
}

// Function to generate HTML for weekly reports with weather
function generateWeeklyReportHTML(report: any, weatherData?: any): string {
  const weatherSection = weatherData
    ? `
    <div class="section">
      <h3>🌤️ Weekly Weather Summary</h3>
      <div class="weather-summary">
        <p><strong>Current Conditions:</strong> ${
          weatherData.summary.current
        }</p>
        <p><strong>Weekly Forecast:</strong> ${weatherData.summary.forecast}</p>
        <p><strong>Overall Impact:</strong> ${weatherData.summary.impact}</p>
      </div>
      
      <div class="weekly-weather-recommendations">
        <h4>Weekly Weather Recommendations:</h4>
        <ul>
          ${weatherData.insights.recommendations
            .map((rec: string) => `<li>${rec}</li>`)
            .join("")}
        </ul>
      </div>
    </div>
  `
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Weekly Report - ${report.dateRange}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .stats { font-size: 20px; color: #2563eb; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .insight { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .weather-summary { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .weekly-weather-recommendations { background: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Weekly Wellness Report</h1>
        <p>${report.dateRange}</p>
        <div class="stats">Average Score: ${report.stats.avgScore}/100</div>
      </div>
      
      <div class="insight">
        <h3>AI Insight</h3>
        <p>${report.insight}</p>
      </div>
      
      ${weatherSection}
      
      <div class="section">
        <h3>Recommendations</h3>
        <ul>
          ${report.recommendations.map((r: string) => `<li>${r}</li>`).join("")}
        </ul>
      </div>
      
      <div class="section">
        <h3>Trends</h3>
        <ul>
          ${Object.entries(report.trends)
            .map(
              ([k, v]: [string, any]) => `<li><strong>${k}:</strong> ${v}</li>`
            )
            .join("")}
        </ul>
      </div>
      
      ${Object.entries(report.sections)
        .map(
          ([key, section]: [string, any]) => `
        <div class="section">
          <h3>${section.title}</h3>
          <ul>
            ${Object.entries(section.stats)
              .map(
                ([k, v]: [string, any]) =>
                  `<li><strong>${k}:</strong> ${v}</li>`
              )
              .join("")}
          </ul>
        </div>
      `
        )
        .join("")}
    </body>
    </html>
  `;
}

/**
 * Main API endpoint for generating wellness reports
 * Mirrors the logic from code.js with AI-powered insights and weather integration
 */
export async function POST(req: NextRequest) {
  try {
    // const session = await getServerSession();
    // if (!session) {
    //   return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    // }

    // Read the request body only once and destructure all needed fields
    const { userId, userEmail, reportType, dateRange, latitude, longitude } =
      await req.json();
    console.log("👤 User ID:", userId);
    console.log("👤 User Email:", userEmail);

    // Initialize Supabase client
    const supabase = await getServerSupabaseClient();

    // Get current date and calculate date ranges
    const now = new Date();
    const today = new Date(); // Use today's date instead of yesterday
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const startDate =
      dateRange === "weekly"
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : today; // Use today for daily reports
    const endDate = today; // Use today as end date

    // Fetch weather data
    console.log("🌤️ Fetching weather data...");
    const weatherData = await WeatherService.getWeatherData(
      latitude || 40.7128,
      longitude || -74.006,
      today // Use today's date for weather data
    );

    let weatherInsights = null;
    if (weatherData) {
      console.log("✅ Weather data fetched successfully");
      weatherInsights = WeatherService.generateWeatherInsights(weatherData);
      console.log("📊 Weather insights generated");
    } else {
      console.log("⚠️ No weather data available");
    }

    // Fetch data from all integrations
    const [gmailData, googleCalendarData, fitbitData, spotifyData] =
      await Promise.all([
        fetchIntegrationData("gmail", userId),
        fetchIntegrationData("google-calendar", userId),
        fetchIntegrationData("fitbit", userId),
        fetchIntegrationData("spotify", userId),
      ]);

    // Filter out disconnected integrations
    const connectedIntegrations: Record<string, string | null> = {
      gmail: gmailData ? "gmail" : null,
      "google-calendar": googleCalendarData ? "google-calendar" : null,
      fitbit: fitbitData ? "fitbit" : null,
      spotify: spotifyData ? "spotify" : null,
    };

    // Check if any integrations are connected
    const connectedCount = Object.values(connectedIntegrations).filter(
      Boolean
    ).length;
    if (connectedCount === 0) {
      console.log(
        "❌ No working integrations found - all tokens may be expired or invalid"
      );
      return NextResponse.json(
        {
          error:
            "No working integrations found. Please reconnect your integrations as some tokens may have expired.",
        },
        { status: 400 }
      );
    }

    // Generate AI insights first
    let aiInsights;
    if (reportType === "daily") {
      aiInsights = await generateDailyAIInsights({
        scores: { total: 0, sleep: 0, activity: 0, heart: 0, work: 0 }, // Will be calculated by report builder
        gmailData,
        fitbitData,
        spotifyData,
        date: today.toISOString(), // Use today's date
        reportType: "daily",
        weatherData: weatherInsights, // Include weather insights
      });
    } else {
      aiInsights = await generateWeeklyAIInsights({
        scores: { total: 0, sleep: 0, activity: 0, heart: 0, work: 0 }, // Will be calculated by report builder
        gmailData,
        fitbitData,
        spotifyData,
        date: endDate.toISOString(),
        reportType: "weekly",
        weatherData: weatherInsights, // Include weather insights
      });
    }

    // Generate report based on type using modular system
    let report;
    if (reportType === "daily") {
      report = await buildDailyReport(
        gmailData,
        googleCalendarData,
        fitbitData,
        spotifyData,
        today, // Use today's date
        connectedIntegrations,
        aiInsights,
        weatherInsights // Pass weather insights
      );
    } else if (reportType === "weekly") {
      report = await buildWeeklyReport(
        gmailData,
        googleCalendarData,
        fitbitData,
        spotifyData,
        startDate,
        endDate,
        connectedIntegrations,
        aiInsights,
        weatherInsights // Pass weather insights
      );
    } else {
      return NextResponse.json(
        { error: "Invalid report type" },
        { status: 400 }
      );
    }

    // Generate HTML content for the report with weather
    let htmlContent = "";
    if (reportType === "daily") {
      htmlContent = generateDailyReportHTML(
        report,
        weatherInsights
          ? {
              summary: WeatherService.getWeatherSummary(weatherData!),
              insights: weatherInsights,
            }
          : null
      );
    } else {
      htmlContent = generateWeeklyReportHTML(
        report,
        weatherInsights
          ? {
              summary: WeatherService.getWeatherSummary(weatherData!),
              insights: weatherInsights,
            }
          : null
      );
    }

    // Save report to database
    let savedReport = null;
    try {
      // Extract scores based on report type
      const scores =
        reportType === "daily"
          ? (report as any).scores
          : {
              total: (report as any).stats.avgScore,
              sleep: 0,
              activity: 0,
              heart: 0,
              work: 0,
            };
      savedReport = await saveReportToDatabase(
        supabase,
        userId,
        reportType,
        new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
        {
          gmailData,
          googleCalendarData,
          fitbitData,
          spotifyData,
          weatherData: weatherInsights
            ? {
                summary: WeatherService.getWeatherSummary(weatherData!),
                insights: weatherInsights,
                hourlyForecast: WeatherService.getHourlyForecast(weatherData!),
              }
            : null,
          date:
            reportType === "daily"
              ? today.toISOString() // Use today's date
              : endDate.toISOString(),
          reportType,
        },
        aiInsights,
        scores,
        htmlContent
      );
      console.log("💾 Report saved to database with ID:", savedReport.id);
    } catch (saveError) {
      console.error("⚠️ Failed to save report to database:", saveError);
      // Continue with report generation even if save fails
    }

    return NextResponse.json({
      success: true,
      report: report,
      weatherData: weatherInsights
        ? {
            summary: WeatherService.getWeatherSummary(weatherData!),
            insights: weatherInsights,
            hourlyForecast: WeatherService.getHourlyForecast(weatherData!),
          }
        : null,
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: startDate.toISOString(),
        type: reportType,
      },
      connectedIntegrations: Object.keys(connectedIntegrations).filter(
        (key) => connectedIntegrations[key]
      ),
      message: `Report generated successfully using ${
        Object.keys(connectedIntegrations).filter(
          (key) => connectedIntegrations[key]
        ).length
      } connected integration(s)${weatherInsights ? " and weather data" : ""}`,
      savedReportId: savedReport?.id || null,
      savedToDatabase: !!savedReport,
    });
  } catch (error) {
    console.error("❌ Report generation error:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to generate report";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("API request failed")) {
        errorMessage =
          "Integration API request failed - some services may be unavailable";
        statusCode = 400;
      } else if (error.message.includes("database")) {
        errorMessage = "Database operation failed";
        statusCode = 500;
      } else if (error.message.includes("authentication")) {
        errorMessage = "Authentication failed";
        statusCode = 401;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }
}

/**
 * Fetch integration data for a specific provider
 * Mirrors the data fetching logic from code.js
 */
async function fetchIntegrationData(provider: string, userId: string) {
  try {
    switch (provider) {
      case "gmail":
        console.log(`🔍 Getting Gmail access token for user: ${userId}`);
        const gmailToken = await getGmailAccessToken(userId);
        if (!gmailToken) {
          console.log(
            `⚠️ No Gmail token available for user ${userId} - token may be expired or invalid`
          );
          return null;
        }
        try {
          const [gmailProfile, gmailStats] = await Promise.all([
            getGmailProfile(gmailToken),
            getGmailStats(gmailToken),
          ]);
          console.log(`✅ Successfully fetched Gmail data for user ${userId}`);
          return { profile: gmailProfile, stats: gmailStats };
        } catch (error) {
          console.error(
            `❌ Error fetching Gmail data for user ${userId}:`,
            error
          );
          return null;
        }

      case "google-calendar":
        console.log(
          `🔍 Getting Google Calendar access token for user: ${userId}`
        );
        const googleCalendarToken = await getGoogleCalendarAccessToken(userId);
        if (!googleCalendarToken) {
          console.log(
            `⚠️ No Google Calendar token available for user ${userId} - token may be expired or invalid`
          );
          return null;
        }
        try {
          const [googleCalendarStats, googleCalendarEvents] = await Promise.all(
            [
              getGoogleCalendarStats(googleCalendarToken),
              getGoogleCalendarUpcomingEvents(
                googleCalendarToken,
                "primary",
                10
              ),
            ]
          );
          console.log(
            `✅ Successfully fetched Google Calendar data for user ${userId}`
          );
          return { stats: googleCalendarStats, events: googleCalendarEvents };
        } catch (error) {
          console.error(
            `❌ Error fetching Google Calendar data for user ${userId}:`,
            error
          );
          return null;
        }

      case "fitbit":
        console.log(`🔍 Getting Fitbit access token for user: ${userId}`);
        const fitbitToken = await getFitbitAccessToken(userId);
        if (!fitbitToken) {
          console.log(
            `⚠️ No Fitbit token available for user ${userId} - token may be expired or invalid`
          );
          return null;
        }
        try {
          const [fitbitProfile, fitbitStats] = await Promise.all([
            getFitbitProfile(fitbitToken),
            getFitbitStats(fitbitToken),
          ]);
          console.log(`✅ Successfully fetched Fitbit data for user ${userId}`);
          return { profile: fitbitProfile, stats: fitbitStats };
        } catch (error) {
          console.error(
            `❌ Error fetching Fitbit data for user ${userId}:`,
            error
          );
          return null;
        }

      case "spotify":
        console.log(`🔍 Getting Spotify access token for user: ${userId}`);
        const spotifyToken = await getSpotifyAccessToken(userId);
        if (!spotifyToken) {
          console.log(
            `⚠️ No Spotify token available for user ${userId} - token may be expired or invalid`
          );
          return null;
        }
        try {
          const [spotifyProfile, spotifyStats] = await Promise.all([
            getSpotifyProfile(spotifyToken),
            getSpotifyStats(spotifyToken),
          ]);
          console.log(
            `✅ Successfully fetched Spotify data for user ${userId}`
          );
          return { profile: spotifyProfile, stats: spotifyStats };
        } catch (error) {
          console.error(
            `❌ Error fetching Spotify data for user ${userId}:`,
            error
          );
          return null;
        }

      default:
        return null;
    }
  } catch (error) {
    console.error(
      `❌ Error fetching ${provider} data for user ${userId}:`,
      error
    );
    return null;
  }
}

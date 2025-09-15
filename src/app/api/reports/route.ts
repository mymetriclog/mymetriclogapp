import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getServerSession } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await getServerSession();

    // For development/testing, allow access without authentication
    const isDevelopment = process.env.NODE_ENV === "development";
    if (!session?.user && !isDevelopment) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in again" },
        { status: 401 }
      );
    }

    const supabase = await getServerSupabaseClient();

    // Fetch all reports with user information from the database

    // Get current user's reports only

    // Get current user's reports
    const { data: reports, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", session?.user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Database error:", error);
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }

    // Transform the database data to match the expected format

    const transformedReports =
      reports?.map((report) => {
        // Since we're only getting current user's reports, use session data
        const userEmail = session?.user?.email || "Unknown";
        const userName =
          session?.user?.user_metadata?.full_name ||
          session?.user?.email?.split("@")[0] ||
          "Unknown User";

        // Extract comprehensive data from report_data
        const reportData = report.report_data || {};

        // Debug: Log the retrieved report data
        console.log("📊 Retrieved report data from database:", {
          reportId: report.id,
          reportDate: report.report_date,
          hasReportData: !!reportData,
          scores: reportData.scores,
          hasGptSummary: !!reportData.gpt_summary,
          hasMantra: !!reportData.mantra,
          hasWeatherSummary: !!reportData.weatherSummary,
          hasCalSummary: !!reportData.calSummary,
          hasEmailSummary: !!reportData.emailSummary,
          hasSpotifySummary: !!reportData.spotifySummary,
          hasFitbitActivity: !!reportData.fitbitActivity,
          hasFitbitSleep: !!reportData.fitbitSleep,
          hasFitbitHeart: !!reportData.fitbitHeart,
          hasBadges: !!reportData.badges,
          badgesLength: reportData.badges?.length || 0,
          hasStreakBadges: !!reportData.streakBadges,
          streakBadgesLength: reportData.streakBadges?.length || 0,
          hasAiMoodAndEnergy: !!reportData.aiMoodAndEnergy,
          hasBalanceLevel: !!reportData.balanceLevel,
          hasBalanceStatus: !!reportData.balanceStatus,
        });

        return {
          id: report.id,
          user_id: report.user_id,
          user_email: userEmail,
          user_name: userName,
          date: report.report_date,
          kind: report.report_type,
          score: getScoreFromReport(report),
          html: generateComprehensiveHTMLFromReportData(reportData),
          json: reportData, // Return the full report data instead of just report.report_data
          ai_insights: reportData.ai_insights || report.ai_insights,
          created_at: report.created_at,
          // Add comprehensive data fields for web display
          gpt_summary: reportData.gpt_summary,
          mantra: reportData.mantra,
          moodInsight: reportData.moodInsight,
          weatherSummary: reportData.weatherSummary,
          calSummary: reportData.calSummary,
          emailSummary: reportData.emailSummary,
          completedTasks: reportData.completedTasks,
          spotifySummary: reportData.spotifySummary,
          spotifyInsights: reportData.spotifyInsights,
          fitbitActivity: reportData.fitbitActivity,
          fitbitSleep: reportData.fitbitSleep,
          fitbitHeart: reportData.fitbitHeart,
          peakHR: reportData.peakHR,
          stressRadar: reportData.stressRadar,
          recoveryQuotient: reportData.recoveryQuotient,
          dayContext: reportData.dayContext,
          badges: reportData.badges,
          streakBadges: reportData.streakBadges,
          badgeNarrative: reportData.badgeNarrative,
          nearMisses: reportData.nearMisses,
          calendarAnalysis: reportData.calendarAnalysis,
          calendarIntelligence: reportData.calendarIntelligence,
          fitbitHRV: reportData.fitbitHRV,
          hourlyWeather: reportData.hourlyWeather,
          emailResponseAnalysis: reportData.emailResponseAnalysis,
          fitbitActivityLog: reportData.fitbitActivityLog,
          audioFeatures: reportData.audioFeatures,
          anomalies: reportData.anomalies,
          environmentalFactors: reportData.environmentalFactors,
          deepInsights: reportData.deepInsights,
          trends: reportData.trends,
          historicalData: reportData.historicalData,
          // Wellness Balance Data
          balanceLevel: reportData.balanceLevel,
          balanceStatus: reportData.balanceStatus,
          balanceColor: reportData.balanceColor,
          balanceInsight: reportData.balanceInsight,
          // AI Mood and Energy Forecast
          aiMoodAndEnergy: reportData.aiMoodAndEnergy,
        };
      }) || [];

    return NextResponse.json({ reports: transformedReports });
  } catch (error) {
    console.error("💥 Unexpected error in reports API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Function to get the actual score from the report data
function getScoreFromReport(report: any): number {
  // First, try to get score from the scores object (as shown in database)
  if (report.scores && typeof report.scores === "object") {
    if (report.scores.total && typeof report.scores.total === "number") {
      return report.scores.total;
    }
    if (report.scores.work && typeof report.scores.work === "number") {
      return report.scores.work;
    }
  }

  // If no scores object, try to get from report_data
  if (report.report_data && typeof report.report_data === "object") {
    if (
      report.report_data.scores &&
      typeof report.report_data.scores === "object"
    ) {
      if (
        report.report_data.scores.total &&
        typeof report.report_data.scores.total === "number"
      ) {
        return report.report_data.scores.total;
      }
      if (
        report.report_data.scores.work &&
        typeof report.report_data.scores.work === "number"
      ) {
        return report.report_data.scores.work;
      }
    }
  }

  // Fallback to calculated score only if no actual score found
  return calculateScoreFromReportData(report.report_data);
}

// Helper function to calculate a score from report data
function calculateScoreFromReportData(reportData: any): number {
  if (!reportData) return 0;

  let score = 0;
  let totalFactors = 0;

  // Check for sleep data
  if (reportData.sleep) {
    const sleepHours = reportData.sleep / 60; // Convert minutes to hours
    if (sleepHours >= 7 && sleepHours <= 9) score += 25;
    else if (sleepHours >= 6 && sleepHours <= 10) score += 20;
    else if (sleepHours >= 5 && sleepHours <= 11) score += 15;
    else score += 10;
    totalFactors++;
  }

  // Check for steps data
  if (reportData.steps) {
    if (reportData.steps >= 10000) score += 25;
    else if (reportData.steps >= 8000) score += 20;
    else if (reportData.steps >= 6000) score += 15;
    else if (reportData.steps >= 4000) score += 10;
    else score += 5;
    totalFactors++;
  }

  // Check for HRV data
  if (reportData.hrv) {
    if (reportData.hrv >= 60) score += 25;
    else if (reportData.hrv >= 50) score += 20;
    else if (reportData.hrv >= 40) score += 15;
    else score += 10;
    totalFactors++;
  }

  // Check for mood data
  if (reportData.mood) {
    const moodScores: { [key: string]: number } = {
      excellent: 25,
      great: 22,
      good: 20,
      positive: 18,
      neutral: 15,
      fair: 12,
      poor: 8,
      negative: 5,
    };
    score += moodScores[reportData.mood.toLowerCase()] || 15;
    totalFactors++;
  }

  // If no factors found, return a default score
  if (totalFactors === 0) return 75;

  // Return average score
  return Math.round(score / totalFactors);
}

// Helper function to generate comprehensive HTML from report data
function generateComprehensiveHTMLFromReportData(reportData: any): string {
  if (!reportData) return "<div>No data available</div>";

  let html = "<div>";

  // Add comprehensive wellness data
  if (
    reportData.fitbitSleep &&
    reportData.fitbitSleep !== "No sleep data available"
  ) {
    html += `<strong>Sleep:</strong> ${reportData.fitbitSleep} • `;
  }

  if (
    reportData.fitbitActivity &&
    reportData.fitbitActivity !== "No activity data available"
  ) {
    // Extract steps from activity data
    const stepsMatch = reportData.fitbitActivity.match(/👣 Steps: ([\d,]+)/);
    if (stepsMatch) {
      html += `<strong>Steps:</strong> ${stepsMatch[1]} • `;
    }
  }

  if (
    reportData.fitbitHeart &&
    reportData.fitbitHeart !== "No heart data available"
  ) {
    // Extract resting HR from heart data
    const rhrMatch = reportData.fitbitHeart.match(/❤️ Resting HR: (\d+)/);
    if (rhrMatch) {
      html += `<strong>Resting HR:</strong> ${rhrMatch[1]} bpm • `;
    }
  }

  // Add comprehensive scores if available
  if (reportData.scores) {
    html += `<strong>Overall Score:</strong> ${
      reportData.scores.total || 0
    }/100 • `;
    html += `<strong>Sleep:</strong> ${reportData.scores.sleep || 0}/100 • `;
    html += `<strong>Activity:</strong> ${
      reportData.scores.activity || 0
    }/100 • `;
    html += `<strong>Heart:</strong> ${reportData.scores.heart || 0}/100 • `;
    html += `<strong>Work:</strong> ${reportData.scores.work || 0}/100`;
  }

  // Add AI insights if available
  if (reportData.mantra) {
    html += `<br/><em>Daily Mantra:</em> "${reportData.mantra}"`;
  }

  if (reportData.gpt_summary) {
    html += `<br/><em>AI Summary:</em> ${reportData.gpt_summary.substring(
      0,
      200
    )}...`;
  }

  html += "</div>";
  return html;
}

// Legacy function for backward compatibility
function generateHTMLFromReportData(reportData: any, aiInsights: any): string {
  return generateComprehensiveHTMLFromReportData(reportData);
}

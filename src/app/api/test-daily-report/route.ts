import { NextResponse } from "next/server";
import { generateDailyReport } from "@/lib/reports/daily-report-generator";

export async function GET() {
  try {
    // Use a test user ID for development
    const testUserId = "test-user-123";

    console.log("🧪 Testing daily report generation...");

    const reportData = await generateDailyReport(testUserId);

    console.log("📊 Generated report data:", {
      date: reportData.date,
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
    });

    return NextResponse.json({
      success: true,
      message: "Daily report generated successfully",
      reportData: {
        date: reportData.date,
        scores: reportData.scores,
        gpt_summary: reportData.gpt_summary,
        mantra: reportData.mantra,
        weatherSummary: reportData.weatherSummary,
        calSummary: reportData.calSummary,
        emailSummary: reportData.emailSummary,
        spotifySummary: reportData.spotifySummary,
        fitbitActivity: reportData.fitbitActivity,
        fitbitSleep: reportData.fitbitSleep,
        fitbitHeart: reportData.fitbitHeart,
        badges: reportData.badges,
        aiMoodAndEnergy: reportData.aiMoodAndEnergy,
      },
    });
  } catch (error) {
    console.error("❌ Error testing daily report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate test daily report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

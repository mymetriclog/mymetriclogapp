import { NextResponse } from "next/server";
import { generateDailyReport } from "@/lib/reports/daily-report-generator";

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

    console.log(`🧪 Generating simple report for user: ${userId}`);

    // Generate the daily report
    const reportData = await generateDailyReport(userId);

    // Return the raw data for inspection
    return NextResponse.json({
      success: true,
      message: "Simple report generated",
      userId,
      timestamp: new Date().toISOString(),
      reportData: {
        // Basic info
        date: reportData.date,
        fullDateStr: reportData.fullDateStr,

        // Scores
        scores: reportData.scores,

        // AI Insights
        insight: reportData.insight,
        mantra: reportData.mantra,
        moodInsight: reportData.moodInsight,

        // Integration Data
        weatherSummary: reportData.weatherSummary,
        calSummary: reportData.calSummary,
        emailSummary: reportData.emailSummary,
        spotifySummary: reportData.spotifySummary,

        // Fitbit Data
        fitbitActivity: reportData.fitbitActivity,
        fitbitSleep: reportData.fitbitSleep,
        fitbitHeart: reportData.fitbitHeart,

        // Additional Data
        completedTasks: reportData.completedTasks,
        peakHR: reportData.peakHR,
      },
    });
  } catch (error) {
    console.error("❌ Simple report error:", error);
    return NextResponse.json(
      {
        error: "Simple report failed",
        details: error.message,
        success: false,
      },
      { status: 500 }
    );
  }
}

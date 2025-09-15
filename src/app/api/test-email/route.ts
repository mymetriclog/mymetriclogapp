import { NextResponse } from "next/server";
import { generateDailyReport } from "@/lib/reports/daily-report-generator";
import { generateDailyReportEmail } from "@/lib/sendgrid/templates/daily-email-template";

export async function GET() {
  try {
    // Use a test user ID for development
    const testUserId = "test-user-123";

    console.log("🧪 Testing email generation...");

    const reportData = await generateDailyReport(testUserId);
    const emailHTML = generateDailyReportEmail(reportData);

    console.log("📧 Generated email HTML length:", emailHTML.length);

    return NextResponse.json({
      success: true,
      message: "Email generated successfully",
      emailHTML: emailHTML,
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
    console.error("❌ Error testing email generation:", error);
    return NextResponse.json(
      {
        error: "Failed to generate test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

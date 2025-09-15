import { NextRequest, NextResponse } from "next/server";
import { DynamicReportGenerator } from "@/lib/reports/dynamic-report-generator";

export async function POST(request: NextRequest) {
  try {
    const { userEmail, userId } = await request.json();

    if (!userEmail || !userId) {
      return NextResponse.json(
        { error: "userEmail and userId are required" },
        { status: 400 }
      );
    }

    console.log(`🧪 [Test Email] Starting test email for ${userEmail}`);

    // Create test user data
    const userData = {
      userId: userId,
      userEmail: userEmail,
      userName: userEmail.split("@")[0],
      date: new Date().toISOString().split("T")[0],
      timezone: "UTC",
      latitude: 40.7128,
      longitude: -74.006,
    };

    // Generate report
    const reportGenerator = new DynamicReportGenerator();
    const report = await reportGenerator.generateDailyReport(userData);

    console.log(
      `✅ [Test Email] Test email generated successfully for ${userEmail}`
    );

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      reportId: report.id,
    });
  } catch (error) {
    console.error("❌ [Test Email] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { generateDailyReport } from "@/lib/reports/daily-report-generator";
import { generateEnhancedDailyReport } from "@/lib/reports/enhanced-report-generator";
import { generateEnhancedDailyEmailTemplate } from "@/lib/sendgrid/templates/enhanced-daily-email-template";
import { sendEmail } from "@/lib/sendgrid/email-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, userEmail, reportType, date } = body;

    // Check if this is a queue-based request (has userId) or user session request
    let targetUserId: string;
    let isQueueRequest = false;

    if (userId) {
      // Queue-based request
      targetUserId = userId;
      isQueueRequest = true;
      console.log(
        `🚀 Queue-based daily report generation for user: ${userId} (${userEmail})`
      );
    } else {
      // User session request
      const session = await getServerSession();
      if (!session?.user) {
        return NextResponse.json(
          { error: "Unauthorized - Please log in" },
          { status: 401 }
        );
      }
      targetUserId = session.user.id;
      console.log(
        "🚀 User session daily report generation for user:",
        targetUserId
      );
    }

    const reportDate = date ? new Date(date) : undefined;

    // Generate the daily report (legacy)
    const reportData = await generateDailyReport(targetUserId, reportDate);

    // Generate enhanced report with all new features
    const enhancedReportData = await generateEnhancedDailyReport(
      reportData.fitbitSleep || "",
      reportData.fitbitActivity || "",
      reportData.fitbitHeart || "",
      reportData.fitbitHRV,
      { emails: [], totalEmails: 0, sentEmails: 0 }, // gmailData structure
      { events: [] }, // calendarData structure
      {
        stats: reportData.spotifySummary
          ? { summary: reportData.spotifySummary }
          : {},
      }, // spotifyData structure
      { summary: reportData.weatherSummary }, // weatherData structure
      reportData.completedTasks || "",
      reportDate || new Date()
    );

    // Generate enhanced email HTML
    const emailHTML = generateEnhancedDailyEmailTemplate(enhancedReportData);

    // Send email (only for user session requests, queue requests handle email separately)
    if (!isQueueRequest) {
      const session = await getServerSession();
      const { EmailLogger } = await import("@/lib/email-logging/email-logger");

      // Log email before sending
      const logData = {
        user_id: targetUserId,
        recipient_email: session?.user?.email!,
        sender_email:
          process.env.SENDER_VERIFICATION_EMAIL || "asad@devstitch.com",
        email_type: "daily_report" as const,
        subject: `Your Daily MyMetricLog Report - ${reportData.fullDateStr}`,
        status: "pending" as const,
        report_date: reportData.fullDateStr,
        report_type: "daily" as const,
      };

      const logResult = await EmailLogger.logEmail(logData);
      let logId: string | null = null;

      if (logResult.success) {
        logId = logResult.logId;
        console.log(`📝 Email logged with ID: ${logId}`);
      } else {
        console.warn(`⚠️ Failed to log email: ${logResult.error}`);
      }

      try {
        const result = await sendEmail(
          session?.user?.email!,
          `Your Daily MyMetricLog Report - ${reportData.fullDateStr}`,
          emailHTML
        );

        // Update email log with success
        if (logId) {
          await EmailLogger.updateEmailStatus(logId, "sent");
          if (result.messageId) {
            await EmailLogger.updateEmailMessageId(logId, result.messageId);
          }
        }
      } catch (emailError) {
        // Update email log with failure
        if (logId) {
          await EmailLogger.updateEmailStatus(
            logId,
            "failed",
            emailError instanceof Error ? emailError.message : "Unknown error"
          );
        }
        throw emailError;
      }
    }

    return NextResponse.json({
      success: true,
      message: isQueueRequest
        ? "Daily report generated successfully"
        : "Daily report generated and sent successfully",
      reportData: enhancedReportData,
      legacyReportData: reportData,
    });
  } catch (error) {
    console.error("❌ Error generating daily report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate daily report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    console.log("🚀 Generating daily report for user:", session.user.id);

    // Generate the daily report (legacy)
    const reportData = await generateDailyReport(session.user.id);

    // Generate enhanced report with all new features
    const enhancedReportData = await generateEnhancedDailyReport(
      reportData.fitbitSleep || "",
      reportData.fitbitActivity || "",
      reportData.fitbitHeart || "",
      reportData.fitbitHRV,
      { emails: [], totalEmails: 0, sentEmails: 0 }, // gmailData structure
      { events: [] }, // calendarData structure
      {
        stats: reportData.spotifySummary
          ? { summary: reportData.spotifySummary }
          : {},
      }, // spotifyData structure
      { summary: reportData.weatherSummary }, // weatherData structure
      reportData.completedTasks || "",
      new Date()
    );

    // Generate enhanced email HTML
    const emailHTML = generateEnhancedDailyEmailTemplate(enhancedReportData);

    // Send email
    await sendEmail(
      session.user.email!,
      `Your Daily MyMetricLog Report - ${reportData.fullDateStr}`,
      emailHTML
    );

    return NextResponse.json({
      success: true,
      message: "Daily report generated and sent successfully",
      reportData: enhancedReportData,
      legacyReportData: reportData,
    });
  } catch (error) {
    console.error("❌ Error generating daily report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate daily report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

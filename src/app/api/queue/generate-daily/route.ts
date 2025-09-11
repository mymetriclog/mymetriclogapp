import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { generateDailyReport } from "@/lib/reports/daily-report-generator";
import { generateDailyReportEmail } from "@/lib/sendgrid/templates/daily-email-template";
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

    const reportData = await generateDailyReport(targetUserId, reportDate);

    // Generate email HTML using the correct template
    const emailHTML = generateDailyReportEmail(reportData);

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
        subject: `🦊 MyMetricLog Daily Report: ${
          reportData.fullDateStr ||
          new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        }`,
        status: "pending" as const,
        report_date: reportData.fullDateStr,
        report_type: "daily" as const,
      };

      const logResult = await EmailLogger.logEmail(logData);
      let logId: string | null = null;

      if (logResult.success) {
        logId = logResult.logId;
      } else {
        console.warn(`⚠️ Failed to log email: ${logResult.error}`);
      }

      try {
        // Add CC for specific user
        const ccEmails =
          session?.user?.email === "josh987@gmail.com" ? [""] : undefined;

        const result = await sendEmail(
          session?.user?.email!,
          `🦊 MyMetricLog Daily Report: ${
            reportData.fullDateStr ||
            new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          }`,
          emailHTML,
          undefined,
          ccEmails
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
      reportData: reportData,
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

    // Generate email HTML using the correct template
    const emailHTML = generateDailyReportEmail(reportData);

    // Add CC for specific user
    const ccEmails =
      session.user.email === "josh987@gmail.com" ? [""] : undefined;

    // Send email
    await sendEmail(
      session.user.email!,
      `🦊 MyMetricLog Daily Report: ${
        reportData.fullDateStr ||
        new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      }`,
      emailHTML,
      undefined,
      ccEmails
    );

    return NextResponse.json({
      success: true,
      message: "Daily report generated and sent successfully",
      // Return the original reportData so consumers get gpt_summary and the exact structure
      reportData: reportData,
      // legacyReportData: enhancedReportData,
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

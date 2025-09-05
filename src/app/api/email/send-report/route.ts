import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/sendgrid/email-service";
import { EmailLogger } from "@/lib/email-logging/email-logger";
import { getServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

async function getDailyReportData(userId: string, date: string) {
  const supabase = await getServerSupabaseClientWithServiceRole();

  const { data, error } = await supabase
    .from("reports")
    .select("report_data, scores")
    .eq("user_id", userId)
    .eq("report_date", date)
    .eq("report_type", "daily")
    .single();

  if (error || !data) return null;
  return data;
}

async function getWeeklyReportData(userId: string, dateRange: string) {
  const supabase = await getServerSupabaseClientWithServiceRole();

  // For weekly reports, we need to find the most recent weekly report
  const { data, error } = await supabase
    .from("reports")
    .select("report_data, scores")
    .eq("user_id", userId)
    .eq("report_type", "weekly")
    .order("report_date", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

export async function POST(request: NextRequest) {
  try {
    const { type, to, userId, date, subject, dateRange } = await request.json();

    console.log("🔍Today date From API: ", date);

    // Validation
    if (!to || !type || !userId || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) ||
      !["daily", "weekly"].includes(type)
    ) {
      return NextResponse.json(
        { error: "Invalid email or report type" },
        { status: 400 }
      );
    }

    // Log email attempt
    const logData = {
      user_id: userId,
      recipient_email: to,
      sender_email:
        process.env.SENDER_VERIFICATION_EMAIL || "asad@devstitch.com",
      email_type: (type === "daily" ? "daily_report" : "weekly_report") as
        | "daily_report"
        | "weekly_report",
      subject:
        subject ||
        `${type === "daily" ? "Daily" : "Weekly"} Wellness Report - ${date}`,
      status: "pending" as const,
      report_date: date,
      report_type: type as "daily" | "weekly",
      metadata: {
        type,
        date,
        userId,
        dateRange: type === "weekly" ? dateRange : undefined,
      },
    };

    // Insert initial log
    const logResult = await EmailLogger.logEmail(logData);
    if (!logResult.success) {
      console.error("Failed to log email:", logResult.error);
    }

    const reportData =
      type === "daily"
        ? await getDailyReportData(userId, date)
        : await getWeeklyReportData(userId, dateRange || date);

    // console.log("🔍 Report data:", reportData);
    if (!reportData) {
      // Update log status to failed
      if (logResult.success) {
        await EmailLogger.updateEmailStatus(
          logResult.logId!,
          "failed",
          "Report data not found"
        );
      }

      return NextResponse.json(
        { error: "Report data not found" },
        { status: 500 }
      );
    }

    // Process data
    const fitbit = reportData.report_data?.fitbitData?.stats?.today || {};
    const gmail = reportData.report_data?.gmailData?.stats || {};

    const processedData = {
      date: new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      score: reportData.scores?.total || 0,
      quality: "FAIR",
      sleep: fitbit.sleep?.duration || "0h 0m",
      steps: fitbit.steps || 0,
      calories: fitbit.calories || 0,
      activeMinutes: fitbit.activeMinutes || 0,
      heartRate: fitbit.heartRate?.current || 0,
      emailStats: {
        total: gmail.totalEmails || 0,
        unread: gmail.unreadCount || 0,
        sent: (gmail.totalEmails || 0) - (gmail.unreadCount || 0),
        primary: gmail.totalEmails || 0,
      },
      fitnessStats: {
        steps: fitbit.steps || 0,
        calories: fitbit.calories || 0,
        distance: fitbit.distance || 0,
        sleep: fitbit.sleep?.duration || "0h 0m",
        restingHR: fitbit.heartRate?.resting || 0,
      },
      insights: ["Keep pushing forward with your wellness goals."],
    };

    const result = await EmailService.sendDailyReport(
      to,
      processedData,
      subject
    );

    if (result.success && result.messageId) {
      // Update log with success status
      await EmailLogger.updateEmailStatus(logResult.logId!, "sent");

      // Update log with message ID
      await EmailLogger.updateEmailMessageId(
        logResult.logId!,
        result.messageId
      );
    } else {
      // Update log with failure status
      await EmailLogger.updateEmailStatus(
        logResult.logId!,
        "failed",
        result.error || "Unknown error"
      );
    }

    return NextResponse.json(
      result.success
        ? {
            success: true,
            message: result.message,
            messageId: result.messageId,
            logId: logResult.logId,
          }
        : { success: false, error: result.error },
      { status: result.success ? 200 : 500 }
    );
  } catch (error) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/sendgrid/email-service";
import { EmailLogger } from "@/lib/email-logging/email-logger";
import { getServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

async function getDailyReportData(userId: string, date: string) {
  const supabase = await getServerSupabaseClientWithServiceRole();

  const { data, error } = await supabase
    .from("reports")
    .select("report_data, scores, report_date, created_at")
    .eq("user_id", userId)
    .eq("report_date", date)
    .eq("report_type", "daily")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

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
  let to = "Unknown";
  try {
    const {
      type,
      to: emailTo,
      userId,
      date,
      subject,
      dateRange,
    } = await request.json();
    to = emailTo;

    console.log(`\n📧 ===== EMAIL SENDING REQUEST =====`);
    console.log(`📧 To: ${to}`);
    console.log(`📧 Type: ${type}`);
    console.log(`📧 User ID: ${userId}`);
    console.log(`📧 Date: ${date}`);
    console.log(`📧 Subject: ${subject || "Auto-generated"}`);

    // Validation
    if (!to || !type || !userId || !date) {
      console.log(`❌ Email validation failed - missing required fields`);
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) ||
      !["daily", "weekly"].includes(type)
    ) {
      console.log(
        `❌ Email validation failed - invalid email format or report type`
      );
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
    console.log(`📝 Logging email attempt to database...`);
    const logResult = await EmailLogger.logEmail(logData);
    if (!logResult.success) {
      console.error("❌ Failed to log email:", logResult.error);
    } else {
      console.log(`✅ Email logged to database with ID: ${logResult.logId}`);
    }

    console.log(`🔍 Fetching ${type} report data for user ${userId}...`);
    const reportData =
      type === "daily"
        ? await getDailyReportData(userId, date)
        : await getWeeklyReportData(userId, dateRange || date);

    if (!reportData) {
      console.log(`❌ No report data found for user ${userId} on ${date}`);
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
    console.log(`✅ Report data found for user ${userId}`);

    // Process data
    const fitbit = reportData.report_data?.fitbitData?.stats?.today || {};
    const gmail = reportData.report_data?.gmailData?.stats || {};
    const weather = reportData.report_data?.weatherData || {};

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
      weatherStats: {
        current: weather.summary?.current || "N/A",
        forecast: weather.summary?.forecast || "N/A",
        impact: weather.summary?.impact || "Weather data not available",
        temperature:
          weather.insights?.environmentalFactors?.temperature || "N/A",
        humidity: weather.insights?.environmentalFactors?.humidity || "N/A",
        wind: weather.insights?.environmentalFactors?.wind || "N/A",
        uv: weather.insights?.environmentalFactors?.uv || "N/A",
        pressure: weather.insights?.environmentalFactors?.pressure || "N/A",
        recommendations: weather.insights?.recommendations || [],
        moodInfluence:
          weather.insights?.moodInfluence || "Weather data not available",
        activitySuggestions: weather.insights?.activitySuggestions || [],
        hourlyForecast: weather.hourlyForecast || [],
      },
      insights: ["Keep pushing forward with your wellness goals."],
    };

    // Add CC for specific user
    const ccEmails = to === "josh987@gmail.com" ? [""] : undefined;

    console.log(`📤 Sending email to ${to} via SendGrid...`);
    const result = await EmailService.sendDailyReport(
      to,
      processedData,
      subject,
      ccEmails
    );

    if (result.success && result.messageId) {
      console.log(`✅ Email sent successfully to ${to}`);
      console.log(`📧 Message ID: ${result.messageId}`);
      // Update log with success status
      await EmailLogger.updateEmailStatus(logResult.logId!, "sent");

      // Update log with message ID
      await EmailLogger.updateEmailMessageId(
        logResult.logId!,
        result.messageId
      );
    } else {
      console.log(`❌ Email sending failed to ${to}`);
      console.log(`🚨 Error: ${result.error || "Unknown error"}`);
      // Update log with failure status
      await EmailLogger.updateEmailStatus(
        logResult.logId!,
        "failed",
        result.error || "Unknown error"
      );
    }

    console.log(`📧 ===== EMAIL REQUEST COMPLETED =====`);
    console.log(`📧 Status: ${result.success ? "SUCCESS" : "FAILED"}`);
    console.log(`📧 To: ${to}`);
    console.log(`📧 Message ID: ${result.messageId || "N/A"}`);

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
    console.error(`❌ ===== EMAIL API ERROR =====`);
    console.error(`🚨 Error:`, error);
    console.error(`📧 To: ${to}`);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

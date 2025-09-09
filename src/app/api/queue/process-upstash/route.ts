import { NextRequest, NextResponse } from "next/server";
import { TokenRefreshService } from "@/lib/integrations/token-refresh-service";
import { Receiver } from "@upstash/qstash";

// Simple in-memory cache to prevent duplicate job processing
const processedJobs = new Set<string>();

// Process user report job from Upstash QStash
export async function POST(request: NextRequest) {
  let jobData: any = null; // Declare outside try block
  try {
    // Verify webhook signature for security
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
    });

    const body = await request.text();
    const signature = request.headers.get("upstash-signature");

    if (signature) {
      const isValid = await receiver.verify({
        signature,
        body,
      });

      if (!isValid) {
        console.error("❌ Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    jobData = JSON.parse(body);
    const { userId, userEmail, reportType = "daily", jobId } = jobData;

    // Check if this job has already been processed
    if (processedJobs.has(jobId)) {
      console.log(`⚠️ Job ${jobId} already processed, skipping duplicate`);
      return NextResponse.json({
        status: "skipped",
        reason: "Job already processed",
        jobId,
        userEmail,
      });
    }

    // Mark job as being processed
    processedJobs.add(jobId);

    console.log(
      `\n🚀 Processing ${reportType} report for ${userEmail} (Job ${jobId})`
    );

    // Step 1: Check if user still has integrations and refresh tokens
    const hasIntegrations = await checkUserIntegrations(userId, userEmail);

    if (!hasIntegrations) {
      console.log(`⏭️ Skipping ${userEmail} - no integrations`);
      return NextResponse.json({
        status: "skipped",
        reason: "No integrations found",
        jobId,
        userEmail,
      });
    }

    // Step 2: Generate report using the API endpoint
    const reportResult = await generateUserReport(
      userId,
      userEmail,
      reportType
    );

    // Step 3: Send email to user
    await sendEmailToUser(userEmail, reportResult, reportType, userId);

    console.log(`✅ Completed ${reportType} report for ${userEmail}`);

    return NextResponse.json({
      status: "completed",
      reportId: reportResult.reportId,
      message: "Report generated and email sent successfully",
      jobId,
      userEmail,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(
      `❌ Failed ${jobData?.reportType || "unknown"} report for ${
        jobData?.userEmail || "unknown"
      }: ${errorMessage}`
    );

    // Return error response - QStash will handle retries based on configuration
    return NextResponse.json(
      {
        status: "failed",
        error: errorMessage,
        jobId: jobData?.jobId,
        userEmail: jobData?.userEmail,
      },
      { status: 500 }
    );
  }
}

// Check if user has working integrations and refresh expired tokens
async function checkUserIntegrations(
  userId: string,
  userEmail?: string
): Promise<boolean> {
  try {
    const userIdentifier = userEmail || userId;
    console.log(`🔍 Checking integrations for user: ${userIdentifier}`);

    const { getServerSupabaseClientWithServiceRole } = await import(
      "@/lib/supabase/server"
    );
    const supabase = await getServerSupabaseClientWithServiceRole();

    // Get integration tokens from database
    const { data, error } = await supabase
      .from("integration_tokens")
      .select("id, provider, access_token, refresh_token, expires_at")
      .eq("user_id", userId);

    if (error) {
      console.error(`❌ Error checking user integrations:`, error);
      return false;
    }

    if (!data || data.length === 0) {
      console.log("❌ No integration records found for user");
      return false;
    }

    console.log(
      `📊 Found ${data.length} integration records for user ${userIdentifier}`
    );
    console.log(
      "🔗 Integration providers:",
      data.map((item) => item.provider)
    );

    // Check and refresh only expired tokens
    const refreshResults = await TokenRefreshService.refreshUserTokens(userId);
    const successfulRefreshes = refreshResults.filter((r) => r.success);
    const failedRefreshes = refreshResults.filter((r) => !r.success);

    if (successfulRefreshes.length > 0) {
      const refreshedTokens = successfulRefreshes.filter(
        (r) => r.newExpiresAt && r.newExpiresAt > Math.floor(Date.now() / 1000)
      );
      if (refreshedTokens.length > 0) {
        console.log(
          `🔄 Tokens refreshed: ${refreshedTokens
            .map((r) => r.provider)
            .join(", ")}`
        );
      }
    }
    if (failedRefreshes.length > 0) {
      console.log(
        `❌ Token refresh failed: ${failedRefreshes
          .map((r) => r.provider)
          .join(", ")}`
      );
    }

    // Now check if any integration has a valid token after refresh
    const { data: refreshedData, error: refreshError } = await supabase
      .from("integration_tokens")
      .select("id, provider, access_token, refresh_token, expires_at")
      .eq("user_id", userId);

    if (refreshError) {
      console.error(`❌ Error fetching refreshed tokens:`, refreshError);
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    let hasWorkingIntegration = false;

    for (const integration of refreshedData || []) {
      const isTokenValid =
        integration.access_token &&
        integration.expires_at &&
        integration.expires_at > now;

      if (isTokenValid) {
        hasWorkingIntegration = true;
      }
    }

    console.log(
      `📊 User ${userIdentifier} has working integrations: ${hasWorkingIntegration}`
    );
    return hasWorkingIntegration;
  } catch (error) {
    console.error(`❌ Error checking user integrations:`, error);
    return false;
  }
}

// Generate user report
async function generateUserReport(
  userId: string,
  userEmail: string,
  reportType: string
) {
  try {
    const apiUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/api/queue/generate-${reportType}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        userEmail,
        reportType,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Report generation failed for ${userEmail}:`, errorText);
      throw new Error(
        `API request failed for user ${userEmail}: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();

    return {
      status: "completed",
      reportId:
        result.reportData?.date ||
        result.reportData?.startDate ||
        `report-${Date.now()}`,
      message: "Report generated successfully",
      reportData: result.reportData,
    };
  } catch (error) {
    console.error(`❌ Error generating report for user ${userEmail}:`, error);
    throw error;
  }
}

// Send email to user
async function sendEmailToUser(
  userEmail: string,
  reportResult: any,
  reportType: string,
  userId: string
) {
  let logId: string | null = null;

  try {
    // Import email functions and logger
    const { sendEmail } = await import("@/lib/sendgrid/email-service");
    const { EmailLogger } = await import("@/lib/email-logging/email-logger");

    // Log email before sending
    const logData = {
      user_id: userId,
      recipient_email: userEmail,
      sender_email:
        process.env.SENDER_VERIFICATION_EMAIL || "asad@devstitch.com",
      email_type: (reportType === "daily"
        ? "daily_report"
        : "weekly_report") as "daily_report" | "weekly_report",
      subject:
        reportType === "daily"
          ? `🦊 MyMetricLog Daily Report: ${
              reportResult.reportData.fullDateStr ||
              new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            }`
          : `🦊 MyMetricLog Weekly Report: ${reportResult.reportData.startDate} to ${reportResult.reportData.endDate}`,
      status: "pending" as const,
      report_date:
        reportType === "daily"
          ? reportResult.reportData.fullDateStr
          : reportResult.reportData.startDate,
      report_type: reportType as "daily" | "weekly",
    };

    const logResult = await EmailLogger.logEmail(logData);
    if (logResult.success) {
      logId = logResult.logId;
      console.log(`📝 Email logged with ID: ${logId}`);
    } else {
      console.warn(`⚠️ Failed to log email: ${logResult.error}`);
    }

    // Send the email
    if (reportType === "daily") {
      const { generateDailyReportEmail } = await import(
        "@/lib/sendgrid/templates/daily-email-template"
      );
      const emailHTML = generateDailyReportEmail(reportResult.reportData);

      // Add CC for specific user
      const ccEmails =
        userEmail === "josh987@gmail.com"
          ? ["assadblogger@gmail.com"]
          : undefined;

      const result = await sendEmail(
        userEmail,
        `🦊 MyMetricLog Daily Report: ${
          reportResult.reportData.fullDateStr ||
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
    } else if (reportType === "weekly") {
      const { generateWeeklyReportEmail } = await import(
        "@/lib/sendgrid/templates/weekly-email-template"
      );
      const emailHTML = generateWeeklyReportEmail(reportResult.reportData);

      // Add CC for specific user
      const ccEmails =
        userEmail === "josh987@gmail.com"
          ? ["assadblogger@gmail.com"]
          : undefined;

      const result = await sendEmail(
        userEmail,
        `🦊 MyMetricLog Weekly Report: ${reportResult.reportData.startDate} to ${reportResult.reportData.endDate}`,
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
    }

    console.log(`📧 Email sent successfully to ${userEmail}`);
  } catch (emailError) {
    console.log(`⚠️ Email error for ${userEmail}:`, emailError);

    // Update email log with failure
    if (logId) {
      const { EmailLogger } = await import("@/lib/email-logging/email-logger");
      await EmailLogger.updateEmailStatus(
        logId,
        "failed",
        emailError instanceof Error ? emailError.message : "Unknown error"
      );
    }

    // Don't fail the entire job if email fails
  }
}

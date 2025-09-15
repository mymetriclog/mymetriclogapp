import { NextRequest, NextResponse } from "next/server";
import { DynamicReportGenerator } from "@/lib/reports/dynamic-report-generator";
import { getServerSupabaseClient } from "@/lib/supabase/server";

// Simple in-memory cache to prevent duplicate job processing
const processedJobs = new Set<string>();

// Process user report job using the new dynamic system
export async function POST(request: NextRequest) {
  let jobData: any = null; // Declare outside try block
  try {
    jobData = await request.json();
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

    // Check if user has integrations
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

    // Generate report using the new dynamic system
    const reportGenerator = new DynamicReportGenerator();

    const userData = {
      userId,
      userEmail,
      userName: userEmail.split("@")[0], // Simple fallback
      date: new Date().toISOString().split("T")[0],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    let report;
    if (reportType === "daily") {
      report = await reportGenerator.generateDailyReport(userData);
    } else {
      report = await reportGenerator.generateWeeklyReport(userData);
    }

    console.log(`✅ Completed ${reportType} report for ${userEmail}`);

    return NextResponse.json({
      status: "completed",
      reportId: report.id,
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

// Check if user has working integrations
async function checkUserIntegrations(
  userId: string,
  userEmail?: string
): Promise<boolean> {
  try {
    const userIdentifier = userEmail || userId;
    console.log(`🔍 Checking integrations for user: ${userIdentifier}`);

    const supabase = await getServerSupabaseClient();

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

    // Check if any integration has a valid token
    const now = Math.floor(Date.now() / 1000);
    let hasWorkingIntegration = false;

    for (const integration of data) {
      const isTokenValid =
        integration.access_token &&
        integration.expires_at &&
        integration.expires_at > now;

      if (isTokenValid) {
        hasWorkingIntegration = true;
        break; // At least one working integration is enough
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

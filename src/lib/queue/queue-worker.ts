import { userReportQueue, UserReportJobData } from "./queue-service";

// Worker function to continuously process jobs
async function processJobs() {
  console.log("🚀 ===== QUEUE WORKER STARTED =====");
  console.log("👷 Worker is ready to process jobs from Redis");

  while (true) {
    try {
      // Get next job from queue
      const job = await userReportQueue.getNextJob();

      if (!job) {
        // No jobs available, wait a bit before checking again
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      // Process the job
      const result = await processUserReportJob(job);

      // Log the result for this user
      if (result.status === "completed") {
        console.log(`✅ User job completed successfully: ${result.message}`);
      } else if (result.status === "skipped") {
        console.log(
          `⏭️ User job skipped: ${
            (result as any).reason || "No reason provided"
          }`
        );
      } else if (result.status === "failed") {
        console.log(`❌ User job failed: ${result.message}`);
      }

      console.log(`🔄 Ready to process next user...`);
      console.log(`\n${"=".repeat(80)}`);
    } catch (error) {
      console.error("❌ Error in job processing loop:", error);
      console.log(`⏭️ Continuing with next user despite error...`);
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

// Process individual user report generation job
async function processUserReportJob(job: any) {
  const {
    userId,
    userEmail,
    reportType = "daily",
  } = job.data as UserReportJobData;

  console.log(`\n🚀 ===== STARTING JOB PROCESSING FOR USER ${userEmail} =====`);
  console.log(`📋 Job ID: ${job.id}`);
  console.log(`📋 Job Type: ${job.type}`);
  console.log(`📊 Report Type: ${reportType}`);
  console.log(`👤 User: ${userEmail} (${userId})`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);

  try {
    // Step 1: Check if user still has integrations
    console.log(
      `\n🔍 STEP 1: Checking user integrations for user: ${userEmail}...`
    );
    const hasIntegrations = await checkUserIntegrations(userId);
    console.log(`📊 User ${userEmail} has integrations: ${hasIntegrations}`);

    if (!hasIntegrations) {
      console.log(`⏭️ Skipping user ${userEmail} - no integrations found`);
      console.log(
        `✅ User ${userEmail} job completed (skipped) - moving to next user`
      );
      await userReportQueue.completeJob(job.id, {
        status: "skipped",
        reason: "No integrations found",
      });
      return { status: "skipped", reason: "No integrations found" };
    }

    console.log(
      `✅ User ${userEmail} has integrations, proceeding with ${reportType} report generation`
    );

    // Step 2: Generate report using the API endpoint
    console.log(
      `\n🌐 STEP 2: Calling report generation API for user: ${userEmail}...`
    );
    console.log(
      `📡 API URL: ${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/queue/generate-report`
    );
    console.log(`📤 Request payload for user ${userEmail}:`, {
      userId,
      userEmail,
      reportType,
    });

    const reportResult = await generateUserReport(
      userId,
      userEmail,
      reportType
    );

    console.log(`✅ Report generated successfully for user ${userEmail}!`);
    console.log(`📄 Report ID: ${reportResult.reportId}`);
    console.log(`📊 Report Status: ${reportResult.status}`);

    // Small delay to ensure report is fully saved to database
    console.log(
      `⏳ Waiting 2 seconds to ensure report is saved to database...`
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 3: Send email to user
    console.log(`\n📧 STEP 3: Sending email to user: ${userEmail}...`);
    try {
      // Calculate report date based on report type
      let reportDate: Date;
      let dateRange: string;

      if (reportType === "weekly") {
        // For weekly reports, use the end of the week (Sunday)
        const now = new Date();
        const daysUntilSunday = 7 - now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        reportDate = new Date(
          now.getTime() + daysUntilSunday * 24 * 60 * 60 * 1000
        );
        dateRange = `${
          new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        } - ${reportDate.toISOString().split("T")[0]}`;
      } else {
        // For daily reports, use current date
        reportDate = new Date();
        dateRange = reportDate.toISOString().split("T")[0];
      }

      console.log(
        `📅 Using report date: ${
          reportDate.toISOString().split("T")[0]
        } (${reportType} report)`
      );
      if (reportType === "weekly") {
        console.log(`📅 Date range: ${dateRange}`);
      }

      const emailPayload = {
        userId: userId,
        userEmail: userEmail,
        reportType: reportType,
        type: reportType,
        to: userEmail,
        date: reportDate.toISOString().split("T")[0],
        dateRange: reportType === "weekly" ? dateRange : undefined,
        subject:
          reportType === "weekly"
            ? `Weekly Wellness Report - ${dateRange}`
            : `Daily Wellness Report - ${reportDate.toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}`,
      };

      console.log(`📧 Email payload for user ${userEmail}:`, emailPayload);

      const emailResponse = await fetch(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/api/email/send-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailPayload),
        }
      );

      console.log(`🔍 Email response for user ${userEmail}:`, {
        status: emailResponse.status,
        statusText: emailResponse.statusText,
        ok: emailResponse.ok,
        headers: Object.fromEntries(emailResponse.headers.entries()),
      });

      if (emailResponse.ok) {
        const emailResult = await emailResponse.json();
        console.log(`✅ Email sent successfully to user ${userEmail}!`);
        console.log(
          `📧 SendGrid Response for ${userEmail}:`,
          JSON.stringify(emailResult, null, 2)
        );
        console.log(`📧 Email ID: ${emailResult.data?.emailId || "N/A"}`);
        console.log(`📧 Email Status: ${emailResult.data?.status || "N/A"}`);
        console.log(`📧 Message ID: ${emailResult.data?.messageId || "N/A"}`);
        console.log(
          `📧 SendGrid Status Code: ${emailResult.data?.statusCode || "N/A"}`
        );
      } else {
        const errorData = await emailResponse.json().catch(() => ({}));
        console.log(
          `⚠️ Email sending failed for user ${userEmail}: ${emailResponse.status} ${emailResponse.statusText}`
        );
        console.log(
          `📧 SendGrid Error Response for ${userEmail}:`,
          JSON.stringify(errorData, null, 2)
        );
        console.log(`📧 Full error response:`, errorData);
        // Don't fail the entire job if email fails
      }
    } catch (emailError) {
      console.log(`⚠️ Email sending error for user ${userEmail}:`, emailError);
      // Don't fail the entire job if email fails
    }

    console.log(`✅ Job completed successfully for user ${userEmail}!`);
    console.log(
      `🎉 User ${userEmail} processing completed - moving to next user`
    );

    const result = {
      status: "completed",
      reportId: reportResult.reportId,
      message: "Report generated successfully",
    };

    await userReportQueue.completeJob(job.id, result);
    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`\n❌ ===== JOB FAILED FOR USER ${userEmail} =====`);
    console.error(`📋 Job ID: ${job.id}`);
    console.error(`👤 User: ${userEmail}`);
    console.error(`🚨 Error: ${errorMessage}`);
    console.error(`⏰ Failed at: ${new Date().toISOString()}`);
    console.error(
      `⏭️ Skipping user ${userEmail} due to error - moving to next user`
    );

    // Mark job as failed and continue with next user
    await userReportQueue.failJob(job.id, errorMessage);

    // Return error result instead of throwing to prevent stopping the entire process
    return {
      status: "failed",
      error: errorMessage,
      message: `Job failed for user ${userEmail} - continuing with next user`,
    };
  }
}

// Start processing jobs
processJobs().catch((error) => {
  console.error("❌ Fatal error in queue worker:", error);
  process.exit(1);
});

// Summary of the 4-step process:
// 1. Check user integrations (skip if none found)
// 2. Generate report using API endpoint
// 3. Send email to user with report
// 4. Complete job successfully

// Check if user has working integrations (not just records in database)
async function checkUserIntegrations(userId: string): Promise<boolean> {
  try {
    console.log(`🔍 Checking integrations for user: ${userId}`);
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
      `📊 Found ${data.length} integration records for user ${userId}`
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
        console.log(`✅ ${integration.provider} has valid token`);
        hasWorkingIntegration = true;
      } else if (integration.refresh_token) {
        console.log(
          `🔄 ${integration.provider} token expired but has refresh token - will attempt refresh`
        );
        hasWorkingIntegration = true; // Assume refresh will work
      } else {
        console.log(
          `❌ ${integration.provider} has no valid token or refresh token`
        );
      }
    }

    console.log(
      `📊 User ${userId} has working integrations: ${hasWorkingIntegration}`
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
    console.log(`🌐 Generating report for user: ${userEmail}`);

    const apiUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/api/queue/generate-report`;

    console.log(
      `📡 Making API call to generate report for user ${userEmail}...`
    );

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

    console.log(
      `📊 API response status for user ${userEmail}: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API request failed for user ${userEmail}:`, errorText);
      throw new Error(
        `API request failed for user ${userEmail}: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    console.log(`✅ Report generation API response for user ${userEmail}:`);

    return {
      status: "completed",
      reportId: result.data?.reportId || `report-${Date.now()}`,
      message: "Report generated successfully",
    };
  } catch (error) {
    console.error(`❌ Error generating report for user ${userEmail}:`, error);
    throw error;
  }
}

console.log("🚀 ===== QUEUE WORKER INITIALIZED =====");
console.log("👷 Worker is ready to process jobs");
console.log("⏰ Initialized at:", new Date().toISOString());

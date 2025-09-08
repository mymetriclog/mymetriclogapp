import { userReportQueue, UserReportJobData } from "./bull-queue-service";
import { TokenRefreshService } from "@/lib/integrations/token-refresh-service";

// Process user report job
async function processUserReportJob(job: any): Promise<any> {
  const {
    userId,
    userEmail,
    reportType = "daily",
  } = job.data as UserReportJobData;

  console.log(
    `\n🚀 ===== STARTING BULL JOB PROCESSING FOR USER ${userEmail} =====`
  );
  console.log(`📋 Job ID: ${job.id}`);
  console.log(`📋 Job Type: ${job.name}`);
  console.log(`📊 Report Type: ${reportType}`);
  console.log(`👤 User: ${userEmail} (${userId})`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);

  try {
    // Step 1: Check if user still has integrations and refresh tokens
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
      return { status: "skipped", reason: "No integrations found" };
    }

    console.log(
      `✅ User ${userEmail} has integrations, proceeding with ${reportType} report generation`
    );

    // Step 2: Generate report using the API endpoint
    console.log(
      `\n🌐 STEP 2: Calling report generation API for user: ${userEmail}...`
    );
    const reportResult = await generateUserReport(
      userId,
      userEmail,
      reportType
    );
    console.log(`✅ Report generation completed for user ${userEmail}`);

    // Step 3: Send email to user
    console.log(`\n📧 STEP 3: Sending email to user: ${userEmail}...`);
    await sendEmailToUser(userEmail, reportResult, reportType, userId);
    console.log(`✅ Email sent successfully to user ${userEmail}`);

    console.log(`✅ Job completed successfully for user ${userEmail}!`);
    console.log(
      `🎉 User ${userEmail} processing completed - moving to next user`
    );

    return {
      status: "completed",
      reportId: reportResult.reportId,
      message: "Report generated and email sent successfully",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`\n❌ ===== BULL JOB FAILED FOR USER ${userEmail} =====`);
    console.error(`📋 Job ID: ${job.id}`);
    console.error(`👤 User: ${userEmail}`);
    console.error(`🚨 Error: ${errorMessage}`);
    console.error(`⏰ Failed at: ${new Date().toISOString()}`);
    console.error(
      `⏭️ Skipping user ${userEmail} due to error - moving to next user`
    );

    // Bull will automatically handle retries based on the configuration
    throw error; // Let Bull handle the retry logic
  }
}

// Check if user has working integrations and refresh expired tokens
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

    // Check and refresh only expired tokens
    console.log(`🔍 Checking token status and refreshing if needed...`);
    const refreshResults = await TokenRefreshService.refreshUserTokens(userId);
    const successfulRefreshes = refreshResults.filter((r) => r.success);
    const failedRefreshes = refreshResults.filter((r) => !r.success);

    if (successfulRefreshes.length > 0) {
      const refreshedTokens = successfulRefreshes.filter(
        (r) => r.newExpiresAt && r.newExpiresAt > Math.floor(Date.now() / 1000)
      );
      const validTokens = successfulRefreshes.filter(
        (r) =>
          !r.newExpiresAt || r.newExpiresAt <= Math.floor(Date.now() / 1000)
      );

      if (refreshedTokens.length > 0) {
        console.log(
          `🔄 Tokens refreshed: ${refreshedTokens
            .map((r) => r.provider)
            .join(", ")}`
        );
      }
      if (validTokens.length > 0) {
        console.log(
          `✅ Tokens still valid: ${validTokens
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
    // We need to fetch fresh data from database after refresh
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
        console.log(`✅ ${integration.provider} has valid token`);
        hasWorkingIntegration = true;
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

// Send email to user
async function sendEmailToUser(
  userEmail: string,
  reportResult: any,
  reportType: string,
  userId: string
) {
  try {
    console.log(`📧 Sending email to user: ${userEmail}`);

    const emailUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/api/email/send-report`;

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    const emailResponse = await fetch(emailUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: userEmail,
        type: reportType,
        userId: userId,
        date: today,
      }),
    });

    if (emailResponse.ok) {
      await emailResponse.json();
      console.log(`📧 Email sent successfully to user ${userEmail}`);
    } else {
      const errorData = await emailResponse.json().catch(() => ({}));
      console.log(
        `⚠️ Email sending failed for user ${userEmail}: ${emailResponse.status} ${emailResponse.statusText}`
      );
      console.log(
        `📧 SendGrid Error Response for ${userEmail}:`,
        JSON.stringify(errorData, null, 2)
      );
      // Don't fail the entire job if email fails
    }
  } catch (emailError) {
    console.log(`⚠️ Email sending error for user ${userEmail}:`, emailError);
    // Don't fail the entire job if email fails
  }
}

// Set up job processor
userReportQueue.process("generate-user-report", 5, async (job) => {
  console.log(`\n🚀 ===== BULL PROCESSING JOB ${job.id} =====`);
  console.log(`📋 Job Data:`, job.data);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);

  try {
    const result = await processUserReportJob(job);
    console.log(`✅ ===== BULL JOB ${job.id} COMPLETED =====`);
    return result;
  } catch (error) {
    console.error(`❌ ===== BULL JOB ${job.id} FAILED =====`);
    console.error(`🚨 Error:`, error);
    throw error; // Let Bull handle retries
  }
});

console.log("🚀 ===== BULL QUEUE WORKER INITIALIZED =====");
console.log("👷 Bull worker is ready to process jobs");
console.log("⏰ Initialized at:", new Date().toISOString());

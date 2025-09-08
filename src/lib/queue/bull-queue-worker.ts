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
    `\n🚀 Processing ${reportType} report for ${userEmail} (Job ${job.id})`
  );

  try {
    // Step 1: Check if user still has integrations and refresh tokens
    const hasIntegrations = await checkUserIntegrations(userId, userEmail);

    if (!hasIntegrations) {
      console.log(`⏭️ Skipping ${userEmail} - no integrations`);
      return { status: "skipped", reason: "No integrations found" };
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

    return {
      status: "completed",
      reportId: reportResult.reportId,
      message: "Report generated and email sent successfully",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(
      `❌ Failed ${reportType} report for ${userEmail}: ${errorMessage}`
    );

    // Bull will automatically handle retries based on the configuration
    throw error; // Let Bull handle the retry logic
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
    }/api/queue/generate-report`;

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

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json().catch(() => ({}));
      console.log(`⚠️ Email failed for ${userEmail}: ${emailResponse.status}`);
      // Don't fail the entire job if email fails
    }
  } catch (emailError) {
    console.log(`⚠️ Email error for ${userEmail}:`, emailError);
    // Don't fail the entire job if email fails
  }
}

// Set up job processor
userReportQueue.process("generate-user-report", 5, async (job) => {
  try {
    const result = await processUserReportJob(job);
    return result;
  } catch (error) {
    throw error; // Let Bull handle retries
  }
});

console.log("🚀 Bull queue worker initialized");

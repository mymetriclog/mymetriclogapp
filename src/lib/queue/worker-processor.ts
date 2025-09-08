import { userReportQueue, UserReportJobData } from "./bull-queue-service";
import { getServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";
import { TokenRefreshService } from "@/lib/integrations/token-refresh-service";
import { AutoReconnectService } from "@/lib/integrations/auto-reconnect-service";

// Standalone function to process a single job
export async function processJob(
  jobData: UserReportJobData & { queueJobId?: string }
) {
  const { userId, userEmail, queueJobId } = jobData;

  console.log(`\n👤 ===== USER: ${userEmail} =====`);
  console.log(
    `📋 Job ID: ${queueJobId} | Started: ${new Date().toISOString()}`
  );

  try {
    // Step 1: Update status to processing
    if (queueJobId) await updateJobStatus(queueJobId, "processing");

    // Step 2: Check if user still has integrations
    const hasIntegrations = await checkUserIntegrations(userId);
    console.log(`🔍 Integrations: ${hasIntegrations ? "Found" : "None"}`);

    if (!hasIntegrations) {
      console.log(`⏭️ SKIPPED - No integrations`);
      if (queueJobId)
        await updateJobStatus(
          queueJobId,
          "skipped",
          "User no longer has integrations"
        );
      return { status: "skipped", reason: "No integrations found" };
    }

    // Step 3: Automatically refresh expired tokens
    const refreshResults = await TokenRefreshService.refreshUserTokens(userId);
    const successfulRefreshes = refreshResults.filter((r) => r.success);
    const failedRefreshes = refreshResults.filter((r) => !r.success);

    if (successfulRefreshes.length > 0) {
      console.log(
        `🔄 Tokens refreshed: ${successfulRefreshes
          .map((r) => r.provider)
          .join(", ")}`
      );
    }
    if (failedRefreshes.length > 0) {
      console.log(
        `❌ Token refresh failed: ${failedRefreshes
          .map((r) => r.provider)
          .join(", ")}`
      );

      // Mark failed integrations as needing reconnection
      await markIntegrationsForReconnection(
        userId,
        failedRefreshes.map((r) => r.provider)
      );

      // Send reconnection notification to user
      try {
        const userReconnectionData = {
          userId,
          userEmail,
          integrations: failedRefreshes.map((r) => ({
            provider: r.provider,
            reconnectUrl: `${
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            }/api/integrations/${
              r.provider
            }/connect?returnTo=/integrations&autoReconnect=true`,
            requestedAt: new Date().toISOString(),
          })),
          totalIntegrations: failedRefreshes.length,
        };

        await AutoReconnectService.sendReconnectionNotification(
          userReconnectionData
        );
        console.log(`📧 Reconnection notification sent to ${userEmail}`);
      } catch (error) {
        console.error(`❌ Failed to send reconnection notification:`, error);
      }
    }

    // Step 4: Generate report
    console.log(`🌐 Generating report...`);
    const reportResult = await generateUserReport(userId, userEmail);
    console.log(`✅ Report generated: ${reportResult.reportId}`);

    // Step 5: Update final status
    if (queueJobId) await updateJobStatus(queueJobId, "completed");
    console.log(`✅ COMPLETED - Report ID: ${reportResult.reportId}`);

    return {
      status: "completed",
      reportId: reportResult.reportId,
      message: "Report generated successfully",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.log(`❌ FAILED - ${errorMessage}`);

    // Update status to failed
    if (queueJobId) await updateJobStatus(queueJobId, "failed", errorMessage);

    throw error;
  }
}

// Check if user has integrations
async function checkUserIntegrations(userId: string): Promise<boolean> {
  try {
    const supabase = await getServerSupabaseClientWithServiceRole();

    const { data, error } = await supabase
      .from("integration_tokens")
      .select("id, provider")
      .eq("user_id", userId);

    if (error) {
      console.error(`❌ Error checking integrations:`, error);
      return false;
    }

    const hasIntegrations = data && data.length > 0;
    if (hasIntegrations) {
      console.log(
        `📊 Found ${data.length} integrations: ${data
          .map((i) => i.provider)
          .join(", ")}`
      );
    }

    return hasIntegrations;
  } catch (error) {
    console.error(`❌ Error checking integrations:`, error);
    return false;
  }
}

// Generate report for a specific user by calling the API endpoint
async function generateUserReport(userId: string, userEmail: string) {
  try {
    // Call the queue-specific API endpoint
    const apiUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/api/reports/generate`;

    const requestBody = {
      userId,
      userEmail,
      reportType: "daily",
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ API call failed:`, errorData);
      throw new Error(
        `API call failed: ${errorData.message || response.statusText}`
      );
    }

    const result = await response.json();

    return {
      reportId: result.data.reportId,
      status: "success",
    };
  } catch (error) {
    console.error(`❌ Error in generateUserReport:`, error);
    throw error;
  }
}

// Mark integrations as needing reconnection
async function markIntegrationsForReconnection(
  userId: string,
  providers: string[]
) {
  try {
    const supabase = await getServerSupabaseClientWithServiceRole();

    for (const provider of providers) {
      // Update the integration token record to mark it as needing reconnection
      const { error } = await supabase
        .from("integration_tokens")
        .update({
          needs_reconnection: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("provider", provider);

      if (error) {
        console.error(`❌ Failed to mark ${provider} for reconnection:`, error);
      } else {
        console.log(`🔗 Marked ${provider} for reconnection`);
      }
    }
  } catch (error) {
    console.error(`❌ Error marking integrations for reconnection:`, error);
  }
}

// Update job status in the database
async function updateJobStatus(
  queueJobId: string,
  status: "processing" | "completed" | "failed" | "skipped",
  errorMessage?: string
) {
  try {
    const supabase = await getServerSupabaseClientWithServiceRole();

    const updateData: any = {
      status,
      processing_started_at:
        status === "processing" ? new Date().toISOString() : undefined,
      processing_completed_at:
        status === "completed" || status === "failed" || status === "skipped"
          ? new Date().toISOString()
          : undefined,
    };

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await supabase
      .from("queue_tracking")
      .update(updateData)
      .eq("queue_job_id", queueJobId);

    if (error) {
      console.error(`❌ Failed to update job status:`, error);
    }
  } catch (error) {
    console.error(`❌ Error updating job status:`, error);
  }
}

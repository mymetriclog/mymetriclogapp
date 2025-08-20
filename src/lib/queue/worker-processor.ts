import { userReportQueue, UserReportJobData } from "./queue-service";
import { getServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

// Standalone function to process a single job
export async function processJob(jobData: UserReportJobData) {
  const { userId, userEmail, queueJobId } = jobData;

  console.log(`\n🚀 ===== PROCESSING JOB MANUALLY =====`);
  console.log(`📋 Queue Job ID: ${queueJobId}`);
  console.log(`👤 User: ${userEmail} (${userId})`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);

  try {
    // Step 1: Update status to processing
    console.log(`\n📝 STEP 1: Updating job status to 'processing'...`);
    await updateJobStatus(queueJobId, "processing");
    console.log(`✅ Status updated to 'processing'`);

    // Step 2: Check if user still has integrations
    console.log(`\n🔍 STEP 2: Checking user integrations...`);
    const hasIntegrations = await checkUserIntegrations(userId);
    console.log(`📊 User has integrations: ${hasIntegrations}`);

    if (!hasIntegrations) {
      console.log(`⏭️ Skipping user - no integrations found`);
      await updateJobStatus(
        queueJobId,
        "skipped",
        "User no longer has integrations"
      );
      return { status: "skipped", reason: "No integrations found" };
    }

    console.log(`✅ User has integrations, proceeding with report generation`);

    // Step 3: Generate report using the API endpoint
    console.log(`\n🌐 STEP 3: Calling report generation API...`);
    console.log(
      `📡 API URL: ${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/reports/generate`
    );
    console.log(`📤 Request payload:`, {
      userId,
      userEmail,
      reportType: "daily",
    });

    const reportResult = await generateUserReport(userId, userEmail);

    console.log(`✅ Report generated successfully!`);
    console.log(`📄 Report ID: ${reportResult.reportId}`);
    console.log(`📊 Report Status: ${reportResult.status}`);

    // Step 4: Update final status
    console.log(`\n📝 STEP 4: Updating final job status to 'completed'...`);
    await updateJobStatus(queueJobId, "completed");
    console.log(`✅ Job completed successfully!`);

    return {
      status: "completed",
      reportId: reportResult.reportId,
      message: "Report generated successfully",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`\n❌ ===== JOB FAILED =====`);
    console.error(`📋 Queue Job ID: ${queueJobId}`);
    console.error(`👤 User: ${userEmail}`);
    console.error(`🚨 Error: ${errorMessage}`);
    console.error(`⏰ Failed at: ${new Date().toISOString()}`);

    // Update status to failed
    console.log(`\n📝 Updating job status to 'failed'...`);
    await updateJobStatus(queueJobId, "failed", errorMessage);
    console.log(`✅ Status updated to 'failed'`);

    throw error;
  }
}

// Check if user has integrations
async function checkUserIntegrations(userId: string): Promise<boolean> {
  try {
    console.log(`🔍 Checking integrations for user: ${userId}`);
    const supabase = await getServerSupabaseClientWithServiceRole();

    const { data, error } = await supabase
      .from("integration_tokens")
      .select("id, provider")
      .eq("user_id", userId);

    if (error) {
      console.error(`❌ Error checking user integrations:`, error);
      return false;
    }

    const hasIntegrations = data && data.length > 0;
    console.log(
      `📊 Found ${data?.length || 0} integrations:`,
      data?.map((i) => i.provider) || []
    );

    return hasIntegrations;
  } catch (error) {
    console.error(`❌ Error checking user integrations:`, error);
    return false;
  }
}

// Generate report for a specific user by calling the API endpoint
async function generateUserReport(userId: string, userEmail: string) {
  try {
    console.log(`🌐 Making API call to generate report...`);

    // Call the queue-specific API endpoint
    const apiUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/api/reports/generate`;
    console.log(`📡 API URL: ${apiUrl}`);

    const requestBody = {
      userId,
      userEmail,
      reportType: "daily",
    };
    console.log(`📤 Request body:`, requestBody);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(
      `📡 Response status: ${response.status} ${response.statusText}`
    );
    console.log(
      `📡 Response headers:`,
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ API call failed:`, errorData);
      throw new Error(
        `API call failed: ${errorData.message || response.statusText}`
      );
    }

    const result = await response.json();
    console.log(`✅ API response received:`, result);

    return {
      reportId: result.data.reportId,
      status: "success",
    };
  } catch (error) {
    console.error(`❌ Error in generateUserReport:`, error);
    throw error;
  }
}

// Update job status in the database
async function updateJobStatus(
  queueJobId: string,
  status: "processing" | "completed" | "failed" | "skipped",
  errorMessage?: string
) {
  try {
    console.log(
      `📝 Updating job status to '${status}' for queue job ID: ${queueJobId}`
    );

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
      console.log(`📝 Adding error message: ${errorMessage}`);
    }

    console.log(`📝 Update data:`, updateData);

    const { error } = await supabase
      .from("queue_tracking")
      .update(updateData)
      .eq("queue_job_id", queueJobId);

    if (error) {
      console.error(`❌ Failed to update job status:`, error);
    } else {
      console.log(`✅ Job status updated successfully to '${status}'`);
    }
  } catch (error) {
    console.error(`❌ Error updating job status:`, error);
  }
}

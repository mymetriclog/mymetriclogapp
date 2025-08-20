import { userReportQueue, UserReportJobData } from "./queue-service";

// Process user report generation jobs
userReportQueue.process("generate-user-report", async (job) => {
  const { userId, userEmail } = job.data as UserReportJobData;

  console.log(`\n🚀 ===== STARTING JOB PROCESSING =====`);
  console.log(`📋 Job ID: ${job.id}`);
  console.log(`👤 User: ${userEmail} (${userId})`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);

  try {
    // Step 1: Check if user still has integrations
    console.log(`\n🔍 STEP 1: Checking user integrations...`);
    const hasIntegrations = await checkUserIntegrations(userId);
    console.log(`📊 User has integrations: ${hasIntegrations}`);

    if (!hasIntegrations) {
      console.log(`⏭️ Skipping user - no integrations found`);
      return { status: "skipped", reason: "No integrations found" };
    }

    console.log(`✅ User has integrations, proceeding with report generation`);

    // Step 2: Generate report using the API endpoint
    console.log(`\n🌐 STEP 2: Calling report generation API...`);
    console.log(
      `📡 API URL: ${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/queue/generate-report`
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

    // Step 3: Send email to user
    console.log(`\n📧 STEP 3: Sending email to user...`);
    console.log(
      `⚠️ NOTE: Email will fail if report wasn't saved due to RLS policies`
    );
    console.log(`🔧 Fix RLS policies first to enable email sending`);

    try {
      // For daily reports, use yesterday's date to match what saveReportToDatabase uses
      const reportDate = new Date();
      reportDate.setDate(reportDate.getDate() - 1); // Yesterday for daily reports

      console.log(
        `📅 Using report date: ${
          reportDate.toISOString().split("T")[0]
        } (yesterday for daily reports)`
      );

      const emailPayload = {
        userId: userId,
        userEmail: userEmail,
        reportType: "daily",
        type: "daily",
        to: userEmail,
        date: reportDate.toISOString().split("T")[0], // Yesterday's date in YYYY-MM-DD format
        subject: `Daily Wellness Report - ${reportDate.toLocaleDateString(
          "en-US",
          {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        )}`,
      };

      console.log(`📧 Email payload:`, emailPayload);

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

      console.log("🔍 Email response:", emailResponse);

      if (emailResponse.ok) {
        const emailResult = await emailResponse.json();
        console.log(`✅ Email sent successfully!`);
        console.log(`📧 Email ID: ${emailResult.data?.emailId || "N/A"}`);
        console.log(`📧 Email Status: ${emailResult.data?.status || "N/A"}`);
      } else {
        const errorData = await emailResponse.json().catch(() => ({}));
        console.log(
          `⚠️ Email sending failed: ${emailResponse.status} ${emailResponse.statusText}`
        );
        console.log(`📧 Error details:`, errorData);
        console.log(`📧 Full error response:`, errorData);
        // Don't fail the entire job if email fails
      }
    } catch (emailError) {
      console.log(`⚠️ Email sending error:`, emailError);
      // Don't fail the entire job if email fails
    }

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
    console.error(`📋 Job ID: ${job.id}`);
    console.error(`👤 User: ${userEmail}`);
    console.error(`🚨 Error: ${errorMessage}`);
    console.error(`⏰ Failed at: ${new Date().toISOString()}`);

    throw error; // Re-throw to trigger retry mechanism
  }
});

// Summary of the 4-step process:
// 1. Check user integrations (skip if none found)
// 2. Generate report using API endpoint
// 3. Send email to user with report
// 4. Complete job successfully

// Check if user has integrations
async function checkUserIntegrations(userId: string): Promise<boolean> {
  try {
    console.log(`🔍 Checking integrations for user: ${userId}`);
    const { getServerSupabaseClientWithServiceRole } = await import(
      "@/lib/supabase/server"
    );
    const supabase = await getServerSupabaseClientWithServiceRole();

    // Try to find the correct table for integration tokens
    let data, error;

    // First try integration_tokens table
    const result1 = await supabase
      .from("integration_tokens")
      .select("id, provider")
      .eq("user_id", userId);

    if (result1.error) {
      console.log("❌ integration_tokens table error:", result1.error.message);
      data = null;
      error = result1.error;
    } else {
      console.log("✅ integration_tokens table found and queried successfully");
      data = result1.data;
      error = null;
    }

    if (error) {
      console.error(`❌ Error checking user integrations:`, error);
      return false;
    }

    if (!data) {
      console.log("❌ No data returned from database");
      return false;
    }

    console.log("📊 Raw integration data:", data);

    const hasIntegrations = data && data.length > 0;
    console.log(
      `📊 Found ${data?.length || 0} integrations for user ${userId}`
    );

    if (hasIntegrations) {
      console.log(
        "🔗 Integration providers:",
        data.map((item) => item.provider)
      );
    }

    return hasIntegrations;
  } catch (error) {
    console.error(`❌ Error checking user integrations:`, error);
    return false;
  }
}

// Generate user report
async function generateUserReport(userId: string, userEmail: string) {
  try {
    console.log(`🌐 Generating report for user: ${userEmail}`);

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
        reportType: "daily",
      }),
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    console.log(`✅ Report generation API response:`, result);

    return {
      status: "completed",
      reportId: result.data?.reportId || `report-${Date.now()}`,
      message: "Report generated successfully",
    };
  } catch (error) {
    console.error(`❌ Error generating report:`, error);
    throw error;
  }
}

console.log("🚀 ===== QUEUE WORKER INITIALIZED =====");
console.log("👷 Worker is ready to process jobs");
console.log("⏰ Initialized at:", new Date().toISOString());

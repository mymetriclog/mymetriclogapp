import { NextRequest, NextResponse } from "next/server";
import { TokenRefreshService } from "@/lib/integrations/token-refresh-service";
import { Receiver } from "@upstash/qstash";

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

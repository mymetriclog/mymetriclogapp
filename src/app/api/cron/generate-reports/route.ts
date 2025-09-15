import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { DynamicReportGenerator } from "@/lib/reports/dynamic-report-generator";
import { reportExists } from "@/lib/utils/report-duplicate-checker";

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🕐 [Cron] Starting automatic report generation...");

    // Get all active users
    const supabase = await getServerSupabaseClient();
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, email, full_name, timezone, latitude, longitude, created_at")
      .not("email", "is", null);

    if (usersError) {
      console.error("❌ [Cron] Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      console.log("ℹ️ [Cron] No users found for report generation");
      return NextResponse.json({
        success: true,
        message: "No users found for report generation",
        reportsGenerated: 0,
      });
    }

    const reportGenerator = new DynamicReportGenerator();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Generate reports for each user
    for (const user of users) {
      try {
        console.log(`📊 [Cron] Generating report for user: ${user.email}`);

        // Check if user has been active in the last 30 days
        const userCreatedAt = new Date(user.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (userCreatedAt < thirtyDaysAgo) {
          // Check if user has any recent activity (reports, integrations, etc.)
          const { data: recentActivity } = await supabase
            .from("reports")
            .select("id")
            .eq("user_id", user.id)
            .gte("created_at", thirtyDaysAgo.toISOString())
            .limit(1);

          if (!recentActivity || recentActivity.length === 0) {
            console.log(`⏭️ [Cron] Skipping inactive user: ${user.email}`);
            continue;
          }
        }

        // Check if user has connected integrations
        const { data: integrations } = await supabase
          .from("integration_tokens")
          .select("provider")
          .eq("user_id", user.id)
          .not("access_token", "is", null);

        if (!integrations || integrations.length === 0) {
          console.log(
            `⏭️ [Cron] Skipping user with no integrations: ${user.email}`
          );
          continue;
        }

        // Prepare user data for report generation
        const reportDate = new Date().toISOString().split("T")[0];
        const userReportData = {
          userId: user.id,
          userEmail: user.email,
          userName: user.full_name || user.email.split("@")[0],
          date: reportDate,
          timezone: user.timezone || "UTC",
          latitude: user.latitude,
          longitude: user.longitude,
        };

        // Check if report already exists for today
        const reportAlreadyExists = await reportExists(
          user.id,
          reportDate,
          "daily"
        );
        if (reportAlreadyExists) {
          console.log(
            `⏭️ [Cron] Report already exists for ${user.email} on ${reportDate}, skipping`
          );
          continue;
        }

        // Generate daily report
        const report = await reportGenerator.generateDailyReport(
          userReportData
        );

        results.success++;
        console.log(
          `✅ [Cron] Report generated successfully for ${user.email}`
        );
      } catch (error) {
        results.failed++;
        const errorMessage = `Failed to generate report for ${user.email}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        results.errors.push(errorMessage);
        console.error(`❌ [Cron] ${errorMessage}`);
      }
    }

    console.log(
      `🏁 [Cron] Report generation completed. Success: ${results.success}, Failed: ${results.failed}`
    );

    return NextResponse.json({
      success: true,
      message: "Report generation completed",
      reportsGenerated: results.success,
      reportsFailed: results.failed,
      errors: results.errors,
    });
  } catch (error) {
    console.error("❌ [Cron] Error in report generation cron job:", error);
    return NextResponse.json(
      { error: "Failed to generate reports" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Allow manual triggering via GET request for testing
  return POST(request);
}

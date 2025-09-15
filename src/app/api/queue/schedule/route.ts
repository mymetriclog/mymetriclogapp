import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { DynamicReportGenerator } from "@/lib/reports/dynamic-report-generator";
import {
  reportExists,
  getExistingReport,
} from "@/lib/utils/report-duplicate-checker";

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, reportType = "daily" } = await request.json();

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "userId and userEmail are required" },
        { status: 400 }
      );
    }

    // Generate report directly using the new system
    const reportGenerator = new DynamicReportGenerator();

    // Get user data from database using the provided userId
    const supabase = await getServerSupabaseClient();
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id, email, full_name, timezone, latitude, longitude")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const reportDate = new Date().toISOString().split("T")[0];
    const userReportData = {
      userId: userData.id,
      userEmail: userData.email,
      userName: userData.full_name || userData.email.split("@")[0],
      date: reportDate,
      timezone: userData.timezone || "UTC",
      latitude: userData.latitude,
      longitude: userData.longitude,
    };

    // Check if report already exists
    const reportAlreadyExists = await reportExists(
      userData.id,
      reportDate,
      reportType as "daily" | "weekly"
    );
    if (reportAlreadyExists) {
      const existingReport = await getExistingReport(
        userData.id,
        reportDate,
        reportType as "daily" | "weekly"
      );
      return NextResponse.json({
        success: true,
        reportId: existingReport?.id,
        message: `${reportType} report already exists for ${reportDate}`,
        isExisting: true,
        reportData: existingReport,
      });
    }

    let report;
    if (reportType === "daily") {
      report = await reportGenerator.generateDailyReport(userReportData);
    } else {
      report = await reportGenerator.generateWeeklyReport(userReportData);
    }

    console.log(`✅ Generated ${reportType} report for ${userEmail}`);

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: `${reportType} report generated successfully`,
      reportData: report,
    });
  } catch (error) {
    console.error("❌ Error generating report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Generate reports for all users
export async function PUT(request: NextRequest) {
  try {
    const { reportType = "daily", testingMode = false } = await request.json();

    // For weekly reports, check if it's Sunday OR if testing mode is enabled
    if (reportType === "weekly" && !testingMode) {
      const now = new Date();
      const today = now.getDay(); // 0 = Sunday
      if (today !== 0) {
        return NextResponse.json(
          {
            error: "Weekly reports can only be generated on Sundays",
            today: today,
            daysUntilSunday: 7 - today,
            message: "Enable testing mode to bypass this restriction",
          },
          { status: 400 }
        );
      }
    }

    // Get all users with integrations
    const supabase = await getServerSupabaseClient();

    // Get all integration tokens
    const { data: tokens, error: tokensError } = await supabase
      .from("integration_tokens")
      .select("user_id")
      .not("access_token", "is", null);

    if (tokensError) {
      throw new Error(
        `Failed to fetch integration tokens: ${tokensError.message}`
      );
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users with integrations found",
        reportsGenerated: 0,
        usersProcessed: 0,
      });
    }

    // Get user data from profiles table
    const userIds = [...new Set(tokens.map((token) => token.user_id))];

    const { data: usersData, error: usersError } = await supabase
      .from("profiles")
      .select("id, email, full_name, timezone, latitude, longitude")
      .in("id", userIds);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json({
        success: false,
        error: "Failed to fetch users",
        reportsGenerated: 0,
        usersProcessed: 0,
      });
    }

    const users = usersData || [];

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users found",
        reportsGenerated: 0,
        usersProcessed: 0,
      });
    }

    // Generate reports for each user using the new system
    const reportGenerator = new DynamicReportGenerator();
    const generatedReports = [];
    let successCount = 0;

    console.log(
      `📊 Processing ${users.length} unique users for ${reportType} reports`
    );

    for (const user of users) {
      try {
        console.log(`🔄 Processing user: ${user.email} (${user.id})`);

        const userData = {
          userId: user.id,
          userEmail: user.email,
          userName: user.full_name || user.email.split("@")[0],
          date: new Date().toISOString().split("T")[0],
          timezone: user.timezone || "UTC",
          latitude: user.latitude,
          longitude: user.longitude,
        };

        let report;
        if (reportType === "daily") {
          report = await reportGenerator.generateDailyReport(userData);
        } else {
          report = await reportGenerator.generateWeeklyReport(userData);
        }

        generatedReports.push({
          userId: user.id,
          userEmail: user.email,
          reportId: report.id,
          status: "completed",
        });

        successCount++;
        console.log(`✅ Generated ${reportType} report for ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to generate report for ${user.email}:`, error);
        generatedReports.push({
          userId: user.id,
          userEmail: user.email,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${successCount} ${reportType} reports`,
      reportsGenerated: successCount,
      usersProcessed: users.length,
      generatedReports,
    });
  } catch (error) {
    console.error("❌ Error generating bulk reports:", error);
    return NextResponse.json(
      {
        error: "Failed to generate bulk reports",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  getServerSupabaseClient,
  getServerSupabaseClientWithServiceRole,
} from "@/lib/supabase/server";
import { DynamicReportGenerator } from "@/lib/reports/dynamic-report-generator";
import {
  reportExists,
  getExistingReport,
} from "@/lib/utils/report-duplicate-checker";

// Timezone to location mapping for common timezones
const TIMEZONE_LOCATIONS: Record<string, { lat: number; lon: number }> = {
  UTC: { lat: 51.5074, lon: -0.1278 },
  "America/New_York": { lat: 40.7128, lon: -74.006 },
  "America/Chicago": { lat: 41.8781, lon: -87.6298 },
  "America/Denver": { lat: 39.7392, lon: -104.9903 },
  "America/Los_Angeles": { lat: 34.0522, lon: -118.2437 },
  "America/Toronto": { lat: 43.6532, lon: -79.3832 },
  "Europe/London": { lat: 51.5074, lon: -0.1278 },
  "Europe/Paris": { lat: 48.8566, lon: 2.3522 },
  "Europe/Berlin": { lat: 52.52, lon: 13.405 },
  "Europe/Rome": { lat: 41.9028, lon: 12.4964 },
  "Europe/Madrid": { lat: 40.4168, lon: -3.7038 },
  "Asia/Singapore": { lat: 1.3521, lon: 103.8198 },
  "Asia/Tokyo": { lat: 35.6762, lon: 139.6503 },
  "Asia/Shanghai": { lat: 31.2304, lon: 121.4737 },
  "Asia/Dubai": { lat: 25.2048, lon: 55.2708 },
  "Asia/Kolkata": { lat: 28.6139, lon: 77.209 },
  "Asia/Karachi": { lat: 24.8607, lon: 67.0011 },
  "Australia/Sydney": { lat: -33.8688, lon: 151.2093 },
  "Pacific/Auckland": { lat: -36.8485, lon: 174.7633 },
};

function getLocationFromTimezone(
  timezone: string
): { lat: number; lon: number } | null {
  return TIMEZONE_LOCATIONS[timezone] || null;
}

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
    const supabase = await getServerSupabaseClientWithServiceRole();
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(userId);

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const reportDate = new Date().toISOString().split("T")[0];
    const timezone = userData.user.user_metadata?.timezone || "UTC";

    // Try to get location from user metadata first, then from timezone
    let latitude = userData.user.user_metadata?.latitude || null;
    let longitude = userData.user.user_metadata?.longitude || null;

    // If no coordinates, try to get from timezone
    if (!latitude || !longitude) {
      const timezoneLocation = getLocationFromTimezone(timezone);
      if (timezoneLocation) {
        latitude = timezoneLocation.lat;
        longitude = timezoneLocation.lon;
        console.log(
          `🌍 [QueueSchedule] Using timezone-based location for ${timezone}:`,
          { lat: latitude, lon: longitude }
        );
      }
    }

    const userReportData = {
      userId: userData.user.id,
      userEmail: userData.user.email || userEmail, // fallback to provided email
      userName:
        userData.user.user_metadata?.full_name ||
        userData.user.email?.split("@")[0] ||
        "User",
      date: reportDate,
      timezone: timezone,
      latitude: latitude,
      longitude: longitude,
    };

    // Check if report already exists
    const reportAlreadyExists = await reportExists(
      userData.user.id,
      reportDate,
      reportType as "daily" | "weekly"
    );
    if (reportAlreadyExists) {
      const existingReport = await getExistingReport(
        userData.user.id,
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
    const supabase = await getServerSupabaseClientWithServiceRole();

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

    // Get user data from auth.users table
    const userIds = [...new Set(tokens.map((token) => token.user_id))];

    // Get all users from auth.users
    const { data: usersData, error: usersError } =
      await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json({
        success: false,
        error: "Failed to fetch users",
        reportsGenerated: 0,
        usersProcessed: 0,
      });
    }

    // Filter users to only include those with integration tokens
    const users = (usersData?.users || []).filter((user) =>
      userIds.includes(user.id)
    );

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

        const timezone = user.user_metadata?.timezone || "UTC";

        // Try to get location from user metadata first, then from timezone
        let latitude = user.user_metadata?.latitude || null;
        let longitude = user.user_metadata?.longitude || null;

        console.log(
          `📍 [Queue] User ${user.email} coordinates: lat=${latitude}, lon=${longitude}, timezone=${timezone}`
        );

        // If no coordinates, try to get from timezone
        if (!latitude || !longitude) {
          console.log(
            `📍 [Queue] No coordinates found, trying timezone-based location for ${timezone}`
          );
          const timezoneLocation = getLocationFromTimezone(timezone);
          if (timezoneLocation) {
            latitude = timezoneLocation.lat;
            longitude = timezoneLocation.lon;
            console.log(
              `📍 [Queue] Using timezone-based coordinates: lat=${latitude}, lon=${longitude}`
            );
          } else {
            // Fallback to a default location (New York) if timezone mapping fails
            latitude = 40.7128;
            longitude = -74.006;
            console.log(
              `📍 [Queue] Using fallback coordinates (New York): lat=${latitude}, lon=${longitude}`
            );
          }
        }

        const userData = {
          userId: user.id,
          userEmail: user.email || "unknown@example.com", // fallback email
          userName:
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "User",
          date: new Date().toISOString().split("T")[0],
          timezone: timezone,
          latitude: latitude,
          longitude: longitude,
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

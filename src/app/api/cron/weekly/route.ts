import { NextRequest, NextResponse } from "next/server";
import {
  getAllUsersWithIntegrations,
  addUsersToQueue,
} from "@/lib/queue/queue-service";

export async function POST(request: NextRequest) {
  try {
    // Public cron endpoint - no authentication required
    console.log("🕐 Public weekly cron job triggered");

    const now = new Date();
    const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Check if today is Sunday (0)
    if (today !== 0) {
      console.log(`⏭️ Weekly cron skipped - today is not Sunday (${today})`);
      return NextResponse.json({
        success: false,
        message: "Weekly cron only runs on Sundays",
        currentDay: today,
        dayName: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ][today],
      });
    }

    console.log("🕐 Weekly cron triggered at:", now.toISOString());
    console.log("📅 Today is Sunday - starting weekly report generation");

    // Get all users with integrations
    const users = await getAllUsersWithIntegrations();
    const usersWithIntegrations = users.filter((user) => user.hasIntegrations);
    const usersWithoutIntegrations = users.filter(
      (user) => !user.hasIntegrations
    );

    if (usersWithIntegrations.length === 0) {
      console.log("⚠️ No users with integrations found for weekly reports");
      return NextResponse.json({
        success: false,
        message: "No users with integrations found",
        totalUsers: users.length,
        usersWithIntegrations: 0,
        usersWithoutIntegrations: usersWithoutIntegrations.length,
      });
    }

    // Add users to queue for weekly reports
    const jobs = await addUsersToQueue(usersWithIntegrations, "weekly");

    console.log(`✅ Weekly report queue started with ${jobs.length} jobs`);
    console.log(`📊 Total users: ${users.length}`);
    console.log(`🔗 Users with integrations: ${usersWithIntegrations.length}`);
    console.log(
      `❌ Users without integrations: ${usersWithoutIntegrations.length}`
    );

    return NextResponse.json({
      success: true,
      message: `Weekly report queue started with ${jobs.length} jobs`,
      jobsAdded: jobs.length,
      totalUsers: users.length,
      usersWithIntegrations: usersWithIntegrations.length,
      usersWithoutIntegrations: usersWithoutIntegrations.length,
      cronType: "weekly",
      triggeredAt: now.toISOString(),
      dayOfWeek: "Sunday",
    });
  } catch (error) {
    console.error("❌ Weekly cron error:", error);
    return NextResponse.json(
      {
        error: "Failed to start weekly report queue",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check weekly cron status
export async function GET() {
  try {
    const now = new Date();
    const today = now.getDay();
    const isSunday = today === 0;

    return NextResponse.json({
      success: true,
      cronType: "weekly",
      currentDay: today,
      dayName: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][today],
      isSunday,
      nextRun: isSunday ? "Today" : `Next Sunday (in ${7 - today} days)`,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("❌ Error getting weekly cron status:", error);
    return NextResponse.json(
      { error: "Failed to get weekly cron status" },
      { status: 500 }
    );
  }
}

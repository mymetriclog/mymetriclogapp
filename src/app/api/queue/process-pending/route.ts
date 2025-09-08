import { NextRequest, NextResponse } from "next/server";
import {
  getAllUsersWithIntegrations,
  addUsersToQueue,
} from "@/lib/queue/upstash-queue-service";

export async function POST(request: Request) {
  try {
    const { limit = 10, reportType = "daily" } = await request.json();

    // Get all users with integrations
    const users = await getAllUsersWithIntegrations();

    // Filter users with integrations
    const usersWithIntegrations = users.filter((user) => user.hasIntegrations);

    // Limit the number of users to process
    const usersToProcess = usersWithIntegrations.slice(0, limit);

    // Add users to the Upstash QStash queue
    const jobs = await addUsersToQueue(usersToProcess, reportType);

    return NextResponse.json({
      success: true,
      message: "Jobs added to Upstash QStash queue",
      totalUsers: users.length,
      usersWithIntegrations: usersWithIntegrations.length,
      processedUsers: usersToProcess.length,
      jobsAdded: jobs.length,
      reportType,
    });
  } catch (error) {
    console.error("Process pending error:", error);
    return NextResponse.json(
      { error: "Failed to add jobs to queue" },
      { status: 500 }
    );
  }
}

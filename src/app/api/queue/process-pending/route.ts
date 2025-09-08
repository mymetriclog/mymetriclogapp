import { NextRequest, NextResponse } from "next/server";
import {
  userReportQueue,
  getAllUsersWithIntegrations,
  addUsersToQueue,
} from "@/lib/queue/bull-queue-service";
import { processJob } from "@/lib/queue/worker-processor";

export async function POST(request: Request) {
  try {
    const { limit = 10 } = await request.json();

    // Get all users with integrations
    const users = await getAllUsersWithIntegrations();

    // Limit the number of users to process
    const usersToProcess = users.slice(0, limit);

    // Add users to the queue
    const jobs = await addUsersToQueue(usersToProcess);

    // Process each job
    let successCount = 0;
    let failedCount = 0;

    for (const job of jobs) {
      try {
        // Process the job using the worker processor
        const jobData = {
          userId: job.data.userId,
          userEmail: job.data.userEmail,
          queueJobId: job.id,
        };

        await processJob(jobData);
        successCount++;
      } catch (error) {
        failedCount++;
        console.error(`Failed to process job ${job.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      processed: successCount + failedCount,
      successful: successCount,
      failed: failedCount,
      totalUsers: users.length,
      processedUsers: usersToProcess.length,
    });
  } catch (error) {
    console.error("Process pending error:", error);
    return NextResponse.json(
      { error: "Failed to process pending jobs" },
      { status: 500 }
    );
  }
}

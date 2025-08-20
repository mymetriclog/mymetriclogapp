import { NextRequest, NextResponse } from "next/server";
import { userReportQueue } from "@/lib/queue/queue-service";
import { getAllUsersWithIntegrations } from "@/lib/queue/queue-service";

export async function POST(request: Request) {
  try {
    const { limit = 10 } = await request.json();

    // Get pending jobs
    const pendingJobs = await getPendingJobs(limit);

    // Process each job
    let successCount = 0;
    let failedCount = 0;

    for (const job of pendingJobs) {
      try {
        // Process the job
        await processJob(job);
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
    });
  } catch (error) {
    console.error("Process pending error:", error);
    return NextResponse.json(
      { error: "Failed to process pending jobs" },
      { status: 500 }
    );
  }
}

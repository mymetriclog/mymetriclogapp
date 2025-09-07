import { NextRequest, NextResponse } from "next/server";
import { addUserReportJob } from "@/lib/queue/bull-queue-service";

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Testing Bull queue system...");

    // Add a test job to the queue
    const testJob = await addUserReportJob({
      userId: "test-user-123",
      userEmail: "test@example.com",
      reportType: "daily",
    });

    console.log(`✅ Test job added with ID: ${testJob.id}`);

    return NextResponse.json({
      success: true,
      message: "Test job added to Bull queue successfully",
      data: {
        jobId: testJob.id,
        jobName: testJob.name,
        jobData: testJob.data,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Test queue error:", error);
    return NextResponse.json(
      {
        error: "Failed to test queue",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: "Bull queue test endpoint is ready",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Test endpoint error:", error);
    return NextResponse.json(
      {
        error: "Test endpoint failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

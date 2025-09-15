import { NextRequest, NextResponse } from "next/server";
import { Client } from "@upstash/qstash";

// Initialize QStash client
const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      userEmail,
      reportType = "daily",
      delay = 0,
    } = await request.json();

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "userId and userEmail are required" },
        { status: 400 }
      );
    }

    const jobId = `${reportType}-${userId}-${Date.now()}`;

    // Schedule the job
    const result = await qstash.publishJSON({
      url: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/queue/process-upstash`,
      body: {
        userId,
        userEmail,
        reportType,
        jobId,
      },
      delay: delay, // Delay in seconds
      retries: 3, // Retry up to 3 times
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(
      `📅 Scheduled ${reportType} report for ${userEmail} (Job: ${jobId})`
    );

    return NextResponse.json({
      success: true,
      jobId,
      message: `${reportType} report scheduled successfully`,
      qstashMessageId: result.messageId,
    });
  } catch (error) {
    console.error("❌ Error scheduling report:", error);
    return NextResponse.json(
      {
        error: "Failed to schedule report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Schedule daily reports for all users
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
    const { getServerSupabaseClientWithServiceRole } = await import(
      "@/lib/supabase/server"
    );
    const supabase = await getServerSupabaseClientWithServiceRole();

    // First get all integration tokens
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
        scheduledJobs: 0,
      });
    }

    // Get user emails from Supabase Auth using service role
    // Deduplicate user IDs to avoid processing the same user multiple times
    const userIds = [...new Set(tokens.map((token) => token.user_id))];
    const users = [];

    for (const userId of userIds) {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.admin.getUserById(userId);

        if (userError) {
          console.error(`Failed to get user ${userId}:`, userError);
          continue;
        }

        if (user && user.email) {
          users.push({
            id: user.id,
            email: user.email,
          });
        }
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        continue;
      }
    }

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users found",
        scheduledJobs: 0,
      });
    }

    const scheduledJobs = [];

    // Schedule reports for each user
    console.log(
      `📊 Processing ${users.length} unique users for ${reportType} reports`
    );

    for (const user of users) {
      try {
        const jobId = `${reportType}-${user.id}-${Date.now()}`;
        console.log(
          `🔄 Processing user: ${user.email} (${user.id}) with job ID: ${jobId}`
        );

        // Check if we're in development mode (localhost)
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const isLocalhost =
          baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");

        if (isLocalhost) {
          console.log(
            `⚠️ Skipping QStash job for ${user.email} - localhost not accessible to QStash`
          );
          console.log(`💡 To test locally, use ngrok or deploy to Vercel`);

          // For development, we can process the job directly instead of queuing
          try {
            const directResponse = await fetch(
              `${baseUrl}/api/queue/process-upstash`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: user.id,
                  userEmail: user.email,
                  reportType,
                  jobId,
                }),
              }
            );

            if (directResponse.ok) {
              const directResult = await directResponse.json();
              console.log(`✅ Direct processing completed for ${user.email}`);

              // Update direct processing stats
              const { updateDirectProcessingStats } = await import(
                "@/app/api/queue/status/route"
              );
              updateDirectProcessingStats(true);

              scheduledJobs.push({
                userId: user.id,
                userEmail: user.email,
                jobId,
                qstashMessageId: "direct-processing",
                status: "completed",
                result: directResult,
              });
            } else {
              throw new Error(
                `Direct processing failed: ${directResponse.status}`
              );
            }
          } catch (directError) {
            console.error(
              `❌ Direct processing failed for ${user.email}:`,
              directError
            );

            // Update direct processing stats
            const { updateDirectProcessingStats } = await import(
              "@/app/api/queue/status/route"
            );
            updateDirectProcessingStats(false);

            scheduledJobs.push({
              userId: user.id,
              userEmail: user.email,
              jobId,
              qstashMessageId: "direct-processing-failed",
              status: "failed",
              error:
                directError instanceof Error
                  ? directError.message
                  : "Unknown error",
            });
          }
        } else {
          // Production mode - use QStash
          const result = await qstash.publishJSON({
            url: `${baseUrl}/api/queue/process-upstash`,
            body: {
              userId: user.id,
              userEmail: user.email,
              reportType,
              jobId,
            },
            delay: 0,
            retries: 3,
            headers: {
              "Content-Type": "application/json",
            },
          });

          scheduledJobs.push({
            userId: user.id,
            userEmail: user.email,
            jobId,
            qstashMessageId: result.messageId,
          });

          console.log(`📅 Scheduled ${reportType} report for ${user.email}`);
        }
      } catch (jobError) {
        console.error(`❌ Failed to schedule job for ${user.email}:`, jobError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Scheduled ${scheduledJobs.length} ${reportType} reports`,
      scheduledJobs,
    });
  } catch (error) {
    console.error("❌ Error scheduling bulk reports:", error);
    return NextResponse.json(
      {
        error: "Failed to schedule bulk reports",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

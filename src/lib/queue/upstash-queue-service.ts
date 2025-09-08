import { Client } from "@upstash/qstash";

// Queue configuration
const qstash = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

// Job data interface
export interface UserReportJobData {
  userId: string;
  userEmail: string;
  reportType: "daily" | "weekly";
  jobId?: string;
  timestamp?: string;
  attempts?: number;
  status?: "pending" | "processing" | "completed" | "failed";
}

// Add a job to the Upstash queue
export async function addUserReportJob(
  data: UserReportJobData
): Promise<{ messageId: string; jobId: string }> {
  try {
    const jobId = `report-${data.userId}-${Date.now()}`;

    // For development with localhost, process jobs directly
    if (
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_APP_URL?.includes("localhost")
    ) {
      console.log(
        `🔄 Processing job ${jobId} locally for user ${data.userEmail}`
      );

      // Process the job directly by calling the webhook endpoint
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/queue/process-upstash`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...data,
              jobId,
              timestamp: new Date().toISOString(),
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Local processing failed: ${response.status}`);
        }

        console.log(
          `✅ Job ${jobId} processed locally for user ${data.userEmail}`
        );

        return {
          messageId: `local-${jobId}`,
          jobId,
        };
      } catch (processError) {
        console.error(`❌ Error processing job locally:`, processError);
        throw processError;
      }
    }

    // For production, use QStash
    if (!process.env.QSTASH_TOKEN) {
      throw new Error(
        "QSTASH_TOKEN environment variable is not set. Please configure Upstash QStash token."
      );
    }

    const result = await qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/queue/process-upstash`,
      body: {
        ...data,
        jobId,
        timestamp: new Date().toISOString(),
      },
      delay: "0s", // Process immediately
      retries: 2, // Retry 2 times on failure
    });

    console.log(
      `✅ Job ${jobId} added to Upstash queue for user ${data.userEmail}`
    );

    return {
      messageId: result.messageId,
      jobId,
    };
  } catch (error) {
    console.error("❌ Error adding job to Upstash queue:", error);
    throw error;
  }
}

// Add multiple users to queue
export async function addUsersToQueue(users: any[], reportType: string) {
  const jobs = [];

  for (const user of users) {
    try {
      const result = await addUserReportJob({
        userId: user.id,
        userEmail: user.email,
        reportType: reportType as "daily" | "weekly",
      });
      jobs.push(result);
    } catch (error) {
      console.error(`❌ Error adding job for user ${user.email}:`, error);
    }
  }

  return jobs;
}

// Get all users with integrations
export async function getAllUsersWithIntegrations() {
  try {
    const { getServerSupabaseClientWithServiceRole } = await import(
      "@/lib/supabase/server"
    );
    const supabase = await getServerSupabaseClientWithServiceRole();

    // Get all users from auth.users
    const { data: users, error: usersError } =
      await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error("❌ Error fetching users:", usersError);
      return [];
    }

    const usersWithIntegrations = [];

    for (const user of users.users) {
      // Check if user has integration tokens
      const { data: tokens } = await supabase
        .from("integration_tokens")
        .select("provider")
        .eq("user_id", user.id);

      const hasIntegrations = tokens && tokens.length > 0;

      usersWithIntegrations.push({
        id: user.id,
        email: user.email,
        hasIntegrations,
        integrationCount: tokens?.length || 0,
        providers: tokens?.map((t) => t.provider) || [],
      });
    }

    console.log(`📊 Found ${usersWithIntegrations.length} users total`);
    console.log(
      `🔗 Users with integrations: ${
        usersWithIntegrations.filter((u) => u.hasIntegrations).length
      }`
    );

    return usersWithIntegrations;
  } catch (error) {
    console.error("❌ Error getting users with integrations:", error);
    return [];
  }
}

// Get queue statistics (Upstash doesn't provide real-time stats like Bull)
export async function getQueueStats() {
  try {
    // Upstash QStash doesn't provide detailed queue stats
    // We can only track via our own database or logs
    return {
      waiting: 0, // Not available in QStash
      active: 0, // Not available in QStash
      completed: 0, // Not available in QStash
      failed: 0, // Not available in QStash
      delayed: 0, // Not available in QStash
      total: 0,
      successRate: 0,
      message: "Upstash QStash doesn't provide real-time queue statistics",
    };
  } catch (error) {
    console.error("❌ Error getting Upstash queue stats:", error);
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      total: 0,
      successRate: 0,
      error: "Failed to get queue stats",
    };
  }
}

// Pause the queue (Not applicable to QStash - it's event-driven)
export async function pauseQueue() {
  console.log("⚠️ Upstash QStash doesn't support pausing - it's event-driven");
  return { message: "QStash is event-driven and cannot be paused" };
}

// Resume the queue (Not applicable to QStash)
export async function resumeQueue() {
  console.log("⚠️ Upstash QStash doesn't support resuming - it's event-driven");
  return { message: "QStash is event-driven and always active" };
}

// Clean the queue (Not applicable to QStash)
export async function cleanQueue() {
  console.log("⚠️ Upstash QStash doesn't support manual cleaning");
  return { message: "QStash automatically manages message lifecycle" };
}

// Get job by ID (Not directly available in QStash)
export async function getJob(jobId: string) {
  console.log("⚠️ Upstash QStash doesn't provide job lookup by ID");
  return null;
}

// Remove job by ID (Not directly available in QStash)
export async function removeJob(jobId: string) {
  console.log("⚠️ Upstash QStash doesn't support job removal by ID");
  return { message: "QStash doesn't support manual job removal" };
}

// Retry failed job (Not directly available in QStash)
export async function retryJob(jobId: string) {
  console.log("⚠️ Upstash QStash doesn't support manual job retry");
  return { message: "QStash handles retries automatically" };
}

// Close the queue connection (Not applicable to QStash)
export async function closeQueue() {
  console.log("🔌 Upstash QStash doesn't require connection closing");
  return { message: "QStash is stateless and doesn't require closing" };
}

export default qstash;

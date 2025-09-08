import Bull from "bull";
import { getServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

// Queue configuration
const rawRedisUrl =
  process.env.REDIS_URL ||
  "rediss://default:AZTUAAIncDFkMjAxZjY0Y2U5YmM0NDVjODJmMDJlZjY4Njk5NWJiMXAxMzgxMDA@literate-raptor-38100.upstash.io:6379";

// Extract URL from redis-cli command if present
let REDIS_URL: string;
if (rawRedisUrl.includes("redis-cli")) {
  const urlMatch = rawRedisUrl.match(/-u\s+([^\s]+)/);
  if (urlMatch && urlMatch[1]) {
    REDIS_URL = urlMatch[1];
    if (REDIS_URL.startsWith("redis://") && rawRedisUrl.includes("--tls")) {
      REDIS_URL = REDIS_URL.replace("redis://", "rediss://");
    }
  } else {
    REDIS_URL =
      "rediss://default:AZTUAAIncDFkMjAxZjY0Y2U5YmM0NDVjODJmMDJlZjY4Njk5NWJiMXAxMzgxMDA@literate-raptor-38100.upstash.io:6379";
  }
} else {
  REDIS_URL = rawRedisUrl;
}

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

// Create Bull queue
export const userReportQueue = new Bull("user-report-generation", REDIS_URL, {
  redis: {
    // Parse the Redis URL for Bull
    host: REDIS_URL.includes("@")
      ? REDIS_URL.split("@")[1].split(":")[0]
      : "localhost",
    port: REDIS_URL.includes(":")
      ? parseInt(REDIS_URL.split(":").pop()?.split("/")[0] || "6379")
      : 6379,
    password: REDIS_URL.includes("@")
      ? REDIS_URL.split("://")[1].split("@")[0].split(":")[1]
      : undefined,
    // Enable TLS if using rediss://
    ...(REDIS_URL.startsWith("rediss://") && {
      tls: {
        rejectUnauthorized: false,
      },
    }),
  },
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: "exponential", // Exponential backoff
      delay: 2000, // Start with 2 seconds
    },
    delay: 0, // No initial delay
  },
});

// Queue event listeners
userReportQueue.on("ready", () => {
  console.log("✅ Bull queue is ready and connected to Redis");
});

userReportQueue.on("error", (error) => {
  console.error("❌ Bull queue error:", error);
});

userReportQueue.on("waiting", (jobId) => {
  console.log(`⏳ Job ${jobId} is waiting`);
});

userReportQueue.on("active", (job) => {
  console.log(`🚀 Job ${job.id} is now active`);
});

userReportQueue.on("completed", (job, result) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

userReportQueue.on("failed", (job, err) => {
  console.log(`❌ Job ${job.id} failed:`, err.message);
});

userReportQueue.on("stalled", (job) => {
  console.log(`⚠️ Job ${job.id} stalled`);
});

// Add a job to the queue
export async function addUserReportJob(
  data: UserReportJobData
): Promise<Bull.Job> {
  try {
    const job = await userReportQueue.add("generate-user-report", data, {
      priority: 1, // Higher priority
      delay: 0,
    });

    console.log(
      `✅ Job ${job.id} added to Bull queue for user ${data.userEmail}`
    );
    return job;
  } catch (error) {
    console.error("❌ Error adding job to Bull queue:", error);
    throw error;
  }
}

// Get queue statistics
export async function getQueueStats() {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      userReportQueue.getWaiting(),
      userReportQueue.getActive(),
      userReportQueue.getCompleted(),
      userReportQueue.getFailed(),
      userReportQueue.getDelayed(),
    ]);

    const total =
      waiting.length +
      active.length +
      completed.length +
      failed.length +
      delayed.length;
    const successRate = total > 0 ? (completed.length / total) * 100 : 0;

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total,
      successRate: Math.round(successRate * 100) / 100,
    };
  } catch (error) {
    console.error("❌ Error getting Bull queue stats:", error);
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      total: 0,
      successRate: 0,
    };
  }
}

// Pause the queue
export async function pauseQueue() {
  await userReportQueue.pause();
  console.log("⏸️ Queue paused");
}

// Resume the queue
export async function resumeQueue() {
  await userReportQueue.resume();
  console.log("▶️ Queue resumed");
}

// Clean the queue (remove old jobs)
export async function cleanQueue() {
  await userReportQueue.clean(24 * 60 * 60 * 1000, "completed"); // Remove completed jobs older than 24 hours
  await userReportQueue.clean(7 * 24 * 60 * 60 * 1000, "failed"); // Remove failed jobs older than 7 days
  console.log("🧹 Queue cleaned");
}

// Get job by ID
export async function getJob(jobId: string) {
  return await userReportQueue.getJob(jobId);
}

// Remove job by ID
export async function removeJob(jobId: string) {
  const job = await userReportQueue.getJob(jobId);
  if (job) {
    await job.remove();
    console.log(`🗑️ Job ${jobId} removed`);
  }
}

// Retry failed job
export async function retryJob(jobId: string) {
  const job = await userReportQueue.getJob(jobId);
  if (job) {
    await job.retry();
    console.log(`🔄 Job ${jobId} retried`);
  }
}

// Close the queue connection
export async function closeQueue() {
  await userReportQueue.close();
  console.log("🔌 Bull queue connection closed");
}

// Get all users with integrations
export async function getAllUsersWithIntegrations() {
  try {
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

// Add users to queue
export async function addUsersToQueue(users: any[], reportType: string) {
  const jobs = [];

  for (const user of users) {
    try {
      const job = await addUserReportJob({
        userId: user.id,
        userEmail: user.email,
        reportType: reportType as "daily" | "weekly",
      });
      jobs.push(job);
    } catch (error) {
      console.error(`❌ Error adding job for user ${user.email}:`, error);
    }
  }

  return jobs;
}

export default userReportQueue;

import { getServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";
import Queue from "bull";

// Queue configuration
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const QUEUE_NAME = "user-report-generation";

// Redis connection options for Upstash (TLS required)
const redisOptions = {
  redis: {
    host: "literate-raptor-38100.upstash.io",
    port: 6379,
    password: process.env.REDIS_password,
    username: "default",
    tls: {
      rejectUnauthorized: false,
    },
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    lazyConnect: true,
    connectTimeout: 60000,
    commandTimeout: 5000,
  },
};

console.log("🔍 Redis Configuration:");
console.log("📡 Using Upstash Redis with TLS");
console.log("🏠 Host: literate-raptor-38100.upstash.io:6379");

// Create the main queue with proper Upstash configuration
export const userReportQueue = new Queue(QUEUE_NAME, {
  redis: redisOptions.redis,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: "exponential",
      delay: 2000, // Start with 2 seconds delay
    },
  },
});

// Add connection event listeners for debugging
userReportQueue.on("ready", () => {
  console.log("✅ Queue is ready and connected to Upstash Redis");
});

userReportQueue.on("error", (error) => {
  console.error("❌ Queue error:", error);
});

userReportQueue.on("failed", (job, err) => {
  console.error("❌ Job failed:", job.id, err);
});

// Log queue creation
console.log("🚀 Queue created with Upstash configuration");
console.log(
  "📊 Queue client status:",
  userReportQueue.client?.status || "connecting"
);

// Job data interface
export interface UserReportJobData {
  userId: string;
  userEmail: string;
}

// Get all users with their integration status
export async function getAllUsersWithIntegrations() {
  try {
    const supabase = await getServerSupabaseClientWithServiceRole();

    // Get all users from auth.users
    const { data: users, error: usersError } =
      await supabase.auth.admin.listUsers();

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    // Get integration tokens for all users
    const { data: integrationTokens, error: tokensError } = await supabase
      .from("integration_tokens")
      .select("user_id, provider");

    if (tokensError) {
      throw new Error(
        `Failed to fetch integration tokens: ${tokensError.message}`
      );
    }

    // Create a map of users with their integration status
    const usersWithIntegrations = users.users
      .filter((user) => user.email_confirmed_at) // Only confirmed users
      .map((user) => {
        const userTokens = integrationTokens.filter(
          (token) => token.user_id === user.id
        );
        const hasIntegrations = userTokens.length > 0;

        return {
          id: user.id,
          email: user.email!,
          hasIntegrations,
          integrationCount: userTokens.length,
          createdAt: user.created_at,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ); // Newest first

    return usersWithIntegrations;
  } catch (error) {
    console.error("Error fetching users with integrations:", error);
    throw error;
  }
}

// Add users to the queue
export async function addUsersToQueue(
  users: Array<{ id: string; email: string; hasIntegrations: boolean }>
) {
  try {
    const jobs = [];

    for (const user of users) {
      if (!user.hasIntegrations) {
        // Skip users without integrations
        console.log(`Skipping user ${user.email}: No integrations found`);
        continue;
      }

      // Add job directly to queue without tracking
      const job = await userReportQueue.add("generate-user-report", {
        userId: user.id,
        userEmail: user.email,
      });

      jobs.push(job);
    }

    return jobs;
  } catch (error) {
    console.error("Error adding users to queue:", error);
    throw error;
  }
}

// Get queue statistics (simplified without database tracking)
export async function getQueueStats() {
  try {
    // Return basic stats without database tracking
    return {
      summary: {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        skipped: 0,
        successRate: 0,
      },
      queueItems: [],
      recentActivity: [],
    };
  } catch (error) {
    console.error("Error getting queue stats:", error);
    throw error;
  }
}

// Get queue status (simplified without database tracking)
export async function getQueueStatus() {
  try {
    // Return basic status without database tracking
    return {
      isActive: true,
      totalJobs: 0,
      pendingJobs: 0,
      processingJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      successRate: 0,
    };
  } catch (error) {
    console.error("Error getting queue status:", error);
    throw error;
  }
}

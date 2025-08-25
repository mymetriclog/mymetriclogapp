import { getServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";
import { createClient } from "redis";

// Queue configuration
const rawRedisUrl =
  process.env.REDIS_URL ||
  "rediss://default:AZTUAAIncDFkMjAxZjY0Y2U5YmM0NDVjODJmMDJlZjY4Njk5NWJiMXAxMzgxMDA@literate-raptor-38100.upstash.io:6379";

// Extract URL from redis-cli command if present
let REDIS_URL: string;
if (rawRedisUrl.includes("redis-cli")) {
  // Extract URL from redis-cli command: redis-cli --tls -u <URL>
  const urlMatch = rawRedisUrl.match(/-u\s+([^\s]+)/);
  if (urlMatch && urlMatch[1]) {
    REDIS_URL = urlMatch[1];
    // If the URL uses redis:// but we need TLS, convert it to rediss://
    if (REDIS_URL.startsWith("redis://") && rawRedisUrl.includes("--tls")) {
      REDIS_URL = REDIS_URL.replace("redis://", "rediss://");
    }
  } else {
    // Fallback to the original provided URL
    REDIS_URL =
      "rediss://default:AZTUAAIncDFkMjAxZjY0Y2U5YmM0NDVjODJmMDJlZjY4Njk5NWJiMXAxMzgxMDA@literate-raptor-38100.upstash.io:6379";
  }
} else {
  REDIS_URL = rawRedisUrl;
}

const QUEUE_NAME = "user-report-generation";

console.log("🔍 Redis Configuration:");
console.log("📡 Using Upstash Redis with native Redis client");
console.log("🔗 Raw input:", rawRedisUrl.replace(/:[^:]*@/, ":***@")); // Hide password in logs
console.log("🔗 Extracted URL:", REDIS_URL.replace(/:[^:]*@/, ":***@")); // Hide password in logs

// Create Redis client
const redisClient = createClient({
  url: REDIS_URL,
  socket: {
    // Only enable TLS if the URL uses rediss:// protocol
    ...(REDIS_URL.startsWith("rediss://") && {
      tls: true,
      rejectUnauthorized: false,
    }),
  },
});

// Connection event listeners
redisClient.on("connect", () => {
  console.log("🔄 Connecting to Upstash Redis...");
});

redisClient.on("ready", () => {
  console.log("✅ Redis client is ready and connected to Upstash");
});

redisClient.on("error", (error) => {
  console.error("❌ Redis client error:", error);
});

redisClient.on("end", () => {
  console.log("🔌 Redis connection ended");
});

// Connect to Redis
redisClient.connect().catch((error) => {
  console.error("❌ Failed to connect to Redis:", error);
});

// Export the client for use in other parts of the application
export { redisClient };

// Job data interface
export interface UserReportJobData {
  userId: string;
  userEmail: string;
  jobId?: string;
  timestamp?: string;
  attempts?: number;
  status?: "pending" | "processing" | "completed" | "failed";
}

// Queue operations using native Redis
export class RedisQueue {
  private queueKey: string;
  private processingKey: string;
  private failedKey: string;
  private completedKey: string;

  constructor(queueName: string) {
    this.queueKey = `queue:${queueName}`;
    this.processingKey = `queue:${queueName}:processing`;
    this.failedKey = `queue:${queueName}:failed`;
    this.completedKey = `queue:${queueName}:completed`;
  }

  // Add a job to the queue
  async add(jobType: string, data: UserReportJobData): Promise<string> {
    const jobId = `${jobType}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const job = {
      id: jobId,
      type: jobType,
      data,
      timestamp: new Date().toISOString(),
      attempts: 0,
      status: "pending" as const,
    };

    await redisClient.lPush(this.queueKey, JSON.stringify(job));
    console.log(`✅ Job ${jobId} added to queue`);
    return jobId;
  }

  // Get a job from the queue for processing
  async getNextJob(): Promise<any | null> {
    try {
      // Move job from queue to processing
      const jobStr = await redisClient.brPop(this.queueKey, 1); // 1 second timeout
      if (!jobStr) return null;

      const job = JSON.parse(jobStr.element);
      job.status = "processing";
      job.processingStarted = new Date().toISOString();

      // Add to processing queue
      await redisClient.lPush(this.processingKey, JSON.stringify(job));

      return job;
    } catch (error) {
      console.error("❌ Error getting next job:", error);
      return null;
    }
  }

  // Mark job as completed
  async completeJob(jobId: string, result?: any): Promise<void> {
    try {
      // Remove from processing queue
      const processingJobs = await redisClient.lRange(
        this.processingKey,
        0,
        -1
      );
      for (let i = 0; i < processingJobs.length; i++) {
        const job = JSON.parse(processingJobs[i]);
        if (job.id === jobId) {
          await redisClient.lRem(this.processingKey, 1, processingJobs[i]);

          // Add to completed queue
          job.status = "completed";
          job.completedAt = new Date().toISOString();
          if (result) job.result = result;

          await redisClient.lPush(this.completedKey, JSON.stringify(job));

          // Keep only last 100 completed jobs
          await redisClient.lTrim(this.completedKey, 0, 99);

          console.log(`✅ Job ${jobId} marked as completed`);
          break;
        }
      }
    } catch (error) {
      console.error(`❌ Error completing job ${jobId}:`, error);
    }
  }

  // Mark job as failed
  async failJob(jobId: string, error: string): Promise<void> {
    try {
      // Remove from processing queue
      const processingJobs = await redisClient.lRange(
        this.processingKey,
        0,
        -1
      );
      for (let i = 0; i < processingJobs.length; i++) {
        const job = JSON.parse(processingJobs[i]);
        if (job.id === jobId) {
          await redisClient.lRem(this.processingKey, 1, processingJobs[i]);

          job.attempts = (job.attempts || 0) + 1;

          // Retry logic - max 3 attempts
          if (job.attempts < 3) {
            // Re-queue for retry with exponential backoff
            job.status = "pending";
            job.retryAt = new Date(
              Date.now() + Math.pow(2, job.attempts) * 1000
            ).toISOString();
            await redisClient.lPush(this.queueKey, JSON.stringify(job));
            console.log(
              `🔄 Job ${jobId} re-queued for retry (attempt ${job.attempts})`
            );
          } else {
            // Max attempts reached, mark as failed
            job.status = "failed";
            job.failedAt = new Date().toISOString();
            job.error = error;

            await redisClient.lPush(this.failedKey, JSON.stringify(job));

            // Keep only last 50 failed jobs
            await redisClient.lTrim(this.failedKey, 0, 49);

            console.log(
              `❌ Job ${jobId} failed after ${job.attempts} attempts`
            );
          }
          break;
        }
      }
    } catch (redisError) {
      console.error(`❌ Error failing job ${jobId}:`, redisError);
    }
  }

  // Get queue statistics
  async getStats(): Promise<any> {
    try {
      const [pending, processing, completed, failed] = await Promise.all([
        redisClient.lLen(this.queueKey),
        redisClient.lLen(this.processingKey),
        redisClient.lLen(this.completedKey),
        redisClient.lLen(this.failedKey),
      ]);

      const total = pending + processing + completed + failed;
      const successRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        pending,
        processing,
        completed,
        failed,
        total,
        successRate: Math.round(successRate * 100) / 100,
      };
    } catch (error) {
      console.error("❌ Error getting queue stats:", error);
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: 0,
        successRate: 0,
      };
    }
  }

  // Clear completed jobs
  async clearCompleted(): Promise<void> {
    await redisClient.del(this.completedKey);
    console.log("🧹 Completed jobs cleared");
  }

  // Clear failed jobs
  async clearFailed(): Promise<void> {
    await redisClient.del(this.failedKey);
    console.log("🧹 Failed jobs cleared");
  }

  // Clear all jobs
  async clearAll(): Promise<void> {
    await Promise.all([
      redisClient.del(this.queueKey),
      redisClient.del(this.processingKey),
      redisClient.del(this.completedKey),
      redisClient.del(this.failedKey),
    ]);
    console.log("🧹 All jobs cleared");
  }

  // Check if queue is active (Redis connection is ready)
  isActive(): boolean {
    return redisClient.isReady;
  }
}

// Create queue instance
export const userReportQueue = new RedisQueue(QUEUE_NAME);

console.log("🚀 Native Redis queue created");
console.log("📊 Queue name:", QUEUE_NAME);

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

      // Add job to Redis queue
      const jobId = await userReportQueue.add("generate-user-report", {
        userId: user.id,
        userEmail: user.email,
      });

      jobs.push({ id: jobId, userId: user.id, userEmail: user.email });
    }

    console.log(`✅ Added ${jobs.length} jobs to queue`);
    return jobs;
  } catch (error) {
    console.error("Error adding users to queue:", error);
    throw error;
  }
}

// Get queue statistics
export async function getQueueStats() {
  try {
    const stats = await userReportQueue.getStats();

    return {
      summary: {
        total: stats.total,
        pending: stats.pending,
        processing: stats.processing,
        completed: stats.completed,
        failed: stats.failed,
        skipped: 0, // Not tracked separately in this implementation
        successRate: stats.successRate,
      },
      queueItems: [], // Could be implemented if needed
      recentActivity: [], // Could be implemented if needed
    };
  } catch (error) {
    console.error("Error getting queue stats:", error);
    throw error;
  }
}

// Get queue status
export async function getQueueStatus() {
  try {
    const stats = await userReportQueue.getStats();

    return {
      isActive: userReportQueue.isActive(),
      totalJobs: stats.total,
      pendingJobs: stats.pending,
      processingJobs: stats.processing,
      completedJobs: stats.completed,
      failedJobs: stats.failed,
      successRate: stats.successRate,
    };
  } catch (error) {
    console.error("Error getting queue status:", error);
    throw error;
  }
}

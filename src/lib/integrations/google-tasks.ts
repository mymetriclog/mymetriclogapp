import { getServerSupabaseClient } from "@/lib/supabase/server";

export interface GoogleTasksData {
  summary: string;
  tasks: any[];
  completedTasks: any[];
  pendingTasks: any[];
  analysis: any;
}

export class GoogleTasksService {
  private baseUrl = "https://tasks.googleapis.com/tasks/v1";

  async getDailyData(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<GoogleTasksData> {
    try {
      const accessToken = await this.getValidAccessToken(userId);
      if (!accessToken) {
        return this.getFallbackData();
      }

      // Get all task lists
      const taskLists = await this.fetchTaskLists(accessToken);
      if (!taskLists || taskLists.length === 0) {
        return this.getFallbackData();
      }

      // Get tasks from all lists
      const allTasks = [];
      for (const list of taskLists) {
        const tasks = await this.fetchTasks(accessToken, list.id);
        allTasks.push(...tasks);
      }

      // Filter tasks by date range
      const filteredTasks = this.filterTasksByDateRange(
        allTasks,
        startDate,
        endDate
      );

      // Separate completed and pending tasks
      const completedTasks = filteredTasks.filter(
        (task) => task.status === "completed"
      );
      const pendingTasks = filteredTasks.filter(
        (task) => task.status === "needsAction"
      );

      // Analyze tasks
      const analysis = this.analyzeTasks(
        filteredTasks,
        completedTasks,
        pendingTasks
      );

      // Generate summary
      const summary = this.generateSummary(
        completedTasks,
        pendingTasks,
        analysis
      );

      return {
        summary,
        tasks: filteredTasks,
        completedTasks,
        pendingTasks,
        analysis,
      };
    } catch (error) {
      console.error(
        "❌ [GoogleTasksService] Error fetching daily data:",
        error
      );
      return this.getFallbackData();
    }
  }

  async getWeeklyData(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<GoogleTasksData> {
    try {
      const accessToken = await this.getValidAccessToken(userId);
      if (!accessToken) {
        return this.getFallbackData();
      }

      // Get all task lists
      const taskLists = await this.fetchTaskLists(accessToken);
      if (!taskLists || taskLists.length === 0) {
        return this.getFallbackData();
      }

      // Get tasks from all lists
      const allTasks = [];
      for (const list of taskLists) {
        const tasks = await this.fetchTasks(accessToken, list.id);
        allTasks.push(...tasks);
      }

      // Filter tasks by date range
      const filteredTasks = this.filterTasksByDateRange(
        allTasks,
        startDate,
        endDate
      );

      // Separate completed and pending tasks
      const completedTasks = filteredTasks.filter(
        (task) => task.status === "completed"
      );
      const pendingTasks = filteredTasks.filter(
        (task) => task.status === "needsAction"
      );

      // Analyze tasks
      const analysis = this.analyzeTasks(
        filteredTasks,
        completedTasks,
        pendingTasks
      );

      // Generate summary
      const summary = this.generateSummary(
        completedTasks,
        pendingTasks,
        analysis
      );

      return {
        summary,
        tasks: filteredTasks,
        completedTasks,
        pendingTasks,
        analysis,
      };
    } catch (error) {
      console.error(
        "❌ [GoogleTasksService] Error fetching weekly data:",
        error
      );
      return this.getFallbackData();
    }
  }

  private async getValidAccessToken(userId: string): Promise<string | null> {
    try {
      const supabase = await getServerSupabaseClient();
      const { data, error } = await supabase
        .from("integration_tokens")
        .select("*")
        .eq("user_id", userId)
        .eq("provider", "google-tasks")
        .single();

      if (error || !data) {
        console.log("No Google Tasks token found for user:", userId);
        return null;
      }

      // Check if token is expired
      const now = new Date();
      const expiresAt = new Date(data.expires_at);

      if (expiresAt <= now) {
        console.log("Google Tasks token expired, attempting refresh...");
        return await this.refreshAccessToken(userId, data.refresh_token);
      }

      return data.access_token;
    } catch (error) {
      console.error(
        "❌ [GoogleTasksService] Error getting access token:",
        error
      );
      return null;
    }
  }

  private async refreshAccessToken(
    userId: string,
    refreshToken: string
  ): Promise<string | null> {
    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!response.ok) {
        console.error("Failed to refresh Google Tasks token");
        return null;
      }

      const data = await response.json();
      const expiresAt = new Date(Date.now() + data.expires_in * 1000);

      // Update the token in database
      const supabase = await getServerSupabaseClient();
      await supabase
        .from("integration_tokens")
        .update({
          access_token: data.access_token,
          expires_at: expiresAt.toISOString(),
        })
        .eq("user_id", userId)
        .eq("provider", "google-tasks");

      return data.access_token;
    } catch (error) {
      console.error("❌ [GoogleTasksService] Error refreshing token:", error);
      return null;
    }
  }

  private async fetchTaskLists(accessToken: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users/@me/lists`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error(
        "❌ [GoogleTasksService] Error fetching task lists:",
        error
      );
      return [];
    }
  }

  private async fetchTasks(
    accessToken: string,
    taskListId: string
  ): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/lists/${taskListId}/tasks?showCompleted=true&showHidden=true`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("❌ [GoogleTasksService] Error fetching tasks:", error);
      return [];
    }
  }

  private filterTasksByDateRange(
    tasks: any[],
    startDate: Date,
    endDate: Date
  ): any[] {
    return tasks.filter((task) => {
      if (!task.due) return false;

      const taskDate = new Date(task.due);
      return taskDate >= startDate && taskDate <= endDate;
    });
  }

  private analyzeTasks(
    allTasks: any[],
    completedTasks: any[],
    pendingTasks: any[]
  ): any {
    const totalTasks = allTasks.length;
    const completedCount = completedTasks.length;
    const pendingCount = pendingTasks.length;
    const completionRate =
      totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

    // Analyze task priorities
    const highPriorityTasks = allTasks.filter(
      (task) =>
        task.notes?.includes("high priority") ||
        task.title?.toLowerCase().includes("urgent")
    );
    const mediumPriorityTasks = allTasks.filter((task) =>
      task.notes?.includes("medium priority")
    );
    const lowPriorityTasks = allTasks.filter((task) =>
      task.notes?.includes("low priority")
    );

    // Analyze overdue tasks
    const now = new Date();
    const overdueTasks = allTasks.filter((task) => {
      if (!task.due || task.status === "completed") return false;
      return new Date(task.due) < now;
    });

    return {
      totalTasks,
      completedCount,
      pendingCount,
      completionRate: Math.round(completionRate),
      highPriorityTasks: highPriorityTasks.length,
      mediumPriorityTasks: mediumPriorityTasks.length,
      lowPriorityTasks: lowPriorityTasks.length,
      overdueTasks: overdueTasks.length,
      averageTasksPerDay: totalTasks > 0 ? Math.round(totalTasks / 7) : 0,
    };
  }

  private generateSummary(
    completedTasks: any[],
    pendingTasks: any[],
    analysis: any
  ): string {
    const completedCount = completedTasks.length;
    const pendingCount = pendingTasks.length;
    const completionRate = analysis.completionRate;

    let summary = `📋 Task Summary: ${completedCount} completed, ${pendingCount} pending`;

    if (completionRate >= 80) {
      summary += `\n🎉 Excellent productivity! ${completionRate}% completion rate`;
    } else if (completionRate >= 60) {
      summary += `\n👍 Good progress! ${completionRate}% completion rate`;
    } else if (completionRate >= 40) {
      summary += `\n📈 Room for improvement. ${completionRate}% completion rate`;
    } else {
      summary += `\n⚠️ Consider focusing on task completion. ${completionRate}% completion rate`;
    }

    if (analysis.overdueTasks > 0) {
      summary += `\n🚨 ${analysis.overdueTasks} overdue tasks need attention`;
    }

    if (analysis.highPriorityTasks > 0) {
      summary += `\n🔥 ${analysis.highPriorityTasks} high priority tasks`;
    }

    return summary;
  }

  private getFallbackData(): GoogleTasksData {
    return {
      summary:
        "No Google Tasks data available. Connect your Google Tasks account to see your task analytics.",
      tasks: [],
      completedTasks: [],
      pendingTasks: [],
      analysis: {
        totalTasks: 0,
        completedCount: 0,
        pendingCount: 0,
        completionRate: 0,
        highPriorityTasks: 0,
        mediumPriorityTasks: 0,
        lowPriorityTasks: 0,
        overdueTasks: 0,
        averageTasksPerDay: 0,
      },
    };
  }
}

// Export functions for API routes
export async function getGoogleTasksAccessToken(
  userId: string
): Promise<string | null> {
  const service = new GoogleTasksService();
  return await service["getValidAccessToken"](userId);
}

export async function getGoogleTasksStats(accessToken: string): Promise<any> {
  try {
    const response = await fetch(
      "https://tasks.googleapis.com/tasks/v1/users/@me/lists",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      totalLists: data.items?.length || 0,
      lists: data.items || [],
    };
  } catch (error) {
    console.error("❌ [GoogleTasksService] Error getting stats:", error);
    return null;
  }
}

export async function getGoogleTasksWithDetails(
  accessToken: string,
  taskListId: string
): Promise<any[]> {
  try {
    const response = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?showCompleted=true&showHidden=true`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("❌ [GoogleTasksService] Error getting tasks:", error);
    return [];
  }
}

/**
 * Upsert Google Tasks tokens to database
 */
export async function upsertGoogleTasksTokens(
  userId: string,
  tokenData: any
): Promise<void> {
  try {
    const supabase = await getServerSupabaseClient();

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    console.log("🔐 [GoogleTasks] Upserting tokens for user:", userId);

    const { error } = await supabase.from("integration_tokens").upsert({
      user_id: userId,
      provider: "google-tasks",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt.toISOString(),
      scope: tokenData.scope,
      token_type: tokenData.token_type || "Bearer",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("❌ [GoogleTasks] Failed to upsert tokens:", error);
      throw error;
    }

    console.log("✅ [GoogleTasks] Tokens upserted successfully");
  } catch (error) {
    console.error("❌ [GoogleTasks] Error upserting tokens:", error);
    throw error;
  }
}

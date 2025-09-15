import { getServerSupabaseClient } from "@/lib/supabase/server";

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
};

type GoogleTask = {
  id: string;
  title: string;
  notes?: string;
  status: "needsAction" | "completed";
  due?: string;
  completed?: string;
  created: string;
  updated: string;
  parent?: string;
  position: string;
  links?: Array<{
    type: string;
    link: string;
  }>;
};

type GoogleTasksList = {
  id: string;
  title: string;
  updated: string;
  selfLink: string;
};

type GoogleTasksStats = {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  tasksByList: Array<{
    listId: string;
    listTitle: string;
    total: number;
    completed: number;
    pending: number;
  }>;
  recentTasks: GoogleTask[];
  productivityScore: number;
  summary: string;
};

export async function upsertGoogleTasksTokens(
  userId: string,
  tok: TokenResponse
) {
  const supabase = await getServerSupabaseClient();
  const now = Math.floor(Date.now() / 1000);
  const expires_at = now + (tok.expires_in ?? 3600) - 60; // 1 hour default

  const { data: existing } = await supabase
    .from("integration_tokens")
    .select("refresh_token")
    .eq("user_id", userId)
    .eq("provider", "google-tasks")
    .maybeSingle();

  const { error } = await supabase.from("integration_tokens").upsert(
    {
      user_id: userId,
      provider: "google-tasks",
      access_token: tok.access_token.trim(),
      refresh_token: tok.refresh_token ?? existing?.refresh_token ?? null,
      scope: tok.scope?.trim() ?? "https://www.googleapis.com/auth/tasks",
      token_type: tok.token_type ?? "Bearer",
      expires_at,
    },
    { onConflict: "user_id,provider" }
  );

  if (error) {
    console.log("❌ Error storing Google Tasks tokens:", error);
    throw error;
  }
}

export async function getGoogleTasksAccessToken(
  userId: string
): Promise<string | null> {
  try {
    const { getServerSupabaseClientWithServiceRole } = await import(
      "@/lib/supabase/server"
    );
    const supabase = await getServerSupabaseClientWithServiceRole();

    const { data, error } = await supabase
      .from("integration_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", userId)
      .eq("provider", "google-tasks")
      .maybeSingle();

    if (error) {
      console.log("❌ Google Tasks token query error:", error);
      return null;
    }

    if (!data) {
      console.log("❌ No Google Tasks token data found for user:", userId);
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    if (data.expires_at && data.expires_at > now && data.access_token) {
      return data.access_token;
    }

    if (!data.refresh_token) {
      console.log("❌ No refresh token available for Google Tasks");
      return null;
    }

    const refreshed = await refreshGoogleTasksToken(data.refresh_token);
    if (!refreshed) {
      console.log("❌ Failed to refresh Google Tasks token");
      return null;
    }

    await upsertGoogleTasksTokens(userId, refreshed);
    return refreshed.access_token;
  } catch (error) {
    console.error("❌ Error in getGoogleTasksAccessToken:", error);
    return null;
  }
}

async function refreshGoogleTasksToken(
  refreshToken: string
): Promise<TokenResponse | null> {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return null;
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      return null;
    }

    const tokenData = await response.json();
    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || refreshToken,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type || "Bearer",
      scope: tokenData.scope,
    };
  } catch (error) {
    return null;
  }
}

export async function getGoogleTasksLists(
  accessToken: string
): Promise<GoogleTasksList[]> {
  try {
    const response = await fetch(
      "https://tasks.googleapis.com/tasks/v1/users/@me/lists",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("❌ Error fetching Google Tasks lists:", error);
    return [];
  }
}

export async function getGoogleTasks(
  accessToken: string,
  listId: string = "@default"
): Promise<GoogleTask[]> {
  try {
    const response = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=true&showHidden=true`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("❌ Error fetching Google Tasks:", error);
    return [];
  }
}

export async function getGoogleTasksStats(
  accessToken: string,
  date?: Date
): Promise<GoogleTasksStats | null> {
  try {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all task lists
    const lists = await getGoogleTasksLists(accessToken);

    let allTasks: GoogleTask[] = [];
    const tasksByList: Array<{
      listId: string;
      listTitle: string;
      total: number;
      completed: number;
      pending: number;
    }> = [];

    // Get tasks from each list
    for (const list of lists) {
      const tasks = await getGoogleTasks(accessToken, list.id);
      allTasks = allTasks.concat(tasks);

      const completed = tasks.filter(
        (task) => task.status === "completed"
      ).length;
      const pending = tasks.filter(
        (task) => task.status === "needsAction"
      ).length;

      tasksByList.push({
        listId: list.id,
        listTitle: list.title,
        total: tasks.length,
        completed,
        pending,
      });
    }

    // Filter tasks for the target date
    const todayTasks = allTasks.filter((task) => {
      if (task.completed) {
        const completedDate = new Date(task.completed);
        return completedDate >= startOfDay && completedDate <= endOfDay;
      }
      if (task.due) {
        const dueDate = new Date(task.due);
        return dueDate >= startOfDay && dueDate <= endOfDay;
      }
      return false;
    });

    const totalTasks = todayTasks.length;
    const completedTasks = todayTasks.filter(
      (task) => task.status === "completed"
    ).length;
    const pendingTasks = todayTasks.filter(
      (task) => task.status === "needsAction"
    ).length;

    // Calculate overdue tasks (due today but not completed)
    const overdueTasks = todayTasks.filter((task) => {
      if (task.status === "completed") return false;
      if (!task.due) return false;
      const dueDate = new Date(task.due);
      return dueDate < endOfDay;
    }).length;

    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate productivity score (0-100)
    let productivityScore = 0;
    if (totalTasks > 0) {
      productivityScore = Math.round((completedTasks / totalTasks) * 100);

      // Bonus for completing all tasks
      if (completedTasks === totalTasks && totalTasks > 0) {
        productivityScore = Math.min(100, productivityScore + 10);
      }

      // Penalty for overdue tasks
      if (overdueTasks > 0) {
        productivityScore = Math.max(0, productivityScore - overdueTasks * 5);
      }
    } else {
      productivityScore = 50; // Neutral score when no tasks
    }

    // Get recent tasks (last 10)
    const recentTasks = allTasks
      .sort(
        (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
      )
      .slice(0, 10);

    // Generate summary
    let summary = "No task activity today";
    if (totalTasks > 0) {
      if (completedTasks === totalTasks) {
        summary = `Excellent productivity! Completed all ${totalTasks} tasks for today.`;
      } else if (completedTasks > 0) {
        summary = `Good progress! Completed ${completedTasks} of ${totalTasks} tasks (${completionRate}% completion rate).`;
      } else {
        summary = `You have ${pendingTasks} pending tasks for today.`;
      }

      if (overdueTasks > 0) {
        summary += ` ${overdueTasks} tasks are overdue.`;
      }
    }

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate,
      tasksByList,
      recentTasks,
      productivityScore,
      summary,
    };
  } catch (error) {
    console.error("❌ Error in getGoogleTasksStats:", error);
    return null;
  }
}

export async function createGoogleTask(
  accessToken: string,
  listId: string,
  title: string,
  notes?: string,
  due?: string
): Promise<GoogleTask | null> {
  try {
    const response = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          notes,
          due,
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error creating Google Task:", error);
    return null;
  }
}

export async function updateGoogleTask(
  accessToken: string,
  listId: string,
  taskId: string,
  updates: Partial<GoogleTask>
): Promise<GoogleTask | null> {
  try {
    const response = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error updating Google Task:", error);
    return null;
  }
}

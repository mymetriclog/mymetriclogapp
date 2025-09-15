import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import {
  getGoogleTasksAccessToken,
  getGoogleTasksStats,
  getGoogleTasksWithDetails,
} from "@/lib/integrations/google-tasks";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const accessToken = await getGoogleTasksAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Google Tasks not connected" },
        { status: 403 }
      );
    }

    // Get task lists statistics
    const stats = await getGoogleTasksStats(accessToken);
    if (!stats) {
      return NextResponse.json(
        { error: "Failed to fetch Google Tasks statistics" },
        { status: 500 }
      );
    }

    // Get tasks from all lists
    const allTasks = [];
    for (const list of stats.lists) {
      const tasks = await getGoogleTasksWithDetails(accessToken, list.id);
      allTasks.push(
        ...tasks.map((task) => ({
          ...task,
          listTitle: list.title,
          listId: list.id,
        }))
      );
    }

    // Calculate additional metrics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const tasksToday = allTasks.filter((task) => {
      if (!task.due) return false;
      const taskDate = new Date(task.due);
      return taskDate >= today && taskDate < todayEnd;
    });

    const completedTasks = allTasks.filter(
      (task) => task.status === "completed"
    );
    const pendingTasks = allTasks.filter(
      (task) => task.status === "needsAction"
    );
    const overdueTasks = allTasks.filter((task) => {
      if (!task.due || task.status === "completed") return false;
      return new Date(task.due) < now;
    });

    const completionRate =
      allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0;

    const result = {
      account: {
        totalLists: stats.totalLists,
        totalTasks: allTasks.length,
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        overdueTasks: overdueTasks.length,
        completionRate: Math.round(completionRate),
        lastSync: new Date().toISOString(),
      },
      stats: {
        totalLists: stats.totalLists,
        totalTasks: allTasks.length,
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        overdueTasks: overdueTasks.length,
        completionRate: Math.round(completionRate),
        tasksToday: tasksToday.length,
      },
      tasks: allTasks,
      lists: stats.lists,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ [GoogleTasksAPI] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

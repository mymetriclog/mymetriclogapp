"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Circle,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface GoogleTasksStats {
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
  recentTasks: Array<{
    id: string;
    title: string;
    status: "needsAction" | "completed";
    due?: string;
    completed?: string;
  }>;
  productivityScore: number;
  summary: string;
}

interface GoogleTasksCardProps {
  userTimezone?: string;
}

export function GoogleTasksCard({ userTimezone }: GoogleTasksCardProps) {
  const [stats, setStats] = useState<GoogleTasksStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGoogleTasksStats();
  }, []);

  const fetchGoogleTasksStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/integrations/google-tasks/stats");

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setError(null);
      } else if (response.status === 400) {
        setError("Google Tasks not connected");
      } else {
        setError("Failed to fetch task data");
      }
    } catch (err) {
      setError("Failed to load task data");
    } finally {
      setLoading(false);
    }
  };

  const getProductivityColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getProductivityBg = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-lg">Google Tasks</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = "/integrations")}
            >
              Connect Google Tasks
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">Google Tasks</CardTitle>
          </div>
          <Badge
            className={`${getProductivityBg(
              stats.productivityScore
            )} ${getProductivityColor(stats.productivityScore)}`}
          >
            {stats.productivityScore}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {stats.completedTasks}
            </div>
            <div className="text-xs text-blue-600">Completed</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendingTasks}
            </div>
            <div className="text-xs text-orange-600">Pending</div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Completion Rate</span>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">{stats.completionRate}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>

        {/* Overdue Tasks Warning */}
        {stats.overdueTasks > 0 && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">
              {stats.overdueTasks} overdue task
              {stats.overdueTasks > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Summary */}
        <div className="text-sm text-muted-foreground">{stats.summary}</div>

        {/* Recent Tasks */}
        {stats.recentTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Tasks</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {stats.recentTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-sm">
                  {task.status === "completed" ? (
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  )}
                  <span
                    className={`truncate ${
                      task.status === "completed"
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                  >
                    {task.title}
                  </span>
                  {task.due && task.status === "needsAction" && (
                    <Clock className="h-3 w-3 text-orange-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={fetchGoogleTasksStats}
          className="w-full"
        >
          Refresh Tasks
        </Button>
      </CardContent>
    </Card>
  );
}

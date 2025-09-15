"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckSquare,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Circle,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    notes?: string;
  }>;
  productivityScore: number;
  summary: string;
}

export default function GoogleTasksPage() {
  const [stats, setStats] = useState<GoogleTasksStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGoogleTasksStats();
    setRefreshing(false);
    toast({
      title: "Tasks Refreshed",
      description: "Google Tasks data has been updated.",
    });
  };

  const handleConnect = () => {
    window.location.href = "/api/integrations/google-tasks/connect";
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Google Tasks
            </h1>
            <p className="text-muted-foreground">
              Manage your task productivity
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error === "Google Tasks not connected") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Google Tasks
            </h1>
            <p className="text-muted-foreground">
              Manage your task productivity
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect Google Tasks</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Connect your Google Tasks account to track your productivity, task
              completion rates, and get insights into your work patterns.
            </p>
            <Button
              onClick={handleConnect}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Connect Google Tasks
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Google Tasks
            </h1>
            <p className="text-muted-foreground">
              Manage your task productivity
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Tasks</h3>
            <p className="text-muted-foreground text-center mb-6">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Google Tasks
          </h1>
          <p className="text-muted-foreground">
            Track your productivity and task completion
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">Tasks for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.completedTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Circle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendingTasks}
            </div>
            <p className="text-xs text-muted-foreground">Tasks remaining</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Productivity Score
            </CardTitle>
            <Badge
              className={`${getProductivityBg(
                stats.productivityScore
              )} ${getProductivityColor(stats.productivityScore)}`}
            >
              {stats.productivityScore}/100
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productivityScore}</div>
            <p className="text-xs text-muted-foreground">
              Overall productivity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Tasks Alert */}
      {stats.overdueTasks > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="font-medium text-red-800">Overdue Tasks</h3>
              <p className="text-sm text-red-700">
                You have {stats.overdueTasks} overdue task
                {stats.overdueTasks > 1 ? "s" : ""} that need attention.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks by List */}
      {stats.tasksByList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tasks by List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.tasksByList.map((list) => (
                <div
                  key={list.listId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{list.listTitle}</h4>
                    <p className="text-sm text-muted-foreground">
                      {list.completed} of {list.total} completed
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            list.total > 0
                              ? (list.completed / list.total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {list.total > 0
                        ? Math.round((list.completed / list.total) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Tasks */}
      {stats.recentTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentTasks.slice(0, 10).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  {task.status === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-medium ${
                        task.status === "completed"
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {task.title}
                    </h4>
                    {task.notes && (
                      <p className="text-sm text-muted-foreground truncate">
                        {task.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {task.due && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(task.due)}</span>
                      </div>
                    )}
                    {task.completed && (
                      <span className="text-green-600">
                        Completed {formatDate(task.completed)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{stats.summary}</p>
        </CardContent>
      </Card>
    </div>
  );
}

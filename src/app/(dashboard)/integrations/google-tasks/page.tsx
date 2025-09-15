"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  List,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";

type GoogleTasksData = {
  account: {
    totalLists: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
    lastSync: string;
  };
  stats: {
    totalLists: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
    tasksToday: number;
  };
  tasks: any[];
  lists: any[];
};

export default function GoogleTasksIntegrationPage() {
  const [data, setData] = useState<GoogleTasksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchGoogleTasksData();
  }, []);

  const fetchGoogleTasksData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/integrations/google-tasks/stats");

      if (!response.ok) {
        if (response.status === 403) {
          setError(
            "Google Tasks not connected. Please connect your account first."
          );
          return;
        }
        throw new Error("Failed to fetch Google Tasks data");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Error fetching Google Tasks data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      // Get the OAuth URL from the backend to ensure consistent client ID usage
      const response = await fetch("/api/integrations/google-tasks/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      } else {
        const errorData = await response.json();
        setError(
          errorData.error || "Failed to initiate Google Tasks connection"
        );
      }
    } catch (error) {
      console.error("Error connecting Google Tasks:", error);
      setError("Failed to connect Google Tasks. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading Google Tasks data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Google Tasks Integration
            </CardTitle>
            <CardDescription>
              Connect your Google Tasks account to track your productivity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Connection Required
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={handleConnect}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Connect Google Tasks
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Google Tasks Integration</h1>
          <p className="text-gray-600">
            Track your task productivity and completion rates
          </p>
        </div>
        <Button onClick={fetchGoogleTasksData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              Across {data.stats.totalLists} lists
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.stats.completedTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.stats.completionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {data.stats.pendingTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.stats.tasksToday} due today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.stats.overdueTasks}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Task Completion Progress
          </CardTitle>
          <CardDescription>
            Your overall task completion rate and productivity metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Completion Rate</span>
                <span>{data.stats.completionRate}%</span>
              </div>
              <Progress value={data.stats.completionRate} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {data.stats.completedTasks}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {data.stats.pendingTasks}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Lists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Task Lists
          </CardTitle>
          <CardDescription>
            Your Google Tasks lists and their task counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.lists.map((list) => {
              const listTasks = data.tasks.filter(
                (task) => task.listId === list.id
              );
              const completedCount = listTasks.filter(
                (task) => task.status === "completed"
              ).length;
              const pendingCount = listTasks.filter(
                (task) => task.status === "needsAction"
              ).length;

              return (
                <div
                  key={list.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold">{list.title}</h3>
                    <p className="text-sm text-gray-600">
                      {listTasks.length} tasks
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      {completedCount} completed
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800"
                    >
                      {pendingCount} pending
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>
            Your most recent tasks across all lists
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.tasks.slice(0, 10).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {task.status === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  )}
                  <div>
                    <p
                      className={`font-medium ${
                        task.status === "completed"
                          ? "line-through text-gray-500"
                          : ""
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="text-sm text-gray-600">{task.listTitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  {task.due && (
                    <p className="text-sm text-gray-600">
                      Due: {new Date(task.due).toLocaleDateString()}
                    </p>
                  )}
                  <Badge
                    variant={
                      task.status === "completed" ? "default" : "secondary"
                    }
                    className={
                      task.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {task.status === "completed" ? "Completed" : "Pending"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

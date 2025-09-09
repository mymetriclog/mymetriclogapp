"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  BarChart3,
  Activity,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QueueStats {
  summary: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    skipped: number;
    successRate: number;
  };
  queueItems: Array<{
    id: string;
    user_email: string;
    status: string;
    created_at: string;
    processing_started_at?: string;
    processing_completed_at?: string;
    error_message?: string;
    retry_count: number;
  }>;
  recentActivity: Array<{
    status: string;
    user_email: string;
    created_at: string;
    updated_at: string;
    error_message?: string;
  }>;
}

interface QueueInfo {
  name: string;
  isActive: boolean;
  isPaused: boolean;
  jobCounts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  };
  clientStatus: string;
}

export function QueueDashboard() {
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const { toast } = useToast();

  // Fetch queue data
  const fetchQueueData = async () => {
    try {
      setIsLoading(true);

      // Fetch queue status
      const statusResponse = await fetch("/api/queue/status");
      if (statusResponse.status === 403) {
        toast({
          title: "Access Denied",
          description: "Admin access required to view queue dashboard",
          variant: "destructive",
        });
        return;
      }
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setQueueStats(statusData.data);
      }

      // Fetch queue info
      const infoResponse = await fetch("/api/queue/control");
      if (infoResponse.status === 403) {
        toast({
          title: "Access Denied",
          description: "Admin access required to view queue dashboard",
          variant: "destructive",
        });
        return;
      }
      if (infoResponse.ok) {
        const infoData = await infoResponse.json();
        setQueueInfo(infoData.data.queueInfo);
      }
    } catch (error) {
      console.error("Error fetching queue data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch queue data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Schedule daily reports manually
  const scheduleDailyReports = async () => {
    if (isStarting) {
      console.log("⚠️ Already processing, ignoring duplicate click");
      return;
    }

    try {
      setIsStarting(true);
      console.log("🚀 Starting daily report scheduling...");

      const response = await fetch("/api/queue/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType: "daily" }),
      });

      if (response.status === 403) {
        toast({
          title: "Access Denied",
          description: "Admin access required to control queue",
          variant: "destructive",
        });
        return;
      }

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: `Daily reports scheduled for ${
            result.scheduledJobs?.length || 0
          } users`,
        });
        fetchQueueData(); // Refresh data
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to schedule daily reports"
        );
      }
    } catch (error) {
      console.error("Error scheduling daily reports:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to schedule daily reports",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  // Process pending jobs
  const processPendingJobs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/queue/process-pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 5 }),
      });

      if (response.status === 403) {
        toast({
          title: "Access Denied",
          description: "Admin access required to control queue",
          variant: "destructive",
        });
        return;
      }

      if (response.ok) {
        toast({
          title: "Success",
          description: "Pending jobs processed",
        });
        fetchQueueData(); // Refresh data
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to process pending jobs");
      }
    } catch (error) {
      console.error("Error processing pending jobs:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to process pending jobs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear completed jobs from cache
  const clearCompletedJobs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/queue/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-completed" }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Completed jobs cleared from cache",
        });
        fetchQueueData(); // Refresh data
      } else {
        throw new Error("Failed to clear completed jobs");
      }
    } catch (error) {
      console.error("Error clearing completed jobs:", error);
      toast({
        title: "Error",
        description: "Failed to clear completed jobs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear failed jobs from cache
  const clearFailedJobs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/queue/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-failed" }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Failed jobs cleared from cache",
        });
        fetchQueueData(); // Refresh data
      } else {
        throw new Error("Failed to clear failed jobs");
      }
    } catch (error) {
      console.error("Error clearing failed jobs:", error);
      toast({
        title: "Error",
        description: "Failed to clear failed jobs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchQueueData();
  }, []);

  if (!queueStats) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Queue Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading queue data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Queue Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Manual Daily Report Scheduling */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Manual Daily Report Scheduling
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={scheduleDailyReports}
                  disabled={isStarting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4" />
                  {isStarting ? "Scheduling..." : "Schedule Daily Reports"}
                </Button>
              </div>
            </div>

            {/* Queue Management */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Queue Management</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={processPendingJobs}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {isLoading ? "Processing..." : "Process Pending Jobs"}
                </Button>
                <Button
                  onClick={fetchQueueData}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Status
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Cards */}
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="font-medium text-blue-800 mb-1">Manual Scheduling</p>
          <p>
            Use the buttons above to manually schedule daily reports for all
            users with integrations. This bypasses the automatic cron schedule
            and immediately adds jobs to the Upstash QStash queue.
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-medium text-gray-800 mb-1">Automatic Processing</p>
          <p>
            <strong>Upstash QStash</strong> automatically handles job
            processing, retries, and scaling. Jobs are processed via webhooks
            and don't require manual queue management.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Type</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">QStash</div>
            <div className="text-xs text-muted-foreground mt-1">
              Serverless Queue
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Retries</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">2x</div>
            <div className="text-xs text-muted-foreground mt-1">
              Built-in Retries
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue System</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              Upstash QStash
            </div>
            <Badge variant="default" className="mt-2 bg-blue-600">
              Serverless & Active
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Information */}
      {queueInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Queue Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {queueInfo.jobCounts.waiting}
                </div>
                <div className="text-sm text-muted-foreground">Waiting</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {queueInfo.jobCounts.active}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {queueInfo.jobCounts.completed}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {queueInfo.jobCounts.failed}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {queueInfo.jobCounts.delayed}
                </div>
                <div className="text-sm text-muted-foreground">Delayed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {queueInfo.jobCounts.paused}
                </div>
                <div className="text-sm text-muted-foreground">Paused</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cron Schedule Information */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Clock className="h-5 w-5" />
            Automatic Cron Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-green-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">
                  Daily Reports
                </h4>
                <p className="text-sm">
                  <strong>Schedule:</strong> Every day at 11:00 PM
                  <br />
                  <strong>Endpoint:</strong> /api/cron
                  <br />
                  <strong>Status:</strong>{" "}
                  <span className="text-green-600">Active</span>
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">
                  Weekly Reports
                </h4>
                <p className="text-sm">
                  <strong>Schedule:</strong> Every Sunday at 11:00 PM
                  <br />
                  <strong>Endpoint:</strong> /api/cron/weekly
                  <br />
                  <strong>Status:</strong>{" "}
                  <span className="text-green-600">Active</span>
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm">
              Both cron jobs automatically schedule reports for all users with
              active integrations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upstash QStash Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Activity className="h-5 w-5" />
            Upstash QStash Queue System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-blue-700">
            <p className="mb-3">
              Your queue system has been migrated to{" "}
              <strong>Upstash QStash</strong> - a serverless, event-driven
              messaging queue that provides:
            </p>
            <ul className="space-y-1 text-sm">
              <li>
                • <strong>Automatic scaling</strong> - No server management
                required
              </li>
              <li>
                • <strong>Event-driven processing</strong> - Jobs trigger
                webhooks instantly
              </li>
              <li>
                • <strong>Built-in retries</strong> - Automatic failure handling
              </li>
              <li>
                • <strong>Global availability</strong> - Processed from multiple
                regions
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

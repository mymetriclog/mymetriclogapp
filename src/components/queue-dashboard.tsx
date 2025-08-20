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

  // Start queue processing
  const startQueue = async () => {
    try {
      setIsStarting(true);
      const response = await fetch("/api/queue/start", {
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
          description: "Queue processing started",
        });
        fetchQueueData(); // Refresh data
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to start queue");
      }
    } catch (error) {
      console.error("Error starting queue:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start queue processing",
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
        description: error instanceof Error ? error.message : "Failed to process pending jobs",
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
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={startQueue}
              disabled={isStarting}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isStarting ? "Starting..." : "Start Queue"}
            </Button>
            <Button
              onClick={processPendingJobs}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {isLoading ? "Processing..." : "Process Pending"}
            </Button>
            <Button
              onClick={clearCompletedJobs}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear Completed
            </Button>
            <Button
              onClick={clearFailedJobs}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Clear Failed
            </Button>
            <Button
              onClick={fetchQueueData}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats.summary.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queueStats.summary.successRate}%
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${queueStats.summary.successRate}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queueInfo?.isActive ? "Active" : "Inactive"}
            </div>
            <Badge
              variant={queueInfo?.isActive ? "default" : "secondary"}
              className="mt-2"
            >
              {queueInfo?.isActive ? "Running" : "Stopped"}
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

      {/* Note about queue tracking removal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Queue Tracking Disabled
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>
              Queue tracking functionality has been removed. Jobs are now
              processed directly without saving status information to the
              database. This simplifies the system and reduces database
              overhead.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Calendar,
  Users,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface WeeklyReportStatus {
  isProcessing: boolean;
  jobsAdded: number;
  totalUsers: number;
  usersWithIntegrations: number;
  usersWithoutIntegrations: number;
  error?: string;
  success?: boolean;
}

export function WeeklyReportInterface() {
  const [status, setStatus] = useState<WeeklyReportStatus>({
    isProcessing: false,
    jobsAdded: 0,
    totalUsers: 0,
    usersWithIntegrations: 0,
    usersWithoutIntegrations: 0,
  });

  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [testingMode, setTestingMode] = useState(false);

  const generateWeeklyReports = async () => {
    setStatus((prev) => ({
      ...prev,
      isProcessing: true,
      error: undefined,
      success: false,
    }));

    try {
      const response = await fetch("/api/queue/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "manual",
          reportType: "weekly",
          batchSize: 50,
          testingMode: testingMode, // Add testing mode flag
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          isProcessing: false,
          jobsAdded: data.jobsAdded,
          totalUsers: data.totalUsers,
          usersWithIntegrations: data.usersWithIntegrations,
          usersWithoutIntegrations: data.usersWithoutIntegrations,
          success: true,
        });
      } else {
        setStatus((prev) => ({
          ...prev,
          isProcessing: false,
          error: data.error || "Failed to start weekly report generation",
        }));
      }
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        isProcessing: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
      }));
    }
  };

  const checkQueueStatus = async () => {
    setIsLoadingQueue(true);
    try {
      const response = await fetch("/api/queue/status");
      const data = await response.json();

      if (response.ok) {
        setQueueStatus(data);
      } else {
        console.error("Failed to fetch queue status:", data.error);
      }
    } catch (error) {
      console.error("Error checking queue status:", error);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  const checkQueueControl = async () => {
    try {
      const response = await fetch("/api/queue/control");
      const data = await response.json();

      if (response.ok) {
        setQueueStatus(data);
      } else {
        console.error("Failed to fetch queue control:", data.error);
      }
    } catch (error) {
      console.error("Error checking queue control:", error);
    }
  };

  const getCurrentDayInfo = () => {
    const now = new Date();
    const today = now.getDay();
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const isSunday = today === 0;
    const daysUntilSunday = isSunday ? 0 : 7 - today;

    return {
      currentDay: today,
      dayName: dayNames[today],
      isSunday,
      daysUntilSunday,
    };
  };

  const dayInfo = getCurrentDayInfo();
  const canGenerate = dayInfo.isSunday || testingMode;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Weekly Report Generation
        </h1>
        <p className="text-gray-600">
          Generate weekly wellness reports for all users with integrations
        </p>
      </div>

      {/* Testing Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Testing Mode
          </CardTitle>
          <CardDescription>
            Enable testing mode to generate weekly reports on any day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="testing-mode"
              checked={testingMode}
              onChange={(e) => setTestingMode(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="testing-mode"
              className="text-sm font-medium text-gray-700"
            >
              Enable Testing Mode (Bypass Sunday restriction)
            </label>
          </div>
          {testingMode && (
            <Alert className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Testing Mode Active!</strong> You can now generate
                weekly reports on any day. This is for testing purposes only.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Current Day Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Day Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {dayInfo.dayName}
              </div>
              <div className="text-sm text-blue-500">Today</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {canGenerate ? "✅" : "❌"}
              </div>
              <div className="text-sm text-green-500">
                {canGenerate ? "Can Run" : "Cannot Run"}
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {dayInfo.daysUntilSunday}
              </div>
              <div className="text-sm text-orange-500">Days until Sunday</div>
            </div>
          </div>

          {!canGenerate && !testingMode && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Weekly reports can only be generated on Sundays. Today is{" "}
                {dayInfo.dayName}. Next run will be in {dayInfo.daysUntilSunday}{" "}
                days.{" "}
                <strong>
                  Enable Testing Mode above to bypass this restriction.
                </strong>
              </AlertDescription>
            </Alert>
          )}

          {testingMode && !dayInfo.isSunday && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Testing Mode Active!</strong> You can generate weekly
                reports even though today is {dayInfo.dayName}.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Manual Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Manual Weekly Report Generation
          </CardTitle>
          <CardDescription>
            Manually trigger weekly report generation for testing purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={generateWeeklyReports}
              disabled={status.isProcessing || !canGenerate}
              className="flex items-center gap-2"
            >
              {status.isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {status.isProcessing
                ? "Generating..."
                : "Generate Weekly Reports"}
            </Button>

            <Button
              onClick={checkQueueStatus}
              disabled={isLoadingQueue}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isLoadingQueue ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              Check Queue Status
            </Button>

            <Button
              onClick={checkQueueControl}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Queue Control
            </Button>
          </div>

          {/* Status Display */}
          {status.success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Weekly report generation started successfully!{" "}
                {status.jobsAdded} jobs added to queue.
              </AlertDescription>
            </Alert>
          )}

          {status.error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>Error: {status.error}</AlertDescription>
            </Alert>
          )}

          {/* Results Display */}
          {status.success && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {status.jobsAdded}
                </div>
                <div className="text-sm text-green-500">Jobs Added</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {status.totalUsers}
                </div>
                <div className="text-sm text-blue-500">Total Users</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {status.usersWithIntegrations}
                </div>
                <div className="text-sm text-green-500">With Integrations</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {status.usersWithoutIntegrations}
                </div>
                <div className="text-sm text-red-500">Without Integrations</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue Status Display */}
      {queueStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Queue Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {queueStatus.totalJobs || 0}
                </div>
                <div className="text-sm text-blue-500">Total Jobs</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {queueStatus.pendingJobs || 0}
                </div>
                <div className="text-sm text-yellow-500">Pending</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {queueStatus.completedJobs || 0}
                </div>
                <div className="text-sm text-green-500">Completed</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {queueStatus.failedJobs || 0}
                </div>
                <div className="text-sm text-red-500">Failed</div>
              </div>
            </div>

            {queueStatus.isActive !== undefined && (
              <div className="mt-4 text-center">
                <Badge variant={queueStatus.isActive ? "default" : "secondary"}>
                  {queueStatus.isActive ? "Queue Active" : "Queue Inactive"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-sm text-gray-600">
                Weekly reports are generated every Sunday automatically
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-sm text-gray-600">
                Reports cover data from Monday to Sunday
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-sm text-gray-600">
                Only users with connected integrations receive reports
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Testing Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <p className="text-sm text-gray-600">
                Manual generation only works on Sundays
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <p className="text-sm text-gray-600">
                Ensure queue worker is running for processing
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <p className="text-sm text-gray-600">
                Check console logs for detailed processing info
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  BarChart3,
  Calendar,
  Loader2,
  Mail,
  Database,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WeeklyReportStats {
  totalWeeklyReports: number;
  thisWeekReports: number;
  lastWeekReports: number;
  averageWeeklyScore: number;
  lastGenerated: string | null;
}

interface WeeklyUserStats {
  totalUsers: number;
  usersWithIntegrations: number;
  usersWithoutIntegrations: number;
  weeklyReportEligible: number;
}

export function WeeklyReportQueue() {
  const [weeklyStats, setWeeklyStats] = useState<WeeklyReportStats | null>(
    null
  );
  const [userStats, setUserStats] = useState<WeeklyUserStats | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastGeneration, setLastGeneration] = useState<any>(null);
  const [testingMode, setTestingMode] = useState(false);
  const { toast } = useToast();

  // Get current day info
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

  // Fetch weekly report statistics
  const fetchWeeklyStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/dashboard");

      if (response.ok) {
        const data = await response.json();

        // Filter for weekly reports
        const weeklyReports = data.reports.filter(
          (r: any) => r.report_type === "weekly"
        );
        const thisWeek = new Date();
        thisWeek.setDate(thisWeek.getDate() - 7);
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 14);

        setWeeklyStats({
          totalWeeklyReports: weeklyReports.length,
          thisWeekReports: weeklyReports.filter(
            (r: any) => new Date(r.created_at) >= thisWeek
          ).length,
          lastWeekReports: weeklyReports.filter((r: any) => {
            const reportDate = new Date(r.created_at);
            return reportDate >= lastWeek && reportDate < thisWeek;
          }).length,
          averageWeeklyScore:
            weeklyReports.length > 0
              ? Math.round(
                  weeklyReports.reduce(
                    (sum: number, r: any) => sum + r.score,
                    0
                  ) / weeklyReports.length
                )
              : 0,
          lastGenerated: weeklyReports[0]?.created_at || null,
        });
      }
    } catch (error) {
      console.error("Error fetching weekly stats:", error);
      toast({
        title: "Error",
        description: "Failed to fetch weekly report statistics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      const response = await fetch("/api/integrations/check-tokens");

      if (response.ok) {
        const data = await response.json();
        setUserStats({
          totalUsers: data.totalUsers || 0,
          usersWithIntegrations: data.usersWithIntegrations || 0,
          usersWithoutIntegrations: data.usersWithoutIntegrations || 0,
          weeklyReportEligible: data.usersWithIntegrations || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  // Generate weekly reports for all users
  const generateWeeklyReports = async () => {
    if (isGenerating) {
      console.log("⚠️ Already generating, ignoring duplicate click");
      return;
    }

    try {
      setIsGenerating(true);
      console.log("🚀 Starting weekly report generation for all users...");

      const response = await fetch("/api/queue/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: "weekly",
          testingMode: testingMode,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setLastGeneration({
          timestamp: new Date().toISOString(),
          reportsGenerated: result.reportsGenerated || 0,
          usersProcessed: result.usersProcessed || 0,
        });

        toast({
          title: "Success",
          description: `Generated ${
            result.reportsGenerated || 0
          } weekly reports for ${result.usersProcessed || 0} users`,
        });

        // Refresh stats
        fetchWeeklyStats();
        fetchUserStats();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to generate weekly reports"
        );
      }
    } catch (error) {
      console.error("Error generating weekly reports:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate weekly reports",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchWeeklyStats();
    fetchUserStats();
  }, []);

  if (!weeklyStats) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Report Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">
                Loading weekly report data...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Weekly Report Generation
        </h1>
        <p className="text-gray-600">
          Generate comprehensive weekly wellness reports for all users with
          integrations
        </p>
      </div>

      {/* Testing Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Testing Mode
          </CardTitle>
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
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={generateWeeklyReports}
              disabled={isGenerating || !canGenerate}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isGenerating ? "Generating..." : "Generate Weekly Reports"}
            </Button>

            <Button
              onClick={fetchWeeklyStats}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Stats
            </Button>
          </div>

          {/* Last Generation Info */}
          {lastGeneration && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Last Generation:</strong>{" "}
                {new Date(lastGeneration.timestamp).toLocaleString()}
                <br />
                Generated {lastGeneration.reportsGenerated} weekly reports for{" "}
                {lastGeneration.usersProcessed} users
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Weekly Report Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Weekly Reports
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {weeklyStats.totalWeeklyReports}
            </div>
            <div className="text-xs text-muted-foreground mt-1">All Time</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {weeklyStats.thisWeekReports}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Generated This Week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Week</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {weeklyStats.lastWeekReports}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Generated Last Week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {weeklyStats.averageWeeklyScore}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Out of 100</div>
          </CardContent>
        </Card>
      </div>

      {/* User Statistics */}
      {userStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {userStats.totalUsers}
                </div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {userStats.usersWithIntegrations}
                </div>
                <div className="text-sm text-muted-foreground">
                  With Integrations
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {userStats.usersWithoutIntegrations}
                </div>
                <div className="text-sm text-muted-foreground">
                  Without Integrations
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {userStats.weeklyReportEligible}
                </div>
                <div className="text-sm text-muted-foreground">
                  Eligible for Weekly
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Information */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Calendar className="h-5 w-5" />
            Weekly Report System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-green-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">
                  Weekly Analysis
                </h4>
                <p className="text-sm">
                  Weekly reports provide comprehensive analysis of trends,
                  patterns, and insights across a 7-day period with AI-powered
                  recommendations.
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">
                  Automatic Schedule
                </h4>
                <p className="text-sm">
                  Reports are automatically generated every Sunday at 11:00 PM
                  for all users with active integrations.
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm">
              Weekly reports include trend analysis, weekly badges,
              comprehensive insights, and personalized recommendations based on
              the full week's data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

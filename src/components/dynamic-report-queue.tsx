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
  Activity,
  Settings,
  Loader2,
  Calendar,
  Mail,
  Database,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportStats {
  totalReports: number;
  todayReports: number;
  pendingReports: number;
  completedReports: number;
  failedReports: number;
  averageScore: number;
  lastGenerated: string | null;
}

interface UserStats {
  totalUsers: number;
  usersWithIntegrations: number;
  usersWithoutIntegrations: number;
  activeIntegrations: {
    fitbit: number;
    spotify: number;
    gmail: number;
    calendar: number;
  };
}

export function DynamicReportQueue() {
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastGeneration, setLastGeneration] = useState<any>(null);
  const { toast } = useToast();

  // Fetch report statistics
  const fetchReportStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/dashboard");

      if (response.ok) {
        const data = await response.json();
        setReportStats({
          totalReports: data.stats.totalReports,
          todayReports: data.reports.filter((r: any) => {
            const today = new Date().toDateString();
            const reportDate = new Date(r.created_at).toDateString();
            return today === reportDate;
          }).length,
          pendingReports: 0, // Not applicable for new system
          completedReports: data.stats.totalReports,
          failedReports: 0, // Not applicable for new system
          averageScore: data.stats.averageScore,
          lastGenerated: data.reports[0]?.created_at || null,
        });
      }
    } catch (error) {
      console.error("Error fetching report stats:", error);
      toast({
        title: "Error",
        description: "Failed to fetch report statistics",
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
          activeIntegrations: {
            fitbit: data.integrationCounts?.fitbit || 0,
            spotify: data.integrationCounts?.spotify || 0,
            gmail: data.integrationCounts?.gmail || 0,
            calendar: data.integrationCounts?.calendar || 0,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  // Generate reports for all users
  const generateAllReports = async () => {
    if (isGenerating) {
      console.log("⚠️ Already generating, ignoring duplicate click");
      return;
    }

    try {
      setIsGenerating(true);
      console.log("🚀 Starting report generation for all users...");

      const response = await fetch("/api/queue/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: "daily",
          testingMode: false,
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
          description: `Generated ${result.reportsGenerated || 0} reports for ${
            result.usersProcessed || 0
          } users`,
        });

        // Refresh stats
        fetchReportStats();
        fetchUserStats();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate reports");
      }
    } catch (error) {
      console.error("Error generating reports:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to generate reports",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate report for specific user
  const generateUserReport = async (userEmail: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Report generated for ${userEmail}`,
        });
        fetchReportStats();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating user report:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchReportStats();
    fetchUserStats();
  }, []);

  if (!reportStats) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Dynamic Report Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading report data...</p>
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
            Dynamic Report Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Manual Report Generation */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Manual Report Generation
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={generateAllReports}
                  disabled={isGenerating}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4" />
                  {isGenerating ? "Generating..." : "Generate All Reports"}
                </Button>
                <Button
                  onClick={fetchReportStats}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Stats
                </Button>
              </div>
            </div>

            {/* Last Generation Info */}
            {lastGeneration && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Last Generation:</strong>{" "}
                  {new Date(lastGeneration.timestamp).toLocaleString()}
                  <br />
                  Generated {lastGeneration.reportsGenerated} reports for{" "}
                  {lastGeneration.usersProcessed} users
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {reportStats.totalReports}
            </div>
            <div className="text-xs text-muted-foreground mt-1">All Time</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Reports
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reportStats.todayReports}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Generated Today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {reportStats.averageScore}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Out of 100</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Last Generated
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {reportStats.lastGenerated
                ? new Date(reportStats.lastGenerated).toLocaleString()
                : "Never"}
            </div>
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
                  {Object.values(userStats.activeIntegrations).reduce(
                    (a, b) => a + b,
                    0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Active Integrations
                </div>
              </div>
            </div>

            {/* Integration Breakdown */}
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">
                Integration Breakdown
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm">Fitbit</span>
                  <Badge variant="secondary">
                    {userStats.activeIntegrations.fitbit}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">Spotify</span>
                  <Badge variant="secondary">
                    {userStats.activeIntegrations.spotify}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <span className="text-sm">Gmail</span>
                  <Badge variant="secondary">
                    {userStats.activeIntegrations.gmail}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                  <span className="text-sm">Calendar</span>
                  <Badge variant="secondary">
                    {userStats.activeIntegrations.calendar}
                  </Badge>
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
            <Settings className="h-5 w-5" />
            Dynamic Report System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-green-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">
                  Real-time Generation
                </h4>
                <p className="text-sm">
                  Reports are generated on-demand using the new modular
                  architecture. Each report includes AI insights, wellness
                  scoring, and personalized recommendations.
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">
                  Integration Support
                </h4>
                <p className="text-sm">
                  Supports Fitbit, Spotify, Gmail, Google Calendar, and Weather
                  data. Each integration is handled by dedicated services for
                  better reliability.
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm">
              The new system provides better performance, error handling, and
              maintainability compared to the previous monolithic approach.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

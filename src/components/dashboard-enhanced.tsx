"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Mail,
  Calendar,
  Activity,
  Heart,
  Moon,
  Briefcase,
} from "lucide-react";
import { getScoreBasedStyling } from "@/lib/scoring/wellness-scoring";

interface DashboardData {
  reports: any[];
  stats: {
    totalReports: number;
    bestScore: number;
    latestScore: number;
    averageScore: number;
    trend: number;
  };
  tokenStatus: any[];
  recentReport?: any;
}

interface ScoreCardProps {
  title: string;
  score: number;
  icon: React.ReactNode;
  trend?: number;
  description?: string;
}

function ScoreCard({ title, score, icon, trend, description }: ScoreCardProps) {
  const styling = getScoreBasedStyling(score);

  const getTrendIcon = () => {
    if (trend === undefined) return <Minus className="h-4 w-4 text-gray-400" />;
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div
          className="text-2xl font-bold"
          style={{ color: styling.strokeColor }}
        >
          {score}
        </div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          {getTrendIcon()}
          <span>{styling.quality}</span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
        <Progress value={score} className="mt-2" />
      </CardContent>
    </Card>
  );
}

interface RecentReportCardProps {
  report: any;
  onGenerateNew: () => void;
  isGenerating: boolean;
}

function RecentReportCard({
  report,
  onGenerateNew,
  isGenerating,
}: RecentReportCardProps) {
  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Reports Yet</CardTitle>
          <CardDescription>
            Generate your first wellness report to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onGenerateNew}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              "Generate First Report"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const styling = getScoreBasedStyling(report.score);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Latest Report
          <Badge variant="outline" style={{ color: styling.strokeColor }}>
            {report.score}/100
          </Badge>
        </CardTitle>
        <CardDescription>
          {new Date(report.created_at).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{ color: styling.strokeColor }}
              >
                {report.score}
              </div>
              <div className="text-xs text-muted-foreground">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {report.kind === "daily" ? "Daily" : "Weekly"}
              </div>
              <div className="text-xs text-muted-foreground">Report Type</div>
            </div>
          </div>

          {report.json?.scores && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <Moon className="h-4 w-4 mr-1" />
                  Sleep
                </span>
                <span className="font-medium">
                  {report.json.scores.sleep || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <Activity className="h-4 w-4 mr-1" />
                  Activity
                </span>
                <span className="font-medium">
                  {report.json.scores.activity || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <Heart className="h-4 w-4 mr-1" />
                  Heart
                </span>
                <span className="font-medium">
                  {report.json.scores.heart || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-1" />
                  Work
                </span>
                <span className="font-medium">
                  {report.json.scores.work || 0}
                </span>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={onGenerateNew}
              disabled={isGenerating}
              size="sm"
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate New Report"
              )}
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface IntegrationStatusProps {
  tokenStatus: any[];
}

function IntegrationStatus({ tokenStatus }: IntegrationStatusProps) {
  if (!tokenStatus || tokenStatus.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Integrations Connected</CardTitle>
          <CardDescription>
            Connect your first integration to start tracking your wellness data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <a href="/integrations">Connect Integrations</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: any) => {
    if (status.expired) return "destructive";
    if (status.daysUntilExpiry && status.daysUntilExpiry <= 7)
      return "destructive";
    if (status.daysUntilExpiry && status.daysUntilExpiry <= 30)
      return "secondary";
    return "default";
  };

  const getStatusText = (status: any) => {
    if (status.expired) return "Expired";
    if (status.daysUntilExpiry && status.daysUntilExpiry <= 7)
      return "Expires Soon";
    if (status.daysUntilExpiry && status.daysUntilExpiry <= 30)
      return "Expires in 30 days";
    return "Active";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Status</CardTitle>
        <CardDescription>
          Manage your connected wellness integrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tokenStatus.map((status, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-medium capitalize">
                  {status.provider}
                </span>
              </div>
              <Badge variant={getStatusColor(status)}>
                {getStatusText(status)}
              </Badge>
            </div>
          ))}
          <Button asChild variant="outline" className="w-full mt-4">
            <a href="/integrations">Manage Integrations</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardEnhanced() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/dashboard");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      setError(null);

      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType: "daily",
          date: new Date().toISOString().split("T")[0],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const result = await response.json();
      console.log("Report generated:", result);

      // Refresh dashboard data
      await fetchDashboardData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate report"
      );
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={fetchDashboardData}>Try Again</Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No data available</p>
        <Button onClick={fetchDashboardData}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your wellness journey and optimize your daily habits
          </p>
        </div>
        <Button onClick={generateReport} disabled={generating}>
          {generating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ScoreCard
          title="Overall Score"
          score={data.stats.latestScore}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          trend={data.stats.trend}
          description="Your latest wellness score"
        />
        <ScoreCard
          title="Best Score"
          score={data.stats.bestScore}
          icon={<Star className="h-4 w-4 text-muted-foreground" />}
          description="Your personal best"
        />
        <ScoreCard
          title="Average Score"
          score={data.stats.averageScore}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          description="30-day average"
        />
        <ScoreCard
          title="Total Reports"
          score={data.stats.totalReports}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          description="Reports generated"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Report */}
        <div className="lg:col-span-2">
          <RecentReportCard
            report={data.recentReport}
            onGenerateNew={generateReport}
            isGenerating={generating}
          />
        </div>

        {/* Integration Status */}
        <div>
          <IntegrationStatus tokenStatus={data.tokenStatus} />
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button asChild variant="outline" className="h-20 flex-col">
              <a href="/integrations">
                <Activity className="h-6 w-6 mb-2" />
                Connect Integrations
              </a>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <a href="/reports">
                <Calendar className="h-6 w-6 mb-2" />
                View All Reports
              </a>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <a href="/settings">
                <Settings className="h-6 w-6 mb-2" />
                Settings
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

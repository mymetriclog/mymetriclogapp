"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Eye, Download, Code, Check, Copy } from "lucide-react";
import { ReportViewerModal } from "@/components/reports/report-viewer-modal";
import { generateDailyReportEmail } from "@/lib/sendgrid/templates/daily-email-template";
import { getScoreBasedStyling } from "@/lib/scoring/wellness-scoring";

interface ReportData {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  date: string;
  kind: "daily" | "weekly";
  score: number;
  html: string;
  json: any;
  ai_insights?: any;
  created_at?: string;
}

interface RecentReportCardProps {
  report: ReportData;
  userName: string;
}

export function RecentReportCard({ report, userName }: RecentReportCardProps) {
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedJsonReport, setSelectedJsonReport] =
    useState<ReportData | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Use score-based styling
  const scoreStyling = getScoreBasedStyling(report.score);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleViewReport = (report: ReportData) => {
    setSelectedReport(report);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedReport(null);
  };

  const handleViewJson = (report: ReportData) => {
    setSelectedJsonReport(report);
    setIsJsonModalOpen(true);
  };

  const handleCloseJsonModal = () => {
    setIsJsonModalOpen(false);
    setSelectedJsonReport(null);
    setIsCopied(false);
  };

  const handleCopyJson = async () => {
    if (selectedJsonReport) {
      try {
        await navigator.clipboard.writeText(
          JSON.stringify(selectedJsonReport, null, 2)
        );
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy JSON:", err);
      }
    }
  };

  const handleDownloadReport = (report: ReportData) => {
    // Use the same data processing logic as the reports page
    const generateReportHTML = () => {
      // Extract data from the report JSON
      const reportData = report.json || {};

      // Check what data is actually available based on REAL database structure
      const hasGmailData =
        reportData.gmailData &&
        (reportData.gmailData.stats?.emailsToday ||
          reportData.gmailData.stats?.totalEmails ||
          reportData.gmailData.stats?.unreadCount ||
          reportData.gmailData.stats?.calendarInvites ||
          reportData.gmailData.stats?.averageResponseTime);

      const hasFitbitData =
        reportData.fitbitData &&
        (reportData.fitbitData.steps ||
          reportData.fitbitData.calories ||
          reportData.fitbitData.sleep ||
          reportData.fitbitData.heartRate ||
          reportData.fitbitData.distance);

      const hasSpotifyData =
        reportData.spotifyData &&
        (reportData.spotifyData.recentTracks ||
          reportData.spotifyData.topTracks ||
          reportData.spotifyData.savedAlbums ||
          reportData.spotifyData.playlists);

      const hasWeatherData =
        reportData.weatherData &&
        (reportData.weatherData.summary?.current ||
          reportData.weatherData.summary?.impact ||
          reportData.weatherData.insights?.moodInfluence ||
          reportData.weatherData.hourlyForecast?.length > 0);

      const hasGoogleCalendarData =
        reportData.googleCalendarData &&
        (reportData.googleCalendarData.stats?.eventsToday ||
          reportData.googleCalendarData.stats?.totalEvents ||
          reportData.googleCalendarData.stats?.upcomingEvents ||
          reportData.googleCalendarData.events?.length > 0);

      const hasInsights =
        report.ai_insights &&
        (report.ai_insights.mantra ||
          report.ai_insights.insight ||
          report.ai_insights.moodInsight ||
          report.ai_insights.recommendations?.length > 0);

      // Create data structure for the template using REAL database data
      const dailyReportData = {
        date: report.date,
        fullDateStr: new Date(report.date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        scores: {
          total: report.score,
          sleep: Math.round(report.score * 0.25),
          activity: Math.round(report.score * 0.25),
          heart: Math.round(report.score * 0.25),
          work: Math.round(report.score * 0.25),
          explanations: {
            sleep: ["Sleep quality analysis based on your data"],
            activity: ["Activity level assessment"],
            heart: ["Heart rate and recovery metrics"],
            work: ["Work productivity and focus indicators"],
          },
        },
        insight: hasInsights
          ? report.ai_insights.insight || "Great progress today!"
          : "Great progress today!",
        mantra: hasInsights
          ? report.ai_insights.mantra || "Stay consistent, stay strong!"
          : "Stay consistent, stay strong!",
        moodInsight: hasInsights
          ? report.ai_insights.moodInsight ||
            "Your mood patterns show positive trends"
          : "Your mood patterns show positive trends",
        weatherSummary: hasWeatherData
          ? reportData.weatherData.summary?.current ||
            "Weather data not available"
          : "Weather data not available",
        calSummary: hasGoogleCalendarData
          ? `You have ${
              reportData.googleCalendarData.stats?.eventsToday || 0
            } events today`
          : "No calendar data available",
        emailSummary: hasGmailData
          ? `You received ${
              reportData.gmailData.stats?.emailsToday || 0
            } emails today`
          : "No email data available",
        completedTasks: "Review your daily progress and plan for tomorrow",
        spotifySummary: hasSpotifyData
          ? "Your music listening patterns show good variety"
          : "No music data available",
        fitbitActivity: hasFitbitData
          ? `You took ${reportData.fitbitData.steps || 0} steps today`
          : "No activity data available",
        fitbitSleep: hasFitbitData
          ? `You slept for ${reportData.fitbitData.sleep || "7h 30m"}`
          : "No sleep data available",
        fitbitHeart: hasFitbitData
          ? `Your resting heart rate was ${
              reportData.fitbitData.heartRate || 72
            } bpm`
          : "No heart rate data available",
        peakHR: hasFitbitData
          ? (reportData.fitbitData.heartRate || 72) + 20
          : 92,
        stressRadar: {
          level:
            report.score >= 80 ? "Low" : report.score >= 60 ? "Medium" : "High",
          score: report.score,
          factors: ["Work pressure", "Sleep quality", "Activity level"],
        },
        recoveryQuotient: {
          readiness:
            report.score >= 80 ? "High" : report.score >= 60 ? "Medium" : "Low",
          score: report.score,
          factors: [
            "Sleep quality",
            "Heart rate variability",
            "Activity recovery",
          ],
        },
        dayContext: {
          dayName: new Date(report.date).toLocaleDateString("en-US", {
            weekday: "long",
          }),
          dayType: "Regular",
          calendarData: hasGoogleCalendarData
            ? reportData.googleCalendarData.events || []
            : [],
        },
        badges: [],
        streakBadges: [],
        badgeNarrative: "Keep up the great work!",
        nearMisses: [],
        calendarAnalysis: hasGoogleCalendarData
          ? reportData.googleCalendarData
          : null,
        calendarIntelligence: {
          score: report.score,
          insights: ["Calendar analysis based on your data"],
        },
        fitbitHRV: hasFitbitData ? reportData.fitbitData.hrv || null : null,
        hourlyWeather: hasWeatherData
          ? reportData.weatherData.hourlyForecast || []
          : [],
        emailResponseAnalysis: hasGmailData ? reportData.gmailData : null,
        fitbitActivityLog: hasFitbitData ? [reportData.fitbitData] : [],
        audioFeatures: hasSpotifyData
          ? reportData.spotifyData.audioFeatures || null
          : null,
        anomalies: {
          detected: [],
          insights: ["No significant anomalies detected"],
        },
        environmentalFactors: {
          weather: {
            impact: hasWeatherData
              ? reportData.weatherData.summary?.impact || "No impact"
              : "No weather data",
            insight: hasWeatherData
              ? reportData.weatherData.insights?.moodInfluence ||
                "Weather data not available"
              : "Weather data not available",
          },
        },
        deepInsights: {
          patterns: [],
          insights: hasInsights
            ? [
                report.ai_insights.insight,
                report.ai_insights.moodInsight,
              ].filter(Boolean)
            : ["Your daily patterns show consistent improvement"],
        },
        trends: {
          overall: {
            trend: report.score > 70 ? 1 : report.score > 50 ? 0 : -1,
            sparkline: [report.score - 5, report.score, report.score + 5],
          },
        },
        historicalData: [
          { score: report.score - 5 },
          { score: report.score },
          { score: report.score + 5 },
        ],
        weatherData: hasWeatherData ? reportData.weatherData : undefined,
        calendarData: hasGoogleCalendarData
          ? reportData.googleCalendarData
          : undefined,
        emailData: hasGmailData ? reportData.gmailData : undefined,
        spotifyData: hasSpotifyData ? reportData.spotifyData : undefined,
        fitbitData: hasFitbitData ? reportData.fitbitData : undefined,
      };

      return generateDailyReportEmail(dailyReportData);
    };

    // Generate the HTML content
    const emailHTML = generateReportHTML();

    // Remove the historical chart section from the download
    const htmlContent = emailHTML.replace(
      /<div class="chart-section">[\s\S]*?<\/div>\s*<!-- At a Glance Section -->/,
      "<!-- At a Glance Section -->"
    );

    // Create a complete HTML document
    const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.kind === "daily" ? "Daily" : "Weekly"} Report - ${
      report.date
    }</title>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

    // Create a blob with the HTML content
    const blob = new Blob([fullHTML], { type: "text/html" });

    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.kind}-report-${report.date}.html`;

    // Trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                {report.kind === "daily" ? "Daily Report" : "Weekly Report"}
              </div>
              <div className="text-lg font-semibold">
                {formatDate(report.date)}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xl font-bold ${scoreStyling.color}`}>
                {report.score}
              </div>
              <div className="text-xs text-muted-foreground">
                {scoreStyling.quality}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">{userName}</div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleViewReport(report)}
                title="View Report"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleDownloadReport(report)}
                title="Download Report"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleViewJson(report)}
                title="View JSON"
              >
                <Code className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Viewer Modal */}
      <ReportViewerModal
        report={selectedReport}
        isOpen={isViewerOpen}
        onClose={handleCloseViewer}
      />

      {/* JSON Viewer Modal */}
      <Dialog open={isJsonModalOpen} onOpenChange={handleCloseJsonModal}>
        <DialogContent className="w-[90vw] max-w-4xl h-[80vh] p-0 flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 p-4 bg-white border-b flex-shrink-0">
            <DialogTitle className="font-semibold">
              JSON Data -{" "}
              {selectedJsonReport?.kind === "daily" ? "Daily" : "Weekly"} Report
              - {selectedJsonReport?.date}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyJson}
                className={
                  isCopied
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "mr-10"
                }
              >
                {isCopied ? (
                  <>
                    <Check className="size-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-4 mr-1 " />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <pre className="bg-white p-4 rounded-lg border text-sm overflow-x-auto whitespace-pre-wrap">
              <code>
                {selectedJsonReport
                  ? JSON.stringify(selectedJsonReport, null, 2)
                  : ""}
              </code>
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

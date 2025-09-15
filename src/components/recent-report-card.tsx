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
import { getScoreBasedStyling } from "@/lib/scoring/wellness-scoring";
import { generateDailyReportEmail } from "@/lib/sendgrid/templates/daily-email-template";

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
  // Comprehensive data fields
  gpt_summary?: string;
  mantra?: string;
  moodInsight?: string;
  weatherSummary?: string;
  calSummary?: string;
  emailSummary?: string;
  completedTasks?: string;
  spotifySummary?: string;
  spotifyInsights?: any;
  fitbitActivity?: string;
  fitbitSleep?: string;
  fitbitHeart?: string;
  peakHR?: number;
  stressRadar?: any;
  recoveryQuotient?: any;
  dayContext?: any;
  badges?: any[];
  streakBadges?: any[];
  badgeNarrative?: string;
  nearMisses?: any[];
  calendarAnalysis?: any;
  calendarIntelligence?: any;
  fitbitHRV?: any;
  hourlyWeather?: any;
  emailResponseAnalysis?: any;
  fitbitActivityLog?: any;
  audioFeatures?: any;
  anomalies?: any;
  environmentalFactors?: any;
  deepInsights?: any;
  trends?: any;
  historicalData?: any[];
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
    // Use the comprehensive data directly from the report object
    const generateReportHTML = () => {
      // Use the comprehensive data directly from the report object
      // This is the data that our updated API now provides
      const dailyReportData = {
        date: report.date,
        fullDateStr: new Date(report.date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        scores: report.json?.scores || {
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
        insight: report.json?.insight || "Great progress today!",
        gpt_summary: report.gpt_summary || report.json?.gpt_summary,
        mantra:
          report.mantra ||
          report.json?.mantra ||
          "Stay consistent, stay strong!",
        moodInsight:
          report.moodInsight ||
          report.json?.moodInsight ||
          "Your mood patterns show positive trends",
        weatherSummary:
          report.weatherSummary ||
          report.json?.weatherSummary ||
          "Weather data not available",
        calSummary:
          report.calSummary ||
          report.json?.calSummary ||
          "No calendar data available",
        emailSummary:
          report.emailSummary ||
          report.json?.emailSummary ||
          "No email data available",
        completedTasks:
          report.completedTasks ||
          report.json?.completedTasks ||
          "Review your daily progress and plan for tomorrow",
        spotifySummary:
          report.spotifySummary ||
          report.json?.spotifySummary ||
          "No music data available",
        spotifyInsights: report.spotifyInsights || report.json?.spotifyInsights,
        fitbitActivity:
          report.fitbitActivity ||
          report.json?.fitbitActivity ||
          "No activity data available",
        fitbitSleep:
          report.fitbitSleep ||
          report.json?.fitbitSleep ||
          "No sleep data available",
        fitbitHeart:
          report.fitbitHeart ||
          report.json?.fitbitHeart ||
          "No heart rate data available",
        peakHR: report.peakHR || report.json?.peakHR || 92,
        stressRadar: report.stressRadar ||
          report.json?.stressRadar || {
            level:
              report.score >= 80
                ? "Low"
                : report.score >= 60
                ? "Medium"
                : "High",
            score: report.score,
            factors: ["Work pressure", "Sleep quality", "Activity level"],
          },
        recoveryQuotient: report.recoveryQuotient ||
          report.json?.recoveryQuotient || {
            readiness:
              report.score >= 80
                ? "High"
                : report.score >= 60
                ? "Medium"
                : "Low",
            score: report.score,
            factors: [
              "Sleep quality",
              "Heart rate variability",
              "Activity recovery",
            ],
          },
        dayContext: report.dayContext ||
          report.json?.dayContext || {
            dayName: new Date(report.date).toLocaleDateString("en-US", {
              weekday: "long",
            }),
            dayType: "Regular",
            calendarData: [],
          },
        badges: report.badges || report.json?.badges || [],
        streakBadges: report.streakBadges || report.json?.streakBadges || [],
        badgeNarrative:
          report.badgeNarrative ||
          report.json?.badgeNarrative ||
          "Keep up the great work!",
        nearMisses: report.nearMisses || report.json?.nearMisses || [],
        calendarAnalysis:
          report.calendarAnalysis || report.json?.calendarAnalysis,
        calendarIntelligence: report.calendarIntelligence ||
          report.json?.calendarIntelligence || {
            score: report.score,
            insights: ["Calendar analysis based on your data"],
          },
        fitbitHRV: report.fitbitHRV || report.json?.fitbitHRV,
        hourlyWeather: report.hourlyWeather || report.json?.hourlyWeather || [],
        emailResponseAnalysis:
          report.emailResponseAnalysis || report.json?.emailResponseAnalysis,
        fitbitActivityLog:
          report.fitbitActivityLog || report.json?.fitbitActivityLog || [],
        audioFeatures: report.audioFeatures || report.json?.audioFeatures,
        anomalies: report.anomalies ||
          report.json?.anomalies || {
            detected: [],
            insights: ["No significant anomalies detected"],
          },
        environmentalFactors: report.environmentalFactors ||
          report.json?.environmentalFactors || {
            weather: {
              impact: "No weather data",
              insight: "Weather data not available",
            },
          },
        deepInsights: report.deepInsights ||
          report.json?.deepInsights || {
            patterns: [],
            insights: ["Your daily patterns show consistent improvement"],
          },
        trends: report.trends ||
          report.json?.trends || {
            overall: {
              trend: report.score > 70 ? 1 : report.score > 50 ? 0 : -1,
              sparkline: [report.score - 5, report.score, report.score + 5],
            },
          },
        historicalData: report.historicalData ||
          report.json?.historicalData || [
            { score: report.score - 5 },
            { score: report.score },
            { score: report.score + 5 },
          ],
      };

      // Generate the email template HTML using the same template as emails
      return generateDailyReportEmail(
        dailyReportData.fullDateStr,
        dailyReportData.date,
        dailyReportData.scores,
        dailyReportData.insight,
        dailyReportData.mantra,
        dailyReportData.moodInsight,
        dailyReportData.weatherSummary,
        dailyReportData.calSummary,
        dailyReportData.emailSummary,
        dailyReportData.completedTasks,
        dailyReportData.spotifySummary,
        dailyReportData.fitbitActivity,
        dailyReportData.fitbitSleep,
        dailyReportData.fitbitHeart,
        dailyReportData.peakHR,
        dailyReportData.stressRadar,
        dailyReportData.recoveryQuotient,
        dailyReportData.dayContext,
        dailyReportData.badges,
        dailyReportData.streakBadges,
        dailyReportData.badgeNarrative,
        dailyReportData.nearMisses,
        dailyReportData.calendarAnalysis,
        dailyReportData.calendarIntelligence,
        dailyReportData.fitbitHRV,
        dailyReportData.hourlyWeather,
        dailyReportData.emailResponseAnalysis,
        dailyReportData.fitbitActivityLog,
        dailyReportData.audioFeatures
      );
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

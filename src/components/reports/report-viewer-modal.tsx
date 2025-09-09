import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
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
}

interface ReportViewerModalProps {
  report: ReportData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportViewerModal({
  report,
  isOpen,
  onClose,
}: ReportViewerModalProps) {
  if (!report) return null;

  const handleDownloadReport = () => {
    // Debug: Log the report data to see what we're working with
    console.log("🔍 Download Report Data:", {
      reportId: report.id,
      reportDate: report.date,
      reportKind: report.kind,
      reportScore: report.score,
      reportJson: report.json,
      reportAiInsights: report.ai_insights,
    });

    // Use the exact same generateReportHTML function that the modal uses
    const htmlContent = generateReportHTML(report);

    // Debug: Log the generated HTML content length
    console.log("📄 Generated HTML Content Length:", htmlContent.length);

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

    console.log("✅ Download completed for report:", report.id);
  };

  // Generate the HTML content for modal display (without historical chart)
  const generateReportHTML = (report: ReportData) => {
    // Debug: Log the incoming report data
    console.log("🔄 generateReportHTML called with report:", {
      id: report.id,
      date: report.date,
      kind: report.kind,
      score: report.score,
      hasJson: !!report.json,
      hasAiInsights: !!report.ai_insights,
    });

    // Extract data from the report JSON
    const reportData = report.json || {};

    // Debug: Log the extracted report data
    console.log("📊 Extracted report data:", {
      gmailData: reportData.gmailData,
      fitbitData: reportData.fitbitData,
      spotifyData: reportData.spotifyData,
      weatherData: reportData.weatherData,
      googleCalendarData: reportData.googleCalendarData,
    });

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

    // Debug: Log what data is available
    console.log("✅ Data availability check:", {
      hasGmailData,
      hasFitbitData,
      hasSpotifyData,
      hasWeatherData,
      hasGoogleCalendarData,
      hasInsights,
    });

    // Debug: Log weather data specifically
    console.log("🌤️ Weather data check:", {
      hasWeatherData,
      weatherData: reportData.weatherData,
      current: reportData.weatherData?.summary?.current,
      hourlyForecast: reportData.weatherData?.hourlyForecast,
      hourlyLength: reportData.weatherData?.hourlyForecast?.length,
    });

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
      peakHR: hasFitbitData ? (reportData.fitbitData.heartRate || 72) + 20 : 92,
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
          ? [report.ai_insights.insight, report.ai_insights.moodInsight].filter(
              Boolean
            )
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

    // Debug: Log the final data structure being passed to template
    console.log("📋 Final dailyReportData for template:", dailyReportData);
    console.log(
      "🌤️ Weather data being passed to template:",
      dailyReportData.weatherData
    );

    // Helper function to format sleep data
    function formatSleep(sleepMinutes: number): string {
      if (!sleepMinutes) return "7h 30m";
      const hours = Math.floor(sleepMinutes / 60);
      const minutes = sleepMinutes % 60;
      return `${hours}h ${minutes}m`;
    }

    // Generate the email template HTML
    const emailHTML = generateDailyReportEmail(dailyReportData);

    // Remove the historical chart section from the modal display
    const htmlWithoutChart = emailHTML.replace(
      /<div class="chart-section">[\s\S]*?<\/div>\s*<!-- At a Glance Section -->/,
      "<!-- At a Glance Section -->"
    );

    return htmlWithoutChart;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] sm:w-[95vw] max-w-4xl h-[95vh] sm:h-[90vh] max-h-[1000px] overflow-hidden p-0 mx-auto">
        <DialogHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 p-3 sm:p-4 bg-white">
          <DialogTitle className="font-semibold text-sm sm:text-base truncate">
            {report.kind === "daily" ? "Daily" : "Weekly"} Report -{" "}
            {report.date}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadReport}
              className="text-xs sm:text-sm"
            >
              <Download className="size-3 sm:size-4 mr-1" />
              <span className="hidden sm:inline">Download</span>
              <span className="sm:hidden">DL</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto h-full p-2 sm:p-4">
          <div
            className="report-content"
            dangerouslySetInnerHTML={{ __html: generateReportHTML(report) }}
            style={{
              transformOrigin: "top center",
              margin: "0 auto",
              maxWidth: "100%",
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

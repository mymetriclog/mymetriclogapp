import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Eye, Download, Code, X, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { ReportViewerModal } from "./report-viewer-modal";
import { generateDailyReportEmail } from "@/lib/sendgrid/templates/daily-report";

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

interface ReportsTableProps {
  isLoading: boolean;
  reports: ReportData[];
}

export function ReportsTable({ isLoading, reports }: ReportsTableProps) {
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedJsonReport, setSelectedJsonReport] = useState<ReportData | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

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
        await navigator.clipboard.writeText(JSON.stringify(selectedJsonReport, null, 2));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy JSON:', err);
      }
    }
  };

  const handleDownloadReport = (report: ReportData) => {
    // Use the same data processing logic as the modal
    const generateReportHTML = () => {
      // Extract data from the report JSON
      const reportData = report.json || {};
      
      // Check what data is actually available based on REAL database structure
      const hasGmailData = reportData.gmailData && (
        reportData.gmailData.stats?.emailsToday ||
        reportData.gmailData.stats?.totalEmails ||
        reportData.gmailData.stats?.unreadCount ||
        reportData.gmailData.stats?.calendarInvites ||
        reportData.gmailData.stats?.averageResponseTime
      );
      
      const hasFitbitData = reportData.fitbitData && (
        reportData.fitbitData.steps ||
        reportData.fitbitData.calories ||
        reportData.fitbitData.sleep ||
        reportData.fitbitData.heartRate ||
        reportData.fitbitData.distance
      );
      
      const hasSpotifyData = reportData.spotifyData && (
        reportData.spotifyData.recentTracks ||
        reportData.spotifyData.topTracks ||
        reportData.spotifyData.savedAlbums ||
        reportData.spotifyData.playlists
      );
      
      const hasWeatherData = reportData.weatherData && (
        reportData.weatherData.summary?.current ||
        reportData.weatherData.summary?.impact ||
        reportData.weatherData.insights?.moodInfluence ||
        reportData.weatherData.hourlyForecast?.length > 0
      );
      
      const hasGoogleCalendarData = reportData.googleCalendarData && (
        reportData.googleCalendarData.stats?.eventsToday ||
        reportData.googleCalendarData.stats?.totalEvents ||
        reportData.googleCalendarData.stats?.upcomingEvents ||
        reportData.googleCalendarData.events?.length > 0
      );
      
      const hasInsights = report.ai_insights && (
        report.ai_insights.mantra ||
        report.ai_insights.insight ||
        report.ai_insights.moodInsight ||
        report.ai_insights.recommendations?.length > 0
      );
      
      // Create data structure for the template using REAL database data
      const dailyReportData = {
        date: report.date,
        score: report.score,
        quality: report.score >= 80 ? "Excellent" : report.score >= 70 ? "Good" : report.score >= 60 ? "Fair" : "Poor",
        
        // Use actual data from database JSON, with fallbacks only if data is missing
        sleep: reportData.fitbitData?.sleep || "7h 30m",
        steps: reportData.fitbitData?.steps || 8500,
        calories: reportData.fitbitData?.calories || 2100,
        activeMinutes: 45,
        heartRate: reportData.fitbitData?.heartRate || 72,
        
        // Email stats - provide defaults if data doesn't exist
        emailStats: {
          total: hasGmailData ? (reportData.gmailData.stats?.totalEmails || 0) : 0,
          unread: hasGmailData ? (reportData.gmailData.stats?.unreadCount || 0) : 0,
          sent: hasGmailData ? (reportData.gmailData.stats?.emailsToday || 0) : 0,
          primary: hasGmailData ? (reportData.gmailData.stats?.calendarInvites || 0) : 0,
        },
        
        // Fitness stats - provide defaults if data doesn't exist
        fitnessStats: {
          steps: hasFitbitData ? (reportData.fitbitData.steps || 0) : 0,
          calories: hasFitbitData ? (reportData.fitbitData.calories || 0) : 0,
          distance: hasFitbitData ? (reportData.fitbitData.distance || 0) : 0,
          sleep: hasFitbitData ? (reportData.fitbitData.sleep || "7h 30m") : "7h 30m",
          restingHR: hasFitbitData ? (reportData.fitbitData.heartRate || 0) : 0,
        },
        
        // AI insights - use real data if available
        insights: hasInsights ? [
          report.ai_insights.mantra,
          report.ai_insights.insight,
          report.ai_insights.moodInsight,
          ...(report.ai_insights.recommendations || [])
        ].filter(Boolean) : [
          "Great job maintaining consistent activity levels today!",
          "Your sleep quality has improved compared to yesterday.",
          "Consider taking a short walk during your lunch break for better energy.",
        ],
      };

      return generateDailyReportEmail(dailyReportData);
    };

    // Generate the HTML content
    const emailHTML = generateReportHTML();
    
    // Remove the historical chart section from the download
    const htmlContent = emailHTML.replace(
      /<div class="chart-section">[\s\S]*?<\/div>\s*<!-- At a Glance Section -->/,
      '<!-- At a Glance Section -->'
    );
    
    // Create a complete HTML document
    const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.kind === "daily" ? "Daily" : "Weekly"} Report - ${report.date}</title>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

    // Create a blob with the HTML content
    const blob = new Blob([fullHTML], { type: 'text/html' });
    
    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.kind}-report-${report.date}.html`;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            All Reports ({reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center space-x-4 p-3 animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-24"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-28"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            All Reports (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-lg font-medium text-muted-foreground">
              No reports available yet
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              No reports have been generated yet. Use the form above to create
              your first report.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            All Reports ({reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-sm text-muted-foreground">
                    User Name
                  </th>
                  <th className="text-left p-3 font-medium text-sm text-muted-foreground">
                    User ID
                  </th>
                  <th className="text-left p-3 font-medium text-sm text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left p-3 font-medium text-sm text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left p-3 font-medium text-sm text-muted-foreground">
                    Score
                  </th>
                  <th className="text-left p-3 font-medium text-sm text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left p-3 font-medium text-sm text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">
                      <div>
                        <div className="font-medium">{report.user_name}</div>
                        <div className="text-xs text-muted-foreground">{report.user_email}</div>
                      </div>
                    </td>
                    <td className="p-3 text-sm font-mono text-xs">
                      {report.user_id.substring(0, 8)}...
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="secondary"
                        className={
                          report.kind === "daily"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                        }
                      >
                        {report.kind.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">{report.date}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-lg font-semibold ${
                            report.score >= 80
                              ? "text-green-600"
                              : report.score >= 70
                              ? "text-blue-600"
                              : report.score >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {report.score}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${
                            report.score >= 80
                              ? "text-green-600 bg-green-50 border-green-200"
                              : report.score >= 70
                              ? "text-blue-600 bg-blue-50 border-blue-200"
                              : report.score >= 60
                              ? "text-yellow-600 bg-yellow-50 border-yellow-200"
                              : "text-red-600 bg-red-50 border-red-200"
                          }`}
                        >
                          {report.score >= 80
                            ? "Excellent"
                            : report.score >= 70
                            ? "Good"
                            : report.score >= 60
                            ? "Fair"
                            : "Poor"}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewReport(report)}
                        >
                          <Eye className="size-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadReport(report)}
                        >
                          <Download className="size-4 mr-1" />
                          Download
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewJson(report)}
                        >
                          <Code className="size-4 mr-1" />
                          JSON
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              JSON Data - {selectedJsonReport?.kind === "daily" ? "Daily" : "Weekly"} Report - {selectedJsonReport?.date}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleCopyJson}
                className={isCopied ? "bg-green-50 text-green-700 border-green-200" : "mr-10"}
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
              {/* <Button size="sm" variant="ghost" onClick={handleCloseJsonModal}>
                <X className="size-4" />
              </Button> */}
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <pre className="bg-white p-4 rounded-lg border text-sm overflow-x-auto whitespace-pre-wrap">
              <code>
                {selectedJsonReport ? JSON.stringify(selectedJsonReport, null, 2) : ''}
              </code>
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

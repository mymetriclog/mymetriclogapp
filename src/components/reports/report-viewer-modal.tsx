import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
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

interface ReportViewerModalProps {
  report: ReportData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportViewerModal({ report, isOpen, onClose }: ReportViewerModalProps) {
  if (!report) return null;

  const handleDownloadReport = () => {
    // Debug: Log the report data to see what we're working with
    console.log('🔍 Download Report Data:', {
      reportId: report.id,
      reportDate: report.date,
      reportKind: report.kind,
      reportScore: report.score,
      reportJson: report.json,
      reportAiInsights: report.ai_insights
    });

    // Use the exact same generateReportHTML function that the modal uses
    const htmlContent = generateReportHTML(report);
    
    // Debug: Log the generated HTML content length
    console.log('📄 Generated HTML Content Length:', htmlContent.length);
    
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
    
    console.log('✅ Download completed for report:', report.id);
  };

  // Generate the HTML content for modal display (without historical chart)
  const generateReportHTML = (report: ReportData) => {
    // Debug: Log the incoming report data
    console.log('🔄 generateReportHTML called with report:', {
      id: report.id,
      date: report.date,
      kind: report.kind,
      score: report.score,
      hasJson: !!report.json,
      hasAiInsights: !!report.ai_insights
    });

    // Extract data from the report JSON
    const reportData = report.json || {};
    
    // Debug: Log the extracted report data
    console.log('📊 Extracted report data:', {
      gmailData: reportData.gmailData,
      fitbitData: reportData.fitbitData,
      spotifyData: reportData.spotifyData,
      weatherData: reportData.weatherData,
      googleCalendarData: reportData.googleCalendarData
    });
    
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

    // Debug: Log what data is available
    console.log('✅ Data availability check:', {
      hasGmailData,
      hasFitbitData,
      hasSpotifyData,
      hasWeatherData,
      hasGoogleCalendarData,
      hasInsights
    });
    
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

    // Debug: Log the final data structure being passed to template
    console.log('📋 Final dailyReportData for template:', dailyReportData);

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
      '<!-- At a Glance Section -->'
    );
    
    return htmlWithoutChart;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[1000px] overflow-hidden p-0 mx-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 p-4 bg-white">
          <DialogTitle className="font-semibold">
            {report.kind === "daily" ? "Daily" : "Weekly"} Report - {report.date}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button 
            className="mr-10"
              size="sm" 
              variant="outline"
              onClick={handleDownloadReport}
            >
              <Download className="size-4 mr-1" />
              Download
            </Button>
            {/* <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="size-4" />
            </Button> */}
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto h-full p-4">
          <div 
            className="report-content"
            dangerouslySetInnerHTML={{ __html: generateReportHTML(report) }}
            style={{
              transformOrigin: 'top center',
              margin: '0 auto',
              maxWidth: '100%',
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

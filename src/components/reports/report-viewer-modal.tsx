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
  // AI Mood and Energy Forecast
  aiMoodAndEnergy?: {
    mood: {
      state: string;
      description: string;
      additionalInfo: string;
    };
    energyForecast: {
      level: string;
      description: string;
    };
  };
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
      hasGptSummary: !!report.gpt_summary,
      hasMantra: !!report.mantra,
      weatherSummary: report.weatherSummary,
      jsonWeatherSummary: report.json?.weatherSummary,
      jsonWeather: report.json?.weather,
    });

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
        report.mantra || report.json?.mantra || "Stay consistent, stay strong!",
      moodInsight:
        report.moodInsight ||
        report.json?.moodInsight ||
        "Your mood patterns show positive trends",
      weatherSummary: (() => {
        const weatherData =
          report.weatherSummary ||
          report.json?.weatherSummary ||
          report.json?.weather;
        const formatted = formatWeatherData(weatherData);
        console.log("🌤️ Final weather summary:", formatted);
        return formatted;
      })(),
      calSummary: formatWeatherData(
        report.calSummary ||
          report.json?.calSummary ||
          "No calendar data available"
      ),
      emailSummary: formatWeatherData(
        report.emailSummary ||
          report.json?.emailSummary ||
          "No email data available"
      ),
      completedTasks: formatWeatherData(
        report.completedTasks ||
          report.json?.completedTasks ||
          "Review your daily progress and plan for tomorrow"
      ),
      spotifySummary: (() => {
        const musicData = report.spotifySummary || report.json?.spotifySummary;
        const formatted = formatWeatherData(
          musicData || "No music data available"
        );
        console.log("🎵 Music summary data:", {
          original: musicData,
          formatted: formatted,
        });
        return formatted;
      })(),
      spotifyInsights: (() => {
        const insights = report.spotifyInsights || report.json?.spotifyInsights;
        console.log("🎵 Music insights data:", insights);
        return insights;
      })(),
      fitbitActivity: formatWeatherData(
        report.fitbitActivity ||
          report.json?.fitbitActivity ||
          "No activity data available"
      ),
      fitbitSleep: formatWeatherData(
        report.fitbitSleep ||
          report.json?.fitbitSleep ||
          "No sleep data available"
      ),
      fitbitHeart: formatWeatherData(
        report.fitbitHeart ||
          report.json?.fitbitHeart ||
          "No heart rate data available"
      ),
      peakHR: report.peakHR || report.json?.peakHR || 92,
      stressRadar: report.stressRadar ||
        report.json?.stressRadar || {
          level:
            report.score >= 80 ? "Low" : report.score >= 60 ? "Medium" : "High",
          score: report.score,
          factors: ["Work pressure", "Sleep quality", "Activity level"],
        },
      recoveryQuotient: report.recoveryQuotient ||
        report.json?.recoveryQuotient || {
          readiness:
            report.score >= 80 ? "High" : report.score >= 60 ? "Medium" : "Low",
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
      // Wellness Balance Data
      balanceLevel: (report.score >= 80
        ? "excellent"
        : report.score >= 60
        ? "good"
        : "needs_improvement") as "excellent" | "good" | "needs_improvement",
      balanceStatus:
        report.score >= 80
          ? "Excellent Wellness Balance"
          : report.score >= 60
          ? "Good Performance with Room for Optimization"
          : "Challenging Day - Focus on Recovery",
      balanceColor:
        report.score >= 80
          ? "#10b981"
          : report.score >= 60
          ? "#f59e0b"
          : "#ef4444",
      balanceInsight: `Your overall score of **${report.score}/100** ${
        report.score >= 80
          ? "reflects excellent wellness balance"
          : report.score >= 60
          ? "shows solid performance with room for optimization"
          : "indicates yesterday was challenging"
      }.`,
      // AI Mood and Energy Forecast
      aiMoodAndEnergy: report.aiMoodAndEnergy ||
        report.json?.aiMoodAndEnergy || {
          mood: {
            state:
              report.score >= 80
                ? "Energized"
                : report.score >= 60
                ? "Balanced"
                : "Tired",
            description:
              report.score >= 80
                ? "Excellent sleep and high activity levels suggest you're feeling energized and ready for the day."
                : report.score >= 60
                ? "Your mood today reflects your overall wellness balance."
                : "Lower energy levels suggest you may feel tired throughout the day.",
            additionalInfo:
              report.score >= 80
                ? "Strong recovery patterns indicate sustained energy."
                : report.score >= 60
                ? "Clear patterns suggest consistent energy."
                : "Recovery patterns indicate need for rest.",
          },
          energyForecast: {
            level:
              report.score >= 80
                ? "high"
                : report.score >= 60
                ? "moderate to good"
                : "low",
            description:
              report.score >= 80
                ? "Expected productivity: high. Take advantage of peak performance."
                : report.score >= 60
                ? "Expected productivity: moderate to good. Prioritize key tasks."
                : "Expected productivity: low. Focus on essential tasks and take breaks.",
          },
        },
    };

    // Helper function to format sleep data
    function formatSleep(sleepMinutes: number): string {
      if (!sleepMinutes) return "7h 30m";
      const hours = Math.floor(sleepMinutes / 60);
      const minutes = sleepMinutes % 60;
      return `${hours}h ${minutes}m`;
    }

    // Helper function to format weather data (matches email template logic)
    function formatWeatherData(weatherData: any): string {
      if (!weatherData) return "Weather data not available";

      // Debug logging
      console.log("🌤️ Formatting weather data:", {
        type: typeof weatherData,
        data: weatherData,
        isString: typeof weatherData === "string",
        isObject: typeof weatherData === "object",
      });

      // If it's already a string, return it
      if (typeof weatherData === "string") return weatherData;

      // If it's an object, format it properly
      if (typeof weatherData === "object") {
        // Handle weather object with current and forecast data
        if (weatherData.current) {
          const current = weatherData.current;
          if (typeof current === "string") {
            return current; // Already formatted like "clear sky, 18°C"
          }
          if (current.condition && current.temperature) {
            return `${current.condition}, ${current.temperature}`;
          }
        }

        // Handle weather object with impact, current, forecast structure
        if (weatherData.impact && weatherData.current) {
          const current = weatherData.current;
          if (typeof current === "string") {
            return current; // Already formatted like "clear sky, 18°C"
          }
          if (current.condition && current.temperature) {
            return `${current.condition}, ${current.temperature}`;
          }
        }

        // Check if it has a summary or description
        if (weatherData.summary) return weatherData.summary;
        if (weatherData.description) return weatherData.description;
        if (weatherData.weatherSummary) return weatherData.weatherSummary;

        // If it has temperature and condition
        if (weatherData.temperature && weatherData.condition) {
          return `${weatherData.condition}, ${weatherData.temperature}`;
        }

        // If it has hourly data, format the first entry
        if (
          weatherData.hourly &&
          Array.isArray(weatherData.hourly) &&
          weatherData.hourly.length > 0
        ) {
          const firstHour = weatherData.hourly[0];
          return `${firstHour.condition || "Clear"}, ${
            firstHour.temperature || "18"
          }°C`;
        }

        // Fallback to string representation
        return JSON.stringify(weatherData);
      }

      return "Weather data not available";
    }

    // Helper function to extract weather data (matches email template)
    function extractWeatherData(
      weatherSummary: string,
      type: "yesterday" | "today"
    ): string {
      const text = (weatherSummary || "").toString();

      if (type === "yesterday") {
        // Extract yesterday's weather data
        const conditionMatch = text.match(/Yesterday.*?(\w+)/i);
        const tempMatch = text.match(/(\d+)°[CF]/);
        const windMatch = text.match(/(\d+\.?\d*)\s*m\/s/);
        const cloudMatch = text.match(/(\d+)%/);
        const locationMatch = text.match(/in\s+([A-Za-z\s]+)/);

        const condition = conditionMatch ? conditionMatch[1] : "Clear";
        const temp = tempMatch ? tempMatch[1] : "18";
        const wind = windMatch ? windMatch[1] : "2.0";
        const cloud = cloudMatch ? cloudMatch[1] : "0";
        const location = locationMatch
          ? locationMatch[1].trim()
          : "Your Location";

        return `☁️ ${condition} | 🌡️ ${temp}°C | 💨 ${wind} m/s | ☁️ ${cloud}% | 📍 ${location}`;
      } else {
        // Extract today's forecast
        const tempRangeMatch = text.match(/(\d+)-(\d+)°[CF]/);
        const bestTimesMatch = text.match(/Best outdoor times.*?(\d+ [AP]M)/gi);

        const tempMin = tempRangeMatch ? tempRangeMatch[1] : "18";
        const tempMax = tempRangeMatch ? tempRangeMatch[2] : "25";
        const bestTimes = bestTimesMatch
          ? bestTimesMatch.slice(0, 3).join(", ")
          : "11 AM, 2 PM, 8 PM";

        return `🌡️ ${tempMin}-${tempMax}°C | ⭐ Best outdoor times: ${bestTimes}`;
      }
    }

    // Generate the email template HTML
    const emailHTML = generateDailyReportEmail(dailyReportData);

    // Debug: Check if Environment & Lifestyle section exists in HTML
    console.log(
      "🌍 Environment & Lifestyle section in HTML:",
      emailHTML.includes("Environment & Lifestyle")
    );
    console.log("🎵 Music section in HTML:", emailHTML.includes("Music"));
    console.log("🌤️ Weather section in HTML:", emailHTML.includes("Weather"));

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
          <style
            dangerouslySetInnerHTML={{
              __html: `
              .report-content [style*="display:grid"] {
                display: grid !important;
              }
              .report-content [style*="grid-template-columns"] {
                grid-template-columns: 1fr 1fr !important;
              }
              .report-content [style*="gap:12px"] {
                gap: 12px !important;
              }
            `,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from "react";
import { ReportsHeader } from "@/components/reports/reports-header";
import { QuickStats } from "@/components/reports/quick-stats";
// import { ReportGenerator } from "@/components/reports/report-generator";
import { ReportsTable } from "@/components/reports/reports-table";
import { InfoCards } from "@/components/reports/info-cards";
import { ReportsLoader } from "@/components/reports/reports-loader";
import { useToast } from "@/hooks/use-toast";
// import { useRouter } from "next/navigation";

// Type for the report data
type ReportData = {
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
};

export default function ReportsPage() {
  // const [isGenerating, setIsGenerating] = useState(false);
  // const [currentReport, setCurrentReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  // const router = useRouter();

  // Fetch reports from API on component mount
  useEffect(() => {
    fetchReports();
    checkIntegrations();
  }, []);

  const checkIntegrations = async () => {
    try {
      const response = await fetch("/api/integrations/check-tokens");

      if (response.ok) {
        const data = await response.json();

        if (!data.hasIntegrations) {
          toast({
            title: "⚠️ No Integrations Connected",
            description:
              "Connect your data sources to generate reports. Go to Integrations page to get started.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error checking integrations:", error);
    }
  };

  const fetchReports = async () => {
    try {
      setIsLoading(true);

      // Fetch real data from the API
      const response = await fetch("/api/reports");
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        console.error("Failed to fetch reports");
        setError("Failed to fetch reports from server");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setError("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  // Show full-page loader while initial data is loading
  if (isLoading && reports.length === 0) {
    return <ReportsLoader />;
  }

  // Calculate report statistics from real data
  const totalReports = reports.length;
  const dailyReports = reports.filter((r) => r.kind === "daily").length;
  const weeklyReports = reports.filter((r) => r.kind === "weekly").length;
  const bestScore =
    reports.length > 0 ? Math.max(...reports.map((r) => r.score)) : 0;
  const latestReport = reports[0];

  // const generateReport = async (reportType: "daily" | "weekly") => {
  //   try {
  //     setIsGenerating(true);
  //     setError(null);

  //     // Get current location coordinates for weather data
  //     let latitude: number | undefined;
  //     let longitude: number | undefined;

  //     try {
  //       // Try to get current location from browser
  //       const position = await new Promise<GeolocationPosition>(
  //         (resolve, reject) => {
  //           navigator.geolocation.getCurrentPosition(resolve, reject, {
  //             timeout: 10000,
  //             enableHighAccuracy: true,
  //           });
  //         }
  //       );

  //       latitude = position.coords.latitude;
  //       longitude = position.coords.longitude;

  //       console.log("📍 Location obtained:", { latitude, longitude });
  //     } catch (locationError) {
  //       console.warn(
  //         "⚠️ Could not get current location, using default coordinates"
  //       );
  //       // Default to Lahore coordinates if location access fails
  //       latitude = 31.5204;
  //       longitude = 74.3587;
  //     }

  //     // Show generating toast
  //     toast({
  //       title: "Generating Report",
  //       description: `Creating your ${reportType} wellness report with weather data...`,
  //       duration: 3000,
  //     });

  //     const response = await fetch("/api/reports/generate", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         reportType,
  //         dateRange: reportType === "weekly" ? "weekly" : "daily",
  //         latitude,
  //         longitude,
  //       }),
  //     });

  //     if (!response.ok) {
  //       throw new Error("Failed to generate report");
  //     }

  //     const data = await response.json();
  //     setCurrentReport(data.report);

  //     // Show success toast with weather info
  //     const weatherInfo = data.weatherData ? " (including weather data)" : "";
  //     const timezoneInfo = data.timezone ? ` in timezone ${data.timezone}` : "";

  //     // Show timezone warning if present
  //     if (data.timezoneWarning) {
  //       toast({
  //         title: "⚠️ Timezone Warning",
  //         description: data.timezoneWarning,
  //         variant: "destructive",
  //         duration: 8000,
  //       });
  //     }

  //     toast({
  //       title: "Report Generated Successfully! 🎉",
  //       description: `Your ${reportType} report has been created${weatherInfo}${timezoneInfo}.`,
  //       duration: 5000,
  //     });

  //     // Reload the page after a short delay
  //     setTimeout(() => {
  //       router.refresh();
  //       window.location.reload();
  //     }, 2000);
  //   } catch (err) {
  //     const errorMessage =
  //       err instanceof Error ? err.message : "An error occurred";
  //     setError(errorMessage);

  //     // Show error toast
  //     toast({
  //       title: "Report Generation Failed",
  //       description: errorMessage,
  //       variant: "destructive",
  //       duration: 5000,
  //     });
  //   } finally {
  //     setIsGenerating(false);
  //   }
  // };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className=" md:p-3 space-y-4 sm:space-y-6">
        {/* Header */}
        <ReportsHeader isLoading={isLoading} onRefresh={fetchReports} />

        {/* Quick Stats */}
        <QuickStats
          isLoading={isLoading}
          totalReports={totalReports}
          dailyReports={dailyReports}
          weeklyReports={weeklyReports}
          bestScore={bestScore}
          latestReportScore={latestReport?.score}
        />

        {/* Report Generation Controls */}
        {/* <ReportGenerator
          isLoading={isLoading}
          onGenerate={generateReport}
          isGenerating={isGenerating}
          error={error}
        /> */}

        {/* Information Cards */}
        <InfoCards />

        {/* All Reports List */}
        <ReportsTable isLoading={isLoading} reports={reports} />
      </div>
    </div>
  );
}

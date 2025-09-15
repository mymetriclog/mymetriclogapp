import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  BarChart3,
  Loader2,
  MapPin,
  Cloud,
  Clock,
  AlertCircle,
  Link,
} from "lucide-react";

type ReportType = "daily" | "weekly";

interface ReportGeneratorProps {
  isLoading: boolean;
  onGenerate: (reportType: ReportType) => void;
  isGenerating: boolean;
  error: string | null;
}

export function ReportGenerator({
  isLoading,
  onGenerate,
  isGenerating,
  error,
}: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt"
  >("prompt");
  const [hasIntegrations, setHasIntegrations] = useState<boolean | null>(null);
  const [isCheckingIntegrations, setIsCheckingIntegrations] = useState(true);

  useEffect(() => {
    // Check location permission status
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setLocationPermission(result.state);
      });
    }

    // Check if user has any integrations
    checkIntegrations();
  }, []);

  const checkIntegrations = async () => {
    try {
      setIsCheckingIntegrations(true);
      const response = await fetch("/api/integrations/check-tokens");

      if (response.ok) {
        const data = await response.json();
        setHasIntegrations(data.hasIntegrations);
        console.log("Integration check result:", data);
      } else {
        console.error("Failed to check integrations");
        setHasIntegrations(false);
      }
    } catch (error) {
      console.error("Error checking integrations:", error);
      setHasIntegrations(false);
    } finally {
      setIsCheckingIntegrations(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true,
          });
        }
      );
      setLocationPermission("granted");
    } catch (error) {
      setLocationPermission("denied");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-28"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-5" />
          Generate Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="daily"
              name="reportType"
              value="daily"
              checked={reportType === "daily"}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="daily" className="text-sm font-medium">
              Daily Report
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="weekly"
              name="reportType"
              value="weekly"
              checked={reportType === "weekly"}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="weekly" className="text-sm font-medium">
              Weekly Report
            </label>
          </div>
        </div>

        {/* Location Permission Status */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="size-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Weather Data
            </span>
          </div>
          {locationPermission === "granted" ? (
            <p className="text-sm text-blue-700">
              ✅ Location access granted. Weather data will be included in your
              report.
            </p>
          ) : locationPermission === "denied" ? (
            <div className="space-y-2">
              <p className="text-sm text-red-700">
                ❌ Location access denied. Reports will use default coordinates
                (Lahore, PK).
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={requestLocationPermission}
                className="text-xs"
              >
                <MapPin className="size-3 mr-1" />
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-blue-700">
                📍 Location access needed for weather data in reports.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={requestLocationPermission}
                className="text-xs"
              >
                <MapPin className="size-3 mr-1" />
                Grant Location Access
              </Button>
            </div>
          )}
        </div>

        {/* Timezone Information */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="size-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Report Timezone
            </span>
          </div>
          <p className="text-sm text-green-700">
            📅 Reports will be generated according to your timezone setting in
            your profile.
          </p>
          <p className="text-xs text-green-600 mt-1">
            This ensures that "yesterday" and "today" are calculated based on
            your local time, not UTC.
          </p>
        </div>

        {/* Timezone Warning for UTC users */}
        {(() => {
          const userTimezone = localStorage.getItem("userTimezone") || "UTC";
          if (userTimezone === "UTC") {
            return (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="size-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    ⚠️ Timezone Issue Detected
                  </span>
                </div>
                <p className="text-sm text-red-700">
                  Your timezone is currently set to UTC. This will cause reports
                  to be generated with incorrect dates.
                </p>
                <p className="text-xs text-red-600 mt-2">
                  <strong>To fix this:</strong> Go to Settings → Profile and
                  update your timezone to your local timezone (e.g.,
                  "Asia/Karachi" for Pakistan).
                </p>
              </div>
            );
          }
          return null;
        })()}

        {/* Integration Check */}
        {isCheckingIntegrations ? (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Checking integrations...
              </span>
            </div>
          </div>
        ) : hasIntegrations === false ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="size-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                ⚠️ No Integrations Connected
              </span>
            </div>
            <p className="text-sm text-red-700 mb-3">
              You need to connect at least one data source to generate reports.
              Reports include data from Gmail, Google Calendar, Fitbit, Spotify,
              and weather.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={checkIntegrations}
                className="text-xs"
              >
                <Link className="size-3 mr-1" />
                Refresh
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => (window.location.href = "/integrations")}
                className="text-xs bg-red-600 hover:bg-red-700"
              >
                <Link className="size-3 mr-1" />
                Connect Integrations
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Success message when integrations are found */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Link className="size-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  ✅ Integrations Connected
                </span>
              </div>
              <p className="text-sm text-green-700">
                Great! You have connected data sources. You can now generate
                comprehensive reports.
              </p>
            </div>

            <Button
              onClick={() => onGenerate(reportType)}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText className="size-4 mr-2" />
                  Generate {reportType === "daily" ? "Daily" : "Weekly"} Report
                </>
              )}
            </Button>
          </>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Button } from "@/components/ui/button";
import {
  FileText,
  TrendingUp,
  Loader2,
  Clock,
  Link,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ReportsHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function ReportsHeader({ isLoading, onRefresh }: ReportsHeaderProps) {
  const [userTimezone, setUserTimezone] = useState<string>("UTC");
  const [hasIntegrations, setHasIntegrations] = useState<boolean | null>(null);
  const [isCheckingIntegrations, setIsCheckingIntegrations] = useState(true);

  useEffect(() => {
    // Get user timezone from localStorage or default to UTC
    const savedTimezone = localStorage.getItem("userTimezone") || "UTC";
    setUserTimezone(savedTimezone);

    // Check integrations status
    checkIntegrations();
  }, []);

  const checkIntegrations = async () => {
    try {
      setIsCheckingIntegrations(true);
      const response = await fetch("/api/integrations/check-tokens");

      if (response.ok) {
        const data = await response.json();
        setHasIntegrations(data.hasIntegrations);
      } else {
        setHasIntegrations(false);
      }
    } catch (error) {
      console.error("Error checking integrations:", error);
      setHasIntegrations(false);
    } finally {
      setIsCheckingIntegrations(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0">
            <FileText className="size-6 sm:size-8 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              Reports & Analytics
            </h1>

            {/* Timezone Information */}
            <div className="flex items-center gap-2 mt-1 sm:mt-2 text-xs sm:text-sm text-blue-700">
              <Clock className="size-3 sm:size-4 flex-shrink-0" />
              <span className="truncate">
                Reports will be generated in timezone:{" "}
                <strong>{userTimezone}</strong>
              </span>
            </div>

            {/* Integration Status */}
            {!isCheckingIntegrations && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1 sm:mt-2 text-xs sm:text-sm">
                {hasIntegrations ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <Link className="size-3 sm:size-4 flex-shrink-0" />
                    <span>✅ Integrations connected</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-red-700">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="size-3 sm:size-4 flex-shrink-0" />
                      <span>⚠️ No integrations connected</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => (window.location.href = "/integrations")}
                      className="text-xs h-6 px-2 w-fit"
                    >
                      Connect Now
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <TrendingUp className="size-4" />
          )}
          <span className="hidden sm:inline">Refresh</span>
          <span className="sm:hidden">Refresh Data</span>
        </Button>
      </div>
    </div>
  );
}

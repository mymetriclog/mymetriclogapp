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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
      <div className="flex items-center justify-between reports-header-section flex-wrap">
        <div className="flex items-start gap-4 reports-header-section">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
            <FileText className="size-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Reports & Analytics
            </h1>

            {/* Timezone Information */}
            <div className="flex items-center gap-2 mt-2 text-sm text-blue-700">
              <Clock className="size-4" />
              <span>
                Reports will be generated in timezone:{" "}
                <strong>{userTimezone}</strong>
              </span>
            </div>

            {/* Integration Status */}
            {!isCheckingIntegrations && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                {hasIntegrations ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <Link className="size-4" />
                    <span>✅ Integrations connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="size-4" />
                    <span>⚠️ No integrations connected</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => (window.location.href = "/integrations")}
                      className="text-xs h-6 px-2"
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
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <TrendingUp className="size-4" />
          )}
          Refresh
        </Button>
      </div>
    </div>
  );
}

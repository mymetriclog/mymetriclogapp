"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function ManualRefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      // Show loading notification
      const loadingToast = console.log(
        "🔄 Manually Refreshing Tokens",
        "Checking and refreshing expired/expiring tokens..."
      );

      const response = await fetch("/api/integrations/refresh-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();

        // Dismiss loading toast
        console.log(loadingToast);

        if (result.summary.successful > 0 && result.summary.failed === 0) {
          // All tokens refreshed successfully
          console.log(
            "✅ Manual Refresh Complete",
            `Successfully refreshed ${result.summary.successful} integration tokens.`
          );

          // Refresh the page to show updated status
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else if (result.summary.successful > 0 && result.summary.failed > 0) {
          // Partial success
          console.warn(
            "⚠️ Partial Refresh Complete",
            `Refreshed ${result.summary.successful} tokens successfully, but ${result.summary.failed} failed.`
          );

          // Refresh the page to show updated status
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else if (result.summary.successful === 0) {
          // All tokens failed to refresh
          console.error(
            "❌ Manual Refresh Failed",
            "No tokens were refreshed. All integrations may need manual reconnection."
          );
        }
      } else if (response.status === 429) {
        // Rate limited
        const errorData = await response.json();
        console.log(loadingToast);
        console.warn(
          "⏳ Rate Limited",
          errorData.message || "Please wait before trying again."
        );
      } else {
        throw new Error("Failed to refresh tokens");
      }
    } catch (error) {
      console.error("❌ Manual refresh failed:", error);
      console.error(
        "❌ Manual Refresh Failed",
        "Failed to refresh tokens. Please try again or reconnect integrations manually."
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      onClick={handleManualRefresh}
      disabled={isRefreshing}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
      {isRefreshing ? "Refreshing..." : "Refresh Tokens"}
    </Button>
  );
}

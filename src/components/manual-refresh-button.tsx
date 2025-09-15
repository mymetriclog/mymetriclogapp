"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { notifications } from "@/lib/notifications";

export function ManualRefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      // Show loading notification
      const loadingToast = notifications.loading(
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
        notifications.dismissById(loadingToast);

        if (result.summary.successful > 0 && result.summary.failed === 0) {
          // All tokens refreshed successfully
          notifications.success(
            "✅ Manual Refresh Complete",
            `Successfully refreshed ${result.summary.successful} integration tokens.`
          );

          // Refresh the page to show updated status
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else if (result.summary.successful > 0 && result.summary.failed > 0) {
          // Partial success
          notifications.warning(
            "⚠️ Partial Refresh Complete",
            `Refreshed ${result.summary.successful} tokens successfully, but ${result.summary.failed} failed.`
          );

          // Refresh the page to show updated status
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else if (result.summary.successful === 0) {
          // All tokens failed to refresh
          notifications.error(
            "❌ Manual Refresh Failed",
            "No tokens were refreshed. All integrations may need manual reconnection."
          );
        }
      } else if (response.status === 429) {
        // Rate limited
        const errorData = await response.json();
        notifications.dismissById(loadingToast);
        notifications.warning(
          "⏳ Rate Limited",
          errorData.message || "Please wait before trying again."
        );
      } else {
        throw new Error("Failed to refresh tokens");
      }
    } catch (error) {
      console.error("❌ Manual refresh failed:", error);
      notifications.error(
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

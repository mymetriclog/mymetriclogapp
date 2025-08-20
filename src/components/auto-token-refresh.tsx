"use client";

import { useEffect, useState, useRef } from "react";
import { notifications } from "@/lib/notifications";

interface TokenStatus {
  provider: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number;
  expiresAt: number | null;
  hasRefreshToken: boolean;
  canAutoRefresh: boolean;
}

interface AutoTokenRefreshProps {
  tokenStatuses: TokenStatus[];
}

export function AutoTokenRefresh({ tokenStatuses }: AutoTokenRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasRefreshed, setHasRefreshed] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only run once when component mounts
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Check if we've already refreshed today
    const today = new Date().toDateString();
    const lastRefreshDate = localStorage.getItem("lastTokenRefreshDate");

    if (lastRefreshDate === today) {
      console.log("🔄 Tokens already refreshed today, skipping auto-refresh");
      return;
    }

    // Check if we've already refreshed in this session
    const sessionRefreshKey = `sessionRefresh_${
      tokenStatuses.length
    }_${tokenStatuses.map((t) => t.provider).join("_")}`;
    const hasRefreshedThisSession = sessionStorage.getItem(sessionRefreshKey);

    if (hasRefreshedThisSession) {
      console.log(
        "🔄 Tokens already refreshed this session, skipping auto-refresh"
      );
      return;
    }

    // Only auto-refresh once per session and once per day
    if (hasRefreshed) return;

    const tokensNeedingRefresh = tokenStatuses.filter(
      (token) => token.canAutoRefresh
    );

    if (tokensNeedingRefresh.length > 0 && !isRefreshing) {
      // Mark this session as having attempted refresh
      sessionStorage.setItem(sessionRefreshKey, "true");

      // Delay auto-refresh to avoid conflicts with other notifications
      setTimeout(() => {
        handleAutoRefresh(tokensNeedingRefresh);
      }, 3000); // Wait 3 seconds for other notifications to show first
    }

    // Cleanup function to prevent memory leaks
    return () => {
      // Clean up any pending operations if component unmounts
      if (isRefreshing) {
        setIsRefreshing(false);
      }
    };
  }, []); // Empty dependency array - only run once

  const handleAutoRefresh = async (tokensToRefresh: TokenStatus[]) => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      // Show loading notification
      const loadingToast = notifications.autoRefreshStarted(
        tokensToRefresh.length
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
          notifications.autoRefreshSuccess(result.summary.successful);

          // Mark as refreshed for today
          localStorage.setItem(
            "lastTokenRefreshDate",
            new Date().toDateString()
          );

          // Refresh the page to show updated status
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else if (result.summary.successful > 0 && result.summary.failed > 0) {
          // Partial success - show notifications one by one
          await showNotificationsSequentially(result);

          // Mark as refreshed for today
          localStorage.setItem(
            "lastTokenRefreshDate",
            new Date().toDateString()
          );

          // Refresh the page to show updated status
          setTimeout(() => {
            window.location.reload();
          }, 4000);
        } else if (result.summary.successful === 0) {
          // All tokens failed to refresh
          notifications.autoRefreshFailed("All tokens failed to refresh");
        }
      } else {
        throw new Error("Failed to refresh tokens");
      }
    } catch (error) {
      console.error("❌ Auto-refresh failed:", error);
      notifications.autoRefreshFailed(
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsRefreshing(false);
      setHasRefreshed(true);
    }
  };

  // Show notifications one by one with delays
  const showNotificationsSequentially = async (result: any) => {
    const { successful, failed } = result.results;

    // Show success notification first
    if (successful.length > 0) {
      notifications.autoRefreshPartial(successful.length, failed.length);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Show individual success notifications one by one
    for (let i = 0; i < successful.length; i++) {
      const token = successful[i];
      notifications.success(
        `✅ ${token.provider} Refreshed`,
        `Successfully refreshed ${token.provider} token.`
      );
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    // Show individual failure notifications one by one
    for (let i = 0; i < failed.length; i++) {
      const token = failed[i];
      notifications.warning(
        `⚠️ ${token.provider} Failed`,
        `Failed to refresh ${token.provider}: ${token.error}`
      );
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  };

  // This component doesn't render anything visible
  return null;
}

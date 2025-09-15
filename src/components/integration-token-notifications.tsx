"use client";

import { useEffect, useState, useRef } from "react";

interface TokenStatus {
  provider: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number;
  expiresAt: number | null;
  hasRefreshToken: boolean;
  canAutoRefresh: boolean;
}

interface IntegrationTokenNotificationsProps {
  tokenStatuses: TokenStatus[];
}

export function IntegrationTokenNotifications({
  tokenStatuses,
}: IntegrationTokenNotificationsProps) {
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(
    new Set()
  );
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only run once when component mounts
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Show notifications for expired tokens (only once)
    tokenStatuses.forEach((token) => {
      if (
        token.isExpired &&
        !token.canAutoRefresh &&
        !shownNotifications.has(`expired-${token.provider}`)
      ) {
        // Delay each notification to show them one by one
        setTimeout(() => {
          console.warn(token.provider);
        }, 1000 + tokenStatuses.indexOf(token) * 2000); // 1s + 2s per token

        setShownNotifications((prev) =>
          new Set(prev).add(`expired-${token.provider}`)
        );
      }

      // Show notifications for tokens expiring soon (only once)
      if (
        token.isExpiringSoon &&
        !token.canAutoRefresh &&
        !shownNotifications.has(`expiring-${token.provider}`)
      ) {
        // Delay each notification to show them one by one
        setTimeout(() => {
          console.warn(token.provider, token.daysUntilExpiry);
        }, 2000 + tokenStatuses.indexOf(token) * 2000); // 2s + 2s per token

        setShownNotifications((prev) =>
          new Set(prev).add(`expiring-${token.provider}`)
        );
      }

      // Removed auto-refresh notifications - tokens will refresh silently
    });
  }, []); // Empty dependency array - only run once

  // This component doesn't render anything visible
  return null;
}

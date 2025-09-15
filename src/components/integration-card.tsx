"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Music,
  Watch,
  ShieldAlert,
  RefreshCw,
  Calendar,
  Mail,
  Clock,
  CheckSquare,
} from "lucide-react";
import type { IntegrationItem } from "@/app/data/mock";

const iconMap: Record<IntegrationItem["key"], any> = {
  spotify: Music,
  fitbit: Watch,
  "google-calendar": Calendar,
  gmail: Mail,
  "google-tasks": CheckSquare,
};

export function IntegrationCard({
  integration,
}: {
  integration: IntegrationItem;
}) {
  const { key, name, status, lastSync, created_at, notes } = integration;

  const Icon = iconMap[key];
  const badgeClasses =
    status === "connected"
      ? "bg-emerald-500/10 text-emerald-600"
      : status === "error"
      ? "bg-rose-500/10 text-rose-600"
      : "bg-muted text-foreground/70";

  // Format the created_at timestamp
  const formatCreatedAt = (timestamp?: string) => {
    if (!timestamp) return "—";
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      );

      // Show relative time for recent connections
      if (diffInHours < 24) {
        if (diffInHours < 1) {
          const diffInMinutes = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60)
          );
          return `${diffInMinutes} minutes ago`;
        }
        return `${diffInHours} hours ago`;
      }

      // Show full date and time for older connections
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timestamp;
    }
  };

  function getHref() {
    switch (key) {
      case "spotify":
        return "/integrations/spotify";
      case "fitbit":
        return "/integrations/fitbit";
      case "gmail":
        return "/integrations/gmail";
      case "google-calendar":
        return "/integrations/google-calendar";
      case "google-tasks":
        return "/integrations/google-tasks";

      default:
        return "/integrations";
    }
  }

  const href = getHref();
  // Disable connect/manage for integrations without a dedicated page yet.
  const isActionable =
    key === "spotify" ||
    key === "fitbit" ||
    key === "gmail" ||
    key === "google-calendar" ||
    key === "google-tasks";

  return (
    <Card className="h-full flex flex-col min-h-[200px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Icon className="size-4" />
          <span>{name}</span>
        </CardTitle>
        <Badge className={badgeClasses} variant="secondary">
          {status}
        </Badge>
      </CardHeader>
      <CardContent className="text-sm flex-grow flex flex-col justify-between">
        <div className="flex-grow">
          <div className="space-y-1">
            <div className="text-muted-foreground">
              Last sync: {lastSync ?? "—"}
            </div>
            {created_at && (
              <div
                className="text-muted-foreground text-xs flex items-center gap-1"
                title={`Connected on: ${new Date(created_at).toLocaleString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  }
                )}`}
              >
                <Clock className="size-3" />
                Connected: {formatCreatedAt(created_at)}
                <span className="ml-2 text-muted-foreground/70">
                  (
                  {new Date(created_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                  )
                </span>
              </div>
            )}
          </div>
          {notes ? (
            <div className="mt-2 text-muted-foreground">{notes}</div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-2">
          {isActionable && status === "connected" && (
            <Button variant="outline" size="sm" asChild>
              <Link href={href}>Manage</Link>
            </Button>
          )}
          {isActionable && status === "disconnected" && (
            <Button
              asChild
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-600/90"
            >
              <Link href={href}>Connect</Link>
            </Button>
          )}
          {isActionable && status === "error" && (
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-600/90"
              asChild
            >
              <Link href={href}>
                <RefreshCw className="mr-2 size-4" />
                Reconnect
              </Link>
            </Button>
          )}
        </div>

        {status === "error" && (
          <div className="mt-3 flex items-center gap-2 text-rose-600 text-xs">
            <ShieldAlert className="size-3" />
            <span>Token expired. Please reconnect.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

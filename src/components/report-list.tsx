"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, FileCode2, FileText, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

// Type for the report data from API
export type ReportItem = {
  id: string;
  date: string;
  kind: "daily" | "weekly";
  score: number;
  html: string;
  json: any;
  ai_insights?: any;
  created_at?: string;
};

export function ReportList({
  reports = [],
  limit,
}: {
  reports?: ReportItem[];
  limit?: number;
}) {
  const items = typeof limit === "number" ? reports.slice(0, limit) : reports;

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-lg font-medium text-muted-foreground">
          No reports available yet
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Connect your integrations to start generating reports
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((r) => (
        <ReportCard key={r.id} report={r} />
      ))}
    </div>
  );
}

function ReportCard({ report }: { report: ReportItem }) {
  const [view, setView] = useState<"html" | "json">("html");

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 70) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Poor";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border-2 hover:border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {report.kind === "daily" ? (
              <Calendar className="size-4 text-blue-600" />
            ) : (
              <TrendingUp className="size-4 text-purple-600" />
            )}
            <Badge
              variant="secondary"
              className={cn(
                "text-xs font-medium",
                report.kind === "daily"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-purple-50 text-purple-700"
              )}
            >
              {report.kind.toUpperCase()}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">{report.date}</div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={cn("text-4xl font-bold", getScoreColor(report.score))}
          >
            {report.score}
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Score</span>
            <span
              className={cn(
                "text-xs font-medium px-2 py-1 rounded-full border",
                getScoreColor(report.score)
              )}
            >
              {getScoreLabel(report.score)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={view === "html" ? "default" : "outline"}
            onClick={() => setView("html")}
            className={cn(
              "flex-1",
              view === "html" && "bg-emerald-600 hover:bg-emerald-600/90"
            )}
          >
            <FileText className="mr-2 size-4" />
            HTML
          </Button>
          <Button
            size="sm"
            variant={view === "json" ? "default" : "outline"}
            onClick={() => setView("json")}
            className={cn(
              "flex-1",
              view === "json" && "bg-emerald-600 hover:bg-emerald-600/90"
            )}
          >
            <FileCode2 className="mr-2 size-4" />
            JSON
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto hover:bg-blue-50"
          >
            <Eye className="mr-2 size-4" />
            View
          </Button>
        </div>

        <div className="rounded-lg border-2 bg-muted/30 p-4 max-h-48 overflow-auto text-sm">
          {view === "html" ? (
            <div
              dangerouslySetInnerHTML={{ __html: report.html }}
              aria-label={`HTML content for ${report.id}`}
              className="prose prose-sm max-w-none"
            />
          ) : (
            <pre className="text-xs bg-white p-2 rounded border overflow-auto">
              {JSON.stringify(report.json, null, 2)}
            </pre>
          )}
        </div>

        {/* Show AI insights if available */}
        {report.ai_insights && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              AI Insights
            </h4>
            {report.ai_insights.mantra && (
              <p className="text-xs text-blue-800 mb-1">
                <strong>Mantra:</strong> "{report.ai_insights.mantra}"
              </p>
            )}
            {report.ai_insights.insight && (
              <p className="text-xs text-blue-800">
                <strong>Insight:</strong> {report.ai_insights.insight}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

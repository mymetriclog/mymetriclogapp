"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkline } from "@/components/sparkline";
import { FileText, BarChart3, TrendingUp } from "lucide-react";
import { getScoreBasedStyling } from "@/lib/scoring/wellness-scoring";

interface ReportCardProps {
  title: string;
  value: string;
  iconName?: string;
  color?: string;
  bgColor?: string;
  spark?: number[];
  score?: number; // New prop for score-based styling
}

export function ReportCard({
  title,
  value,
  iconName,
  color,
  bgColor,
  spark,
  score,
}: ReportCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts with 0.5s delay
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Use score-based styling if score is provided, otherwise use props
  const styling = score !== undefined ? getScoreBasedStyling(score) : {
    color: color || "text-blue-600",
    bgColor: bgColor || "bg-blue-100",
    strokeColor: "hsl(221 83% 53%)",
    icon: iconName || "FileText",
    quality: ""
  };

  // Map icon names to actual components
  const getIcon = (name: string) => {
    switch (name) {
      case "FileText":
        return FileText;
      case "BarChart3":
        return BarChart3;
      case "TrendingUp":
        return TrendingUp;
      default:
        return FileText;
    }
  };

  const Icon = getIcon(styling.icon);

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${styling.bgColor}`}>
              <Icon className={`size-6 ${styling.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className={`text-2xl font-bold ${styling.color}`}>{value}</p>
            </div>
          </div>
          {spark && (
            <div className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
              <Sparkline 
                values={spark} 
                stroke={styling.strokeColor}
                animate={isVisible}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

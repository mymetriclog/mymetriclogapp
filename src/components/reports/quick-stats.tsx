import { Card, CardContent } from "@/components/ui/card";
import { FileText, Calendar, TrendingUp, Target, Clock } from "lucide-react";

interface QuickStatCardProps {
  title: string;
  value: string;
  icon: any;
  color: string;
  bgColor: string;
  className?: string;
}

function QuickStatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  className = "",
}: QuickStatCardProps) {
  return (
    <Card
      className={`hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`p-1.5 sm:p-2 rounded-lg ${bgColor} flex-shrink-0`}>
            <Icon className={`size-4 sm:size-5 ${color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground truncate">
              {title}
            </p>
            <p className={`text-base sm:text-lg font-bold ${color}`}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickStatsProps {
  isLoading: boolean;
  totalReports: number;
  dailyReports: number;
  weeklyReports: number;
  bestScore: number;
  latestReportScore?: number;
}

export function QuickStats({
  isLoading,
  totalReports,
  dailyReports,
  weeklyReports,
  bestScore,
  latestReportScore,
}: QuickStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card
            key={i}
            className={`animate-pulse ${
              i === 4 ? "col-span-2 sm:col-span-1 lg:col-span-1" : ""
            }`}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
                <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                  <div className="h-3 bg-gray-200 rounded w-16 sm:w-20"></div>
                  <div className="h-4 sm:h-6 bg-gray-200 rounded w-12 sm:w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      <QuickStatCard
        title="Total Reports"
        value={totalReports.toString()}
        icon={FileText}
        color="text-blue-600"
        bgColor="bg-blue-50"
      />
      <QuickStatCard
        title="Daily Reports"
        value={dailyReports.toString()}
        icon={Calendar}
        color="text-green-600"
        bgColor="bg-green-50"
      />
      <QuickStatCard
        title="Weekly Reports"
        value={weeklyReports.toString()}
        icon={TrendingUp}
        color="text-purple-600"
        bgColor="bg-purple-50"
      />
      <QuickStatCard
        title="Best Score"
        value={bestScore > 0 ? bestScore.toString() : "N/A"}
        icon={Target}
        color="text-emerald-600"
        bgColor="bg-emerald-50"
      />
      <QuickStatCard
        title="Latest Score"
        value={latestReportScore?.toString() || "N/A"}
        icon={Clock}
        color="text-orange-600"
        bgColor="bg-orange-50"
        className="col-span-2 sm:col-span-1 lg:col-span-1"
      />
    </div>
  );
}

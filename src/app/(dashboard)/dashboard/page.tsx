import { ReportCard } from "@/components/report-card";
import { RecentReportCard } from "@/components/recent-report-card";
import { Button } from "@/components/ui/button";
import { Cloud, TrendingUp, Calendar, Star, ArrowRight } from "lucide-react";
import Link from "next/link";

import { WeatherCard } from "@/components/weather-card";
import { WeatherForecastCard } from "@/components/weather-forecast-card";
import { WeatherLocationButton } from "@/components/weather-location-button";
import { DashboardClientWrapper } from "@/components/dashboard-client-wrapper";
import { IntegrationTokenNotifications } from "@/components/integration-token-notifications";

import { getServerSession } from "@/lib/supabase/server";
import {
  validateIntegrationTokens,
  getExpiredTokens,
  getExpiringSoonTokens,
} from "@/lib/integrations/token-validator";
import { cookies } from "next/headers";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = "force-dynamic";

// Type for the report data
type ReportData = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  date: string;
  kind: "daily" | "weekly";
  score: number;
  html: string;
  json: any;
  ai_insights?: any;
  created_at?: string;
};

// Token notification interfaces
interface TokenStatus {
  provider: string;
  daysUntilExpiry?: number;
  expired?: boolean;
}

interface DashboardStats {
  totalReports: number;
  bestScore: number;
  latestScore: number;
  averageScore: number;
  reportsThisWeek: number;
}

// Utility functions
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const calculateStats = (reports: ReportData[]): DashboardStats => {
  if (reports.length === 0) {
    return {
      totalReports: 0,
      bestScore: 0,
      latestScore: 0,
      averageScore: 0,
      reportsThisWeek: 0,
    };
  }

  const scores = reports.map((r) => r.score);
  const bestScore = Math.max(...scores);
  const latestScore = reports[0].score;
  const averageScore = Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length
  );

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const reportsThisWeek = reports.filter(
    (r) => new Date(r.created_at || r.date) >= oneWeekAgo
  ).length;

  return {
    totalReports: reports.length,
    bestScore,
    latestScore,
    averageScore,
    reportsThisWeek,
  };
};

// Fetch reports with error handling
async function fetchReports(): Promise<ReportData[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const cookieHeader = (await cookies()).toString();

    const response = await fetch(`${baseUrl}/api/reports`, {
      cache: "no-store",
      headers: { Cookie: cookieHeader },
    });

    if (!response.ok) {
      console.warn(`⚠️ Dashboard: Reports API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.reports || [];
  } catch (error) {
    console.error("❌ Dashboard: Error fetching reports:", error);
    return [];
  }
}
// Fetch token statuses with error handling
async function fetchTokenStatuses(userId: string) {
  try {
    const tokenStatuses = await validateIntegrationTokens(userId);
    return {
      tokenStatuses,
      expiredTokens: getExpiredTokens(tokenStatuses),
      expiringSoonTokens: getExpiringSoonTokens(tokenStatuses),
    };
  } catch (error) {
    console.error("❌ Dashboard: Error validating tokens:", error);
    return {
      tokenStatuses: [],
      expiredTokens: [],
      expiringSoonTokens: [],
    };
  }
}

// Welcome Header Component
const WelcomeHeader = ({
  name,
  timezone,
  stats,
}: {
  name: string;
  timezone: string;
  stats: DashboardStats;
}) => (
  <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl">
    {/* Background decoration */}
    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />

    <div className="relative z-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
            <span className="mr-2">✨</span>
            {getGreeting()}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Welcome back,
            <br />
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              {name}
            </span>
          </h1>

          <p className="text-blue-100 text-lg max-w-md leading-relaxed">
            Track your wellness journey with personalized insights and real-time
            data
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:w-64">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-200 text-sm">Latest Score</span>
              <TrendingUp className="h-4 w-4 text-green-300" />
            </div>
            <div className="text-2xl font-bold">{stats.latestScore}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-200 text-sm">This Week</span>
              <Calendar className="h-4 w-4 text-blue-300" />
            </div>
            <div className="text-2xl font-bold">{stats.reportsThisWeek}</div>
          </div>
        </div>
      </div>

      {/* Timezone info */}
      <div className="mt-6 pt-6 border-t border-white/20">
        <div className="flex items-center gap-3 text-blue-100">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            🌍
          </div>
          <span className="text-sm">
            Your timezone:{" "}
            <span className="font-semibold text-white">{timezone}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
);

// Token Notification Component
const TokenNotificationCard = ({
  type,
  tokens,
  expiringSoonTokens,
}: {
  type: "expired" | "expiring";
  tokens: string[] | TokenStatus[];
  expiringSoonTokens?: TokenStatus[];
}) => {
  if (tokens.length === 0) return null;

  const isExpired = type === "expired";
  const colors = isExpired
    ? {
        bg: "from-red-50 to-orange-50",
        border: "border-red-200",
        text: "text-red-800",
        accent: "text-red-600",
      }
    : {
        bg: "from-blue-50 to-indigo-50",
        border: "border-blue-200",
        text: "text-blue-800",
        accent: "text-blue-600",
      };

  return (
    <div
      className={`bg-gradient-to-r ${colors.bg} ${colors.border} border rounded-2xl p-6 shadow-lg`}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white rounded-xl shadow-sm">
          <span className="text-2xl">{isExpired ? "🚨" : "⏰"}</span>
        </div>
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${colors.text} mb-2`}>
            {isExpired ? "Integration Tokens Expired" : "Tokens Expiring Soon"}
          </h3>
          <p className={`text-sm ${colors.text} opacity-80 mb-4`}>
            {isExpired
              ? `These integrations need reconnection: ${(
                  tokens as string[]
                ).join(", ")}`
              : `These will expire soon: ${(tokens as TokenStatus[])
                  .map((t) => `${t.provider} (${t.daysUntilExpiry} days)`)
                  .join(", ")}`}
          </p>
          <Button
            asChild
            size="sm"
            className="bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <Link
              href="/integrations"
              className={`${colors.accent} flex items-center gap-2`}
            >
              Fix Integrations
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

// Section Header Component
const SectionHeader = ({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center">
          <span className="text-3xl">{icon}</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-sm"></div>
      </div>
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          {title}
        </h2>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
    {action}
  </div>
);

// Enhanced Stats Cards
const StatsGrid = ({ stats }: { stats: DashboardStats }) => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
    <ReportCard
      title="Total Reports"
      value={stats.totalReports.toString()}
      score={Math.min(stats.totalReports * 10, 100)}
      spark={[stats.totalReports]}
    />
    <ReportCard
      title="Best Score"
      value={stats.bestScore.toString()}
      score={stats.bestScore}
      spark={[stats.bestScore]}
    />
    <ReportCard
      title="Average Score"
      value={stats.averageScore.toString()}
      score={stats.averageScore}
      spark={[stats.averageScore]}
    />
    <ReportCard
      title="This Week"
      value={stats.reportsThisWeek.toString()}
      score={Math.min(stats.reportsThisWeek * 25, 100)}
      spark={[stats.reportsThisWeek]}
    />
  </div>
);

// Empty State Component
const EmptyReportsState = () => (
  <div className="text-center p-8 text-gray-500">
    <p>No records found</p>
  </div>
);

export default async function DashboardPage() {
  const session = await getServerSession();
  const user = session?.user;

  // Extract user information
  const name =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const email = user?.email || "user@example.com";
  const fullName = user?.user_metadata?.full_name;
  const timezone = user?.user_metadata?.timezone || "UTC";

  // Fetch data concurrently for better performance
  const [reports, tokenData] = await Promise.all([
    fetchReports(),
    session?.user?.id
      ? fetchTokenStatuses(session.user.id)
      : Promise.resolve({
          tokenStatuses: [],
          expiredTokens: [],
          expiringSoonTokens: [],
        }),
  ]);

  const stats = calculateStats(reports);

  return (
    <DashboardClientWrapper
      userEmail={email}
      userFullName={fullName}
      userTimezone={timezone}
    >
      <IntegrationTokenNotifications tokenStatuses={tokenData.tokenStatuses} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30">
        <div className="space-y-8 md:space-y-12">
          {/* Welcome Header */}
          <WelcomeHeader name={name} timezone={timezone} stats={stats} />

          {/* Token Notifications */}
          <div className="space-y-4">
            <TokenNotificationCard
              type="expired"
              tokens={tokenData.expiredTokens}
            />
            <TokenNotificationCard
              type="expiring"
              tokens={tokenData.expiringSoonTokens}
              expiringSoonTokens={tokenData.expiringSoonTokens}
            />
          </div>

          {/* Weather Section */}
          <section>
            <SectionHeader
              icon="🌤️"
              title="Weather & Environment"
              description="Stay informed about conditions that affect your wellness"
              action={
                <div className="flex items-center gap-3">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/weathers" className="flex items-center gap-2">
                      <Cloud className="h-4 w-4" />
                      View Details
                    </Link>
                  </Button>
                  <WeatherLocationButton />
                </div>
              }
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <WeatherCard userTimezone={timezone} />
              <WeatherForecastCard userTimezone={timezone} />
            </div>
          </section>

          {/* Reports Overview Section */}
          <section>
            <SectionHeader
              icon="📈"
              title="Wellness Analytics"
              description="Track your progress with detailed metrics and insights"
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/reports" className="flex items-center gap-2">
                    View All Reports
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              }
            />

            <StatsGrid stats={stats} />
          </section>

          {/* Recent Reports Section */}
          <section>
            <SectionHeader
              icon="📋"
              title="Recent Reports"
              description="Your latest wellness insights and recommendations"
              action={
                reports.length > 0 ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/reports" className="flex items-center gap-2">
                      View All
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null
              }
            />

            {reports.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {reports.slice(0, 6).map((report) => (
                  <RecentReportCard
                    key={report.id}
                    report={report}
                    userName={name}
                  />
                ))}
              </div>
            ) : (
              <EmptyReportsState />
            )}
          </section>
        </div>
      </div>
    </DashboardClientWrapper>
  );
}

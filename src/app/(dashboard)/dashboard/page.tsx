import { ReportCard } from "@/components/report-card";
import { RecentReportCard } from "@/components/recent-report-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cloud } from "lucide-react";
import { mockIntegrations } from "@/app/data/mock";
import Link from "next/link";

import { WeatherCard } from "@/components/weather-card";
import { WeatherForecastCard } from "@/components/weather-forecast-card";
import { WeatherLocationButton } from "@/components/weather-location-button";
import { DashboardClientWrapper } from "@/components/dashboard-client-wrapper";
import { IntegrationTokenNotifications } from "@/components/integration-token-notifications";

import { getServerSession } from "@/lib/supabase/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getInitialWeatherData } from "@/lib/weather/server-weather-service";
import {
  validateIntegrationTokens,
  getExpiredTokens,
  getExpiringSoonTokens,
} from "@/lib/integrations/token-validator";
import type { IntegrationItem } from "@/app/data/mock";
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

// Function to get real integration data (same as integrations page)
async function getIntegrationsData() {
  const session = await getServerSession();
  const supabase = await getServerSupabaseClient();

  let connectedProviders: string[] = [];
  let tokenData: Record<
    string,
    { created_at: string; expires_at?: number; refresh_token?: string }
  > = {};
  let expiredTokens: string[] = [];

  if (session) {
    const { data } = await supabase
      .from("integration_tokens")
      .select("provider, created_at, expires_at, refresh_token")
      .eq("user_id", session.user.id);

    if (data) {
      const now = Math.floor(Date.now() / 1000);

      data.forEach((d) => {
        const isExpired = d.expires_at && d.expires_at < now;
        const hasRefreshToken = !!d.refresh_token;

        // Only consider it truly expired if there's no refresh token for auto-refresh
        if (!isExpired || hasRefreshToken) {
          connectedProviders.push(d.provider);
        } else {
          expiredTokens.push(d.provider);
        }

        tokenData[d.provider] = {
          created_at: d.created_at,
          expires_at: d.expires_at,
          refresh_token: d.refresh_token,
        };
      });
    }
  }

  const items: IntegrationItem[] = mockIntegrations.map((it) => {
    const isConnected = connectedProviders.includes(it.key);
    const isExpired = expiredTokens.includes(it.key);
    const realTokenData = tokenData[it.key];
    const hasRefreshToken = realTokenData?.refresh_token;

    if (
      it.key === "spotify" ||
      it.key === "fitbit" ||
      it.key === "google-calendar" ||
      it.key === "gmail"
    ) {
      // If token is expired but has refresh token, show as connected (will auto-refresh)
      if (
        realTokenData?.expires_at &&
        realTokenData.expires_at < Math.floor(Date.now() / 1000) &&
        hasRefreshToken
      ) {
        return {
          ...it,
          status: "connected",
          lastSync: "Auto-refreshing",
          created_at: realTokenData.created_at,
          notes: `Your ${it.name} token will be automatically refreshed.`,
        };
      }

      return {
        ...it,
        status: isExpired
          ? "error"
          : isConnected
          ? "connected"
          : "disconnected",
        lastSync: isExpired ? "Token expired" : isConnected ? "just now" : "—",
        created_at: realTokenData ? realTokenData.created_at : it.created_at,
        notes: isExpired
          ? `Your ${it.name} token has expired. Please reconnect.`
          : isConnected
          ? undefined
          : `Connect your ${it.name} account.`,
      };
    }
    return it;
  });

  return { items, expiredTokens };
}

export default async function DashboardPage() {
  const session = await getServerSession();
  const user = session?.user;
  const name =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "User";
  const email = user?.email || "user@example.com";
  const fullName = user?.user_metadata?.full_name as string | undefined;
  const timezone =
    (user?.user_metadata?.timezone as string | undefined) || "UTC";

  // Get initial weather data for user's timezone
  let initialWeatherData = null;
  try {
    initialWeatherData = await getInitialWeatherData(timezone);
  } catch (error) {
    console.error("❌ Dashboard: Error getting initial weather data:", error);
    // Continue without weather data - it will be fetched client-side
  }

  // Get token validation data
  let tokenStatuses: any[] = [];
  let expiredTokens: string[] = [];
  let expiringSoonTokens: any[] = [];

  try {
    if (session?.user?.id) {
      tokenStatuses = await validateIntegrationTokens(session.user.id);
      expiredTokens = getExpiredTokens(tokenStatuses);
      expiringSoonTokens = getExpiringSoonTokens(tokenStatuses);
    }
  } catch (error) {
    console.error("❌ Dashboard: Error validating tokens:", error);
  }

  // Get real integration data instead of mock data
  const integrations = await getIntegrationsData();

  // Fetch real reports data from API (same as reports page)
  let reports: ReportData[] = [];
  let totalReports = 0;
  let bestScore = 0;
  let latestScore = 0;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const cookieHeader = (await cookies()).toString();
    const response = await fetch(`${baseUrl}/api/reports`, {
      cache: "no-store",
      headers: { Cookie: cookieHeader },
    });

    if (response.ok) {
      const data = await response.json();
      reports = data.reports || [];
      totalReports = reports.length;
      bestScore =
        reports.length > 0
          ? Math.max(...reports.map((r: ReportData) => r.score))
          : 0;
      latestScore = reports.length > 0 ? reports[0].score : 0;
    } else {
      // No fallback to mock data - show real data or 0
      reports = [];
      totalReports = 0;
      bestScore = 0;
      latestScore = 0;
    }
  } catch (error) {
    console.error("❌ Dashboard: Error fetching reports:", error);
    // No fallback to mock data - show real data or 0
    reports = [];
    totalReports = 0;
    bestScore = 0;
    latestScore = 0;
  }

  return (
    <DashboardClientWrapper
      userEmail={email}
      userFullName={fullName}
      userTimezone={timezone}
    >
      {/* Token Notifications Component */}
      <IntegrationTokenNotifications tokenStatuses={tokenStatuses} />

      <div className="p-0 md:p-0 space-y-4">
        {/* Expired Token Warning */}
        {expiredTokens.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-amber-600">⚠️</span>
              <div>
                <div className="font-medium text-amber-800">
                  Integration Tokens Expired
                </div>
                <div className="text-sm text-amber-700">
                  The following integrations need reconnection:{" "}
                  {expiredTokens.join(", ")}
                </div>
                <div className="mt-2">
                  <Link
                    href="/integrations"
                    className="text-sm text-amber-600 hover:text-amber-700 underline"
                  >
                    Go to Integrations →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expiring Soon Warning */}
        {expiringSoonTokens.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">⏰</span>
              <div>
                <div className="font-medium text-blue-800">
                  Integration Tokens Expiring Soon
                </div>
                <div className="text-sm text-blue-700">
                  The following integrations will expire soon:{" "}
                  {expiringSoonTokens
                    .map((t) => `${t.provider} (${t.daysUntilExpiry} days)`)
                    .join(", ")}
                </div>
                <div className="mt-2">
                  <Link
                    href="/integrations"
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Go to Integrations →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Weather Summary */}
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex items-center gap-4">
            <div className="text-2xl">🌤️</div>
            <div>
              <div className="text-sm text-muted-foreground">
                Current Weather
              </div>
              <div className="text-lg font-semibold">
                Check your location's weather
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 main-content-custom">
            <Button
              asChild
              variant="outline"
              className="flex items-center gap-2"
            >
              <Link href="/weathers">
                <Cloud className="h-4 w-4 md:hidden" />
                <span className="hidden md:inline">View Weather</span>
              </Link>
            </Button>
            <WeatherLocationButton />
          </div>
        </div>

        {/* Weather Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <WeatherCard userTimezone={timezone} />
          <WeatherForecastCard userTimezone={timezone} />
        </div>

        {/* Trends Section */}
        {/* <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Trends</h2>
            <span className="text-sm text-muted-foreground">Last 7 days</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <TrendCard
              title="HRV"
              value="60 ms"
              change="+4"
              color="hsl(142 76% 36%)"
              spark={[48, 52, 54, 55, 58, 60, 62]}
            />
            <TrendCard
              title="Sleep"
              value="7h 05m"
              change="+0h 12m"
              color="hsl(38 92% 50%)"
              spark={[6.5, 6.7, 7.0, 7.1, 7.2, 7.0, 7.08]}
            />
            <TrendCard
              title="Steps"
              value="9,450"
              change="+8%"
              color="hsl(351 94% 60%)"
              spark={[7200, 8000, 7600, 8800, 9300, 9450, 10000]}
            />
          </div>
        </div> */}

        {/* Reports Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Reports</h2>
            <Button asChild variant="ghost" className="text-emerald-600">
              <Link href="/reports">View all</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <ReportCard
              title="Total Reports"
              value={totalReports.toString()}
              score={totalReports > 0 ? 100 : 0} // Show 100 if has reports, 0 if none
              spark={totalReports > 0 ? [totalReports] : [0]}
            />
            <ReportCard
              title="Best Score"
              value={bestScore.toString()}
              score={bestScore} // Use actual best score
              spark={bestScore > 0 ? [bestScore] : [0]}
            />
            <ReportCard
              title="Latest Score"
              value={latestScore.toString()}
              score={latestScore} // Use actual latest score
              spark={latestScore > 0 ? [latestScore] : [0]}
            />
          </div>
        </div>

        {/* Recent Reports Grid */}
        {reports.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Recent Reports</h2>
              <Button asChild variant="ghost" className="text-emerald-600">
                <Link href="/reports">View all</Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reports.slice(0, 6).map((report) => (
                <RecentReportCard
                  key={report.id}
                  report={report}
                  userName={name}
                />
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Recent Reports</h2>
            </div>
            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Reports Found
                </h3>
                <p className="text-gray-500 mb-4">
                  You haven't generated any reports yet. Start tracking your
                  wellness metrics to see your first report.
                </p>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                  <Link href="/reports">Generate Your First Report</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Connected services */}
        {/* <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Connected services</h2>
            <Button asChild variant="ghost" className="text-emerald-600">
              <Link href="/integrations">See all</Link>
            </Button>
          </div>
          <div className="grid gap-4 mt-3 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((intg) => (
              <IntegrationCard key={intg.key} integration={intg as any} />
            ))}
          </div>
        </section> */}
      </div>
    </DashboardClientWrapper>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${bgColor}`}>
            <Icon className={`size-6 ${color}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BadgeChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-background/70 px-3 py-1 text-sm">
      {label}
    </span>
  );
}

// function TrendCard({
//   title,
//   value,
//   change,
//   color,
//   spark,
// }: {
//   title: string;
//   value: string;
//   change: string;
//   color: string;
//   spark: number[];
// }) {
//   return (
//     <Card>
//       <CardContent className="p-6">
//         <div className="flex items-start justify-between">
//           <div>
//             <div className="text-base text-muted-foreground">{title}</div>
//             <div className="text-2xl font-semibold mt-1">{value}</div>
//             <div className="mt-1 text-sm text-emerald-600">
//               {change} vs. prev
//             </div>
//           </div>
//           <Sparkline values={spark} stroke={color} />
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

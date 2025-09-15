import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import {
  validateIntegrationTokens,
  getExpiredTokens,
  getExpiringSoonTokens,
} from "@/lib/integrations/token-validator";

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient();

    // Get user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's reports
    const { data: reports, error: reportsError } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (reportsError) {
      console.error("❌ [Dashboard API] Error fetching reports:", reportsError);
      return NextResponse.json(
        { error: "Failed to fetch reports" },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = calculateDashboardStats(reports || []);

    // Get recent report
    const recentReport = reports && reports.length > 0 ? reports[0] : null;

    // Get integration token status
    const { data: tokens, error: tokensError } = await supabase
      .from("integration_tokens")
      .select("provider, access_token, refresh_token, expires_at")
      .eq("user_id", user.id);

    if (tokensError) {
      console.error("❌ [Dashboard API] Error fetching tokens:", tokensError);
    }

    // Validate tokens and get status
    const tokenStatus = await validateIntegrationTokens(user.id);
    const expiredTokens = getExpiredTokens(tokenStatus);
    const expiringSoonTokens = getExpiringSoonTokens(tokenStatus);

    // Combine all token statuses
    const allTokenStatus = [
      ...expiredTokens.map((token: any) => ({ ...token, expired: true })),
      ...expiringSoonTokens.map((token: any) => ({ ...token, expired: false })),
    ];

    return NextResponse.json({
      reports: reports || [],
      stats,
      recentReport,
      tokenStatus: allTokenStatus,
    });
  } catch (error) {
    console.error("❌ [Dashboard API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculateDashboardStats(reports: any[]) {
  if (reports.length === 0) {
    return {
      totalReports: 0,
      bestScore: 0,
      latestScore: 0,
      averageScore: 0,
      trend: 0,
    };
  }

  const scores = reports
    .map((report) => report.score)
    .filter((score) => typeof score === "number");

  if (scores.length === 0) {
    return {
      totalReports: reports.length,
      bestScore: 0,
      latestScore: 0,
      averageScore: 0,
      trend: 0,
    };
  }

  const totalReports = reports.length;
  const bestScore = Math.max(...scores);
  const latestScore = scores[0] || 0;
  const averageScore = Math.round(
    scores.reduce((sum, score) => sum + score, 0) / scores.length
  );

  // Calculate trend (comparing last 2 scores)
  let trend = 0;
  if (scores.length >= 2) {
    const current = scores[0];
    const previous = scores[1];
    trend = current - previous;
  }

  return {
    totalReports,
    bestScore,
    latestScore,
    averageScore,
    trend,
  };
}

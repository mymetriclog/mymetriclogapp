import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getServerSession } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await getServerSession();

    // For development/testing, allow access without authentication
    const isDevelopment = process.env.NODE_ENV === "development";
    if (!session?.user && !isDevelopment) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in again" },
        { status: 401 }
      );
    }

    const supabase = await getServerSupabaseClient();

    // Fetch all reports with user information from the database
    
    // Get current user's reports only
    
    // Get current user's reports
    const { data: reports, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", session?.user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Database error:", error);
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }

    // Transform the database data to match the expected format
    
    const transformedReports =
      reports?.map((report) => {
        
        // Since we're only getting current user's reports, use session data
        const userEmail = session?.user?.email || 'Unknown';
        const userName = session?.user?.user_metadata?.full_name || 
                        session?.user?.email?.split('@')[0] || 
                        'Unknown User';
        
        return {
          id: report.id,
          user_id: report.user_id,
          user_email: userEmail,
          user_name: userName,
          date: report.report_date,
          kind: report.report_type,
          score: getScoreFromReport(report),
          html: generateHTMLFromReportData(
            report.report_data,
            report.ai_insights
          ),
          json: report.report_data,
          ai_insights: report.ai_insights,
          created_at: report.created_at,
        };
      }) || [];

    return NextResponse.json({ reports: transformedReports });
  } catch (error) {
    console.error("💥 Unexpected error in reports API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Function to get the actual score from the report data
function getScoreFromReport(report: any): number {
  // First, try to get score from the scores object (as shown in database)
  if (report.scores && typeof report.scores === "object") {
    if (report.scores.total && typeof report.scores.total === "number") {
      return report.scores.total;
    }
    if (report.scores.work && typeof report.scores.work === "number") {
      return report.scores.work;
    }
  }

  // If no scores object, try to get from report_data
  if (report.report_data && typeof report.report_data === "object") {
    if (
      report.report_data.scores &&
      typeof report.report_data.scores === "object"
    ) {
      if (
        report.report_data.scores.total &&
        typeof report.report_data.scores.total === "number"
      ) {
        return report.report_data.scores.total;
      }
      if (
        report.report_data.scores.work &&
        typeof report.report_data.scores.work === "number"
      ) {
        return report.report_data.scores.work;
      }
    }
  }

  // Fallback to calculated score only if no actual score found
  return calculateScoreFromReportData(report.report_data);
}

// Helper function to calculate a score from report data
function calculateScoreFromReportData(reportData: any): number {
  if (!reportData) return 0;

  let score = 0;
  let totalFactors = 0;

  // Check for sleep data
  if (reportData.sleep) {
    const sleepHours = reportData.sleep / 60; // Convert minutes to hours
    if (sleepHours >= 7 && sleepHours <= 9) score += 25;
    else if (sleepHours >= 6 && sleepHours <= 10) score += 20;
    else if (sleepHours >= 5 && sleepHours <= 11) score += 15;
    else score += 10;
    totalFactors++;
  }

  // Check for steps data
  if (reportData.steps) {
    if (reportData.steps >= 10000) score += 25;
    else if (reportData.steps >= 8000) score += 20;
    else if (reportData.steps >= 6000) score += 15;
    else if (reportData.steps >= 4000) score += 10;
    else score += 5;
    totalFactors++;
  }

  // Check for HRV data
  if (reportData.hrv) {
    if (reportData.hrv >= 60) score += 25;
    else if (reportData.hrv >= 50) score += 20;
    else if (reportData.hrv >= 40) score += 15;
    else score += 10;
    totalFactors++;
  }

  // Check for mood data
  if (reportData.mood) {
    const moodScores: { [key: string]: number } = {
      excellent: 25,
      great: 22,
      good: 20,
      positive: 18,
      neutral: 15,
      fair: 12,
      poor: 8,
      negative: 5,
    };
    score += moodScores[reportData.mood.toLowerCase()] || 15;
    totalFactors++;
  }

  // If no factors found, return a default score
  if (totalFactors === 0) return 75;

  // Return average score
  return Math.round(score / totalFactors);
}

// Helper function to generate HTML from report data
function generateHTMLFromReportData(reportData: any, aiInsights: any): string {
  if (!reportData) return "<div>No data available</div>";

  let html = "<div>";

  // Add sleep information
  if (reportData.sleep) {
    const hours = Math.floor(reportData.sleep / 60);
    const minutes = reportData.sleep % 60;
    html += `<strong>Sleep:</strong> ${hours}h ${minutes}m • `;
  }

  // Add HRV information
  if (reportData.hrv) {
    html += `<strong>HRV:</strong> ${reportData.hrv} ms • `;
  }

  // Add steps information
  if (reportData.steps) {
    html += `<strong>Steps:</strong> ${reportData.steps.toLocaleString()} • `;
  }

  // Add mood information
  if (reportData.mood) {
    html += `<em>Mood:</em> ${
      reportData.mood.charAt(0).toUpperCase() + reportData.mood.slice(1)
    } • `;
  }

  // Add recovery information if available
  if (reportData.recovery) {
    html += `<em>Recovery:</em> ${
      reportData.recovery.charAt(0).toUpperCase() + reportData.recovery.slice(1)
    }`;
  }

  // Add AI insights if available
  if (aiInsights?.mantra) {
    html += `<br/><em>Daily Mantra:</em> "${aiInsights.mantra}"`;
  }

  if (aiInsights?.insight) {
    html += `<br/><em>AI Insight:</em> ${aiInsights.insight}`;
  }

  html += "</div>";
  return html;
}

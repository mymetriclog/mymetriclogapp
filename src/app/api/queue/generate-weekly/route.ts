import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { generateWeeklyReport } from "@/lib/reports/weekly-report-generator";
import { generateWeeklyReportEmail } from "@/lib/sendgrid/templates/weekly-email-template";
import { sendEmail } from "@/lib/sendgrid/email-service";

export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const { startDate } = await request.json();
    const reportStartDate = startDate ? new Date(startDate) : undefined;

    console.log("🚀 Generating weekly report for user:", session.user.id);

    // Generate the weekly report
    const reportData = await generateWeeklyReport(
      session.user.id,
      reportStartDate
    );

    // Generate email HTML
    const emailHTML = generateWeeklyReportEmail(reportData);

    // Send email
    await sendEmail(
      session.user.email!,
      `Your Weekly MyMetricLog Report - ${reportData.startDate} to ${reportData.endDate}`,
      emailHTML
    );

    return NextResponse.json({
      success: true,
      message: "Weekly report generated and sent successfully",
      reportData,
    });
  } catch (error) {
    console.error("❌ Error generating weekly report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate weekly report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    console.log("🚀 Generating weekly report for user:", session.user.id);

    // Generate the weekly report
    const reportData = await generateWeeklyReport(session.user.id);

    // Generate email HTML
    const emailHTML = generateWeeklyReportEmail(reportData);

    // Send email
    await sendEmail(
      session.user.email!,
      `Your Weekly MyMetricLog Report - ${reportData.startDate} to ${reportData.endDate}`,
      emailHTML
    );

    return NextResponse.json({
      success: true,
      message: "Weekly report generated and sent successfully",
      reportData,
    });
  } catch (error) {
    console.error("❌ Error generating weekly report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate weekly report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

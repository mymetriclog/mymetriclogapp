import { NextRequest, NextResponse } from "next/server";
import { EmailLogger } from "@/lib/email-logging/email-logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const result = await EmailLogger.getUserEmailLogs(userId, limit);

    if (result.success) {
      return NextResponse.json({
        success: true,
        logs: result.logs,
        message: result.message
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Email logs API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "Failed to fetch email logs"
      },
      { status: 500 }
    );
  }
}

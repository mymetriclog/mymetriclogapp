import { NextRequest, NextResponse } from "next/server";
import { EmailLogger } from "@/lib/email-logging/email-logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const result = await EmailLogger.getUserEmailStats(userId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        stats: result.stats,
        message: result.message,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Email stats API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "Failed to fetch email statistics",
      },
      { status: 500 }
    );
  }
}

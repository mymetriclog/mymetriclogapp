import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "Not authenticated",
          message: "This endpoint requires authentication",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Middleware protection working!",
      user: {
        id: session.user.id,
        email: session.user.email,
        timezone: session.user.user_metadata?.timezone || "UTC",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Test middleware error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

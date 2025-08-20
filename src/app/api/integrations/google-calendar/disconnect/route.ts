import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = await getServerSupabaseClient();

    // Remove the Google Calendar integration tokens
    const { error } = await supabase
      .from("integration_tokens")
      .delete()
      .eq("user_id", session.user.id)
      .eq("provider", "google-calendar");

    if (error) {
      console.error("Failed to disconnect Google Calendar:", error);
      return NextResponse.json(
        { error: "Failed to disconnect Google Calendar" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Google Calendar disconnected successfully",
    });
  } catch (error) {
    console.error("Google Calendar disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Google Calendar" },
      { status: 500 }
    );
  }
}

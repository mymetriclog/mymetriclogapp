import { type NextRequest, NextResponse } from "next/server";
import {
  getServerSession,
  getServerSupabaseClient,
} from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = await getServerSupabaseClient();

    // Remove Google Tasks integration tokens
    const { error } = await supabase
      .from("integration_tokens")
      .delete()
      .eq("user_id", session.user.id)
      .eq("provider", "google-tasks");

    if (error) {
      console.error("Error disconnecting Google Tasks:", error);
      return NextResponse.json(
        { error: "Failed to disconnect Google Tasks" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Google Tasks disconnect error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

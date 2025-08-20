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

    // Remove Gmail integration tokens
    const { error } = await supabase
      .from("integration_tokens")
      .delete()
      .eq("user_id", session.user.id)
      .eq("provider", "gmail");

    if (error) {
      console.error("Error disconnecting Gmail:", error);
      return NextResponse.json(
        { error: "Failed to disconnect Gmail" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gmail disconnect error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import {
  getServerSession,
  getServerSupabaseClient,
} from "@/lib/supabase/server";

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = await getServerSupabaseClient();
    const { error } = await supabase
      .from("integration_tokens")
      .delete()
      .eq("user_id", session.user.id)
      .eq("provider", "spotify");

    if (error) {
      return NextResponse.json(
        { error: "Failed to disconnect" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Disconnect failed" }, { status: 500 });
  }
}

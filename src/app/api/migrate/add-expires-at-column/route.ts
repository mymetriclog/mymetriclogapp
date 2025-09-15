import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseClientWithServiceRole } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await getServerSupabaseClientWithServiceRole();

    // Add the expires_at column to integration_tokens table
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: `
        ALTER TABLE integration_tokens 
        ADD COLUMN IF NOT EXISTS expires_at BIGINT;
      `,
    });

    if (error) {
      console.error("❌ Error adding expires_at column:", error);
      return NextResponse.json(
        {
          error: "Failed to add expires_at column",
          details: error,
        },
        { status: 500 }
      );
    }

    console.log(
      "✅ Successfully added expires_at column to integration_tokens table"
    );

    return NextResponse.json({
      success: true,
      message: "expires_at column added successfully",
    });
  } catch (error) {
    console.error("❌ Migration error:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error,
      },
      { status: 500 }
    );
  }
}

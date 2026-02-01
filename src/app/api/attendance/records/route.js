import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json(
        { error: "classId required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // 🔐 Auth check (professor)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 📊 Fetch attendance records
    const { data, error } = await supabase
      .from("attendance_records")
      .select(`
        id,
        roll_number,
        created_at,
        attendance_sessions (
          id,
          attendance_code,
          code_activated_at
        )
      `)
      .eq("class_id", classId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to fetch attendance" },
        { status: 500 }
      );
    }

    return NextResponse.json({ records: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

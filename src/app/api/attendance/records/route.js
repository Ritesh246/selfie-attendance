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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /**
     * 📊 Fetch attendance with name resolved via:
     * attendance_records → class_students → profiles
     * (NO schema change required)
     */
    const { data, error } = await supabase
      .from("attendance_records")
      .select(`
        roll_number,
        status,
        marked_at,
        class_students!inner (
          profiles (
            full_name
          )
        )
      `)
      .eq("class_id", classId)
      .order("marked_at", { ascending: true });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to fetch attendance" },
        { status: 500 }
      );
    }

    // 🧾 Format for Excel
    const records = data.map((row) => ({
      roll_number: row.roll_number,
      name: row.class_students.profiles.full_name,
      status: row.status,
      date_time: new Date(row.marked_at).toLocaleString("en-IN"),
    }));

    return NextResponse.json({ records });
  } catch (err) {
    console.error("Attendance export error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

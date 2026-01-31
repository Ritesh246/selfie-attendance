import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

// Generate 5-digit numeric code
function generateAttendanceCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export async function POST(req) {
  try {
    const { classId } = await req.json();

    if (!classId) {
      return NextResponse.json(
        { error: "classId required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // 🔑 GET PROFESSOR ID FROM CLASS
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id, professor_id")
      .eq("id", classId)
      .single();

    if (classError || !classData) {
      return NextResponse.json(
        { error: "Invalid class" },
        { status: 404 }
      );
    }

    const attendanceCode = generateAttendanceCode();

    // ✅ CREATE ATTENDANCE SESSION
    const { data, error } = await supabase
      .from("attendance_sessions")
      .insert({
        class_id: classData.id,
        professor_id: classData.professor_id, // ✅ NEVER NULL NOW
        attendance_code: attendanceCode,
        status: "created",
        is_active: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId: data.id,
      attendanceCode: data.attendance_code,
    });

  } catch (err) {
    console.error("Server crash:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

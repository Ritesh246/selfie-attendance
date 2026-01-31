import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";

// Generate 5-digit numeric code
function generateAttendanceCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export async function POST(req) {
  try {
    const { classCode } = await req.json();

    if (!classCode) {
      return NextResponse.json(
        { error: "classCode is required" },
        { status: 400 }
      );
    }

    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id, professor_id")
      .eq("code", classCode)
      .single();


    if (classError || !classData) {
      console.error("Class fetch error:", classError);
      return NextResponse.json(
        { error: "Invalid class" },
        { status: 404 }
      );
    }

    const attendanceCode = generateAttendanceCode();

    // 2️⃣ Insert attendance session
    const { data: session, error: insertError } = await supabase
      .from("attendance_sessions")
      .insert({
        class_id: classData.id,
        professor_id: classData.professor_id,
        attendance_code: attendanceCode,
        is_active: false,
        status: "created"
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    // 3️⃣ Success
    return NextResponse.json({
      session_id: session.id,
      attendance_code: session.attendance_code
    });

  } catch (err) {
    console.error("Create session error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

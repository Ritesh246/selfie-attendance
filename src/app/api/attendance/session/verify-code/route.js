import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

// TEMP for testing (later change to 10)
const CODE_WINDOW_SECONDS = 60;

export async function POST(req) {
  try {
    const { classId, attendanceCode } = await req.json();

    // 1️⃣ Basic validation
    if (!classId || !attendanceCode) {
      return NextResponse.json(
        { error: "classId and attendanceCode are required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // 2️⃣ Fetch valid active session
    const { data: session, error } = await supabase
      .from("attendance_sessions")
      .select("id, code_activated_at")
      .eq("class_id", classId)
      .eq("attendance_code", attendanceCode)
      .eq("status", "active")
      .gte(
        "code_activated_at",
        new Date(Date.now() - CODE_WINDOW_SECONDS * 1000).toISOString()
      )
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: "Attendance window closed or invalid code" },
        { status: 403 }
      );
    }

    // 3️⃣ Success
    return NextResponse.json({
      sessionId: session.id,
      selfieWindowSeconds: 120, // 2 minutes
    });

  } catch (err) {
    console.error("Verify code error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

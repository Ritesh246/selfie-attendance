import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const SELFIE_WINDOW_SECONDS = 120;

export async function POST(req) {
  try {
    const { sessionId, selfRollNumber, neighborRolls, imageBase64 } =
      await req.json();

    // ✅ STRICT validation (this fixes your crash)
    if (
      !sessionId ||
      !imageBase64 ||
      !selfRollNumber ||
      !Array.isArray(neighborRolls)
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();

    // 🔐 Auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ⏱️ Session validation
    const { data: session, error: sErr } = await supabase
      .from("attendance_sessions")
      .select("id, class_id, is_active, code_activated_at")
      .eq("id", sessionId)
      .single();

    if (sErr || !session || !session.is_active) {
      return NextResponse.json(
        { error: "Invalid or inactive session" },
        { status: 403 },
      );
    }

    if (
      Date.now() - new Date(session.code_activated_at).getTime() >
      SELFIE_WINDOW_SECONDS * 1000
    ) {
      return NextResponse.json(
        { error: "Selfie window expired" },
        { status: 403 },
      );
    }

    const classId = session.class_id;

    // 📸 Upload selfie
    const buffer = Buffer.from(
      imageBase64.replace(/^data:image\/\w+;base64,/, ""),
      "base64",
    );

    const filePath = `${classId}/${sessionId}/${user.id}.png`;

    const { error: uploadError } = await supabase.storage
      .from("attendance-selfies")
      .upload(filePath, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error(uploadError);
      return NextResponse.json(
        { error: "Failed to upload selfie" },
        { status: 500 },
      );
    }

    // 🚫 Prevent duplicate submission
    const { data: existing } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("session_id", sessionId)
      .eq("student_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Attendance already submitted" },
        { status: 409 },
      );
    }

    // 🧾 Attendance rows (SAFE)
    const rows = [
      {
        session_id: sessionId,
        class_id: classId,
        student_id: user.id,
        roll_number: String(selfRollNumber).trim(),
        status: "present",
        marked_at: new Date().toISOString(),
      },
      ...neighborRolls.map((roll) => ({
        session_id: sessionId,
        class_id: classId,
        student_id: null,
        roll_number: String(roll).trim(),
        status: "present",
        marked_at: new Date().toISOString(),
      })),
    ];

    const { error: insertError } = await supabase
      .from("attendance_records")
      .insert(rows);

    if (insertError) {
      console.error(insertError);
      return NextResponse.json(
        { error: "Failed to save attendance" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Selfie submit error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(req) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // 1️⃣ Fetch current session
    const { data: session, error: fetchError } = await supabase
      .from("attendance_sessions")
      .select("id, class_id")
      .eq("id", sessionId)
      .single();

    if (fetchError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Deactivate ANY active session for this class
    const { error: deactivateError } = await supabase
      .from("attendance_sessions")
      .update({
        is_active: false,
        status: "created", // ✅ ONLY ALLOWED VALUE
      })
      .eq("class_id", session.class_id)
      .eq("is_active", true);

    if (deactivateError) {
      console.error("Deactivation error:", deactivateError);
      return NextResponse.json(
        { error: "Failed to deactivate old session" },
        { status: 500 }
      );
    }

    // 3️⃣ Activate current session
    const { error: activateError } = await supabase
      .from("attendance_sessions")
      .update({
        is_active: true,
        status: "active",
        code_activated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (activateError) {
      console.error("Activation error:", activateError);
      return NextResponse.json(
        { error: "Activation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Activate route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

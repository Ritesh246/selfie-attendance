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

    const supabase = await createSupabaseServerClient();

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

    // 2️⃣ Deactivate ALL OTHER active sessions for this class
    const { error: deactivateError } = await supabase
      .from("attendance_sessions")
      .update({
        is_active: false,
        status: "created",
      })
      .eq("class_id", session.class_id)
      .neq("id", sessionId)       // 🔒 IMPORTANT SAFETY
      .eq("is_active", true);

    if (deactivateError) {
      console.error("Deactivation error:", deactivateError);
      return NextResponse.json(
        { error: "Failed to deactivate old sessions" },
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

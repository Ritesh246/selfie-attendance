import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";

export async function POST(req) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 },
      );
    }

    // 1️⃣ Get session + class
    const { data: session, error: fetchError } = await supabase
      .from("attendance_sessions")
      .select("id, class_id")
      .eq("id", sessionId)
      .single();

    if (fetchError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // 2️⃣ Deactivate any existing active session for this class
    await supabase
      .from("attendance_sessions")
      .update({
        is_active: false,
        status: "expired",
      })
      .eq("class_id", session.class_id)
      .eq("is_active", true);

    // 3️⃣ Activate current session
    const { error: activateError } = await supabase
      .from("attendance_sessions")
      .update({
        is_active: true,
        status: "active",
        code_activated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    const { data, error } = await supabase
      .from("attendance_sessions")
      .update({
        is_active: true,
        status: "active",
        code_activated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select();

    console.log("Activation update result:", data, error);

    if (activateError) {
      console.error(activateError);
      return NextResponse.json({ error: "Activation failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Activate error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

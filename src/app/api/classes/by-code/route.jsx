import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    console.log("➡️ /api/classes/by-code HIT");

    const { searchParams } = new URL(req.url);
    const classCode = searchParams.get("classCode");

    console.log("📦 classCode:", classCode);

    if (!classCode) {
      return NextResponse.json(
        { error: "classCode is required" },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("classes")
      .select("id, code")
      .eq("code", classCode)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json({
      classId: data.id,
      classCode: data.code,
    });
  } catch (err) {
    console.error("🔥 API crash:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

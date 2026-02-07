import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const SELFIE_WINDOW_SECONDS = 120;
const MAX_NEIGHBORS = 2;

export async function POST(req) {
  try {
    const { sessionId, selfRollNumber, neighborRolls, imageBase64 } =
      await req.json();

    if (
      !sessionId ||
      !imageBase64 ||
      !selfRollNumber ||
      !Array.isArray(neighborRolls)
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (neighborRolls.length > MAX_NEIGHBORS) {
      return NextResponse.json(
        { error: "Maximum 2 neighbors allowed" },
        { status: 400 }
      );
    }

    const cleanedSelfRoll = String(selfRollNumber).trim();
    const cleanedNeighbors = neighborRolls.map((r) => String(r).trim());
    const allRolls = [cleanedSelfRoll, ...cleanedNeighbors];

    if (new Set(allRolls).size !== allRolls.length) {
      return NextResponse.json(
        { error: "Duplicate roll numbers not allowed" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: session } = await supabase
      .from("attendance_sessions")
      .select("id, class_id, is_active, code_activated_at")
      .eq("id", sessionId)
      .single();

    if (!session || !session.is_active) {
      return NextResponse.json(
        { error: "Invalid or inactive session" },
        { status: 403 }
      );
    }

    if (
      Date.now() - new Date(session.code_activated_at).getTime() >
      SELFIE_WINDOW_SECONDS * 1000
    ) {
      return NextResponse.json(
        { error: "Selfie window expired" },
        { status: 403 }
      );
    }

    const buffer = Buffer.from(
      imageBase64.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    const filePath = `${session.class_id}/${sessionId}/${user.id}.png`;

    await supabase.storage
      .from("attendance-selfies")
      .upload(filePath, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    const { data: publicData } = supabase.storage
      .from("attendance-selfies")
      .getPublicUrl(filePath);

    const pythonRes = await fetch(
      `${process.env.FACE_VERIFY_URL}/verify-face`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: session.class_id,
          session_id: sessionId,
          selfie_image_url: publicData.publicUrl,
          students: allRolls.map((r) => ({ roll: Number(r) })),
        }),
      }
    );

    const result = await pythonRes.json();

    return NextResponse.json({
      success: true,
      message: "Attendance processed",
      result,
    });
  } catch (err) {
    console.error("Selfie submit error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

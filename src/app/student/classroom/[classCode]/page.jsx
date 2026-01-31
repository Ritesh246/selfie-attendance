"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StudentClassPage() {
  const { classCode } = useParams();
  const router = useRouter();
 
  const [classId, setClassId] = useState(null);
  const [attendanceCode, setAttendanceCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* --------------------------------------------------
     1️⃣ Fetch classId using classCode (ON PAGE LOAD)
  -------------------------------------------------- */
  useEffect(() => {
    const fetchClassId = async () => {
      try {
        const res = await fetch(
          `/api/classes/by-code?classCode=${classCode}`
        );

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Class not found");
          return;
        }

        setClassId(data.classId);
      } catch (err) {
        console.error(err);
        setError("Failed to load class");
      }
    };

    fetchClassId();
  }, [classCode]);

  /* --------------------------------------------------
     2️⃣ Verify attendance code
  -------------------------------------------------- */
  const handleVerifyCode = async () => {
    if (!attendanceCode.trim()) {
      setError("Please enter attendance code");
      return;
    }

    if (!classId) {
      setError("Class not loaded yet");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/attendance/session/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          attendanceCode,
        }),
      });

      const text = await res.text(); // 🔥 SAFE PARSE
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
        setError(data.error || "Invalid or expired code");
        return;
      }

      // ✅ SUCCESS → go to selfie page
      router.push(
        `/student/classroom/${classCode}/selfie?sessionId=${data.sessionId}`
      );
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------
     UI
  -------------------------------------------------- */
  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>
        Student – {classCode.toUpperCase()} Class
      </h1>

      <p style={{ marginTop: "10px", color: "#aaa" }}>
        Enter the attendance code shared by your professor.
      </p>

      <input
        value={attendanceCode}
        onChange={(e) => setAttendanceCode(e.target.value)}
        placeholder="Enter attendance code"
        disabled={loading}
        style={{
          marginTop: "16px",
          padding: "10px",
          width: "260px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          fontSize: "16px",
        }}
      />

      <div>
        <button
          onClick={handleVerifyCode}
          disabled={loading || !classId}
          className="bg-blue-600 mt-3 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Join"}
        </button>

        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
}
